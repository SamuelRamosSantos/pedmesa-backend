#!/usr/bin/env bash
# Deploy pelo Coolify (PED-119), usado pelo deploy.yml.
#
#   scripts/coolify-deploy.sh disparar          -> pede o deploy; grava "uuid" no GITHUB_OUTPUT
#   scripts/coolify-deploy.sh aguardar <uuid>   -> espera terminar; se falhar, mostra o log do Coolify
#
# Variáveis: COOLIFY_URL (só o endereço do painel, ex.: https://coolify.exemplo.com),
# COOLIFY_APP_UUID e COOLIFY_TOKEN (token de API com permissão de deploy).
set -u

# jq lê as respostas JSON (já vem instalado nos runners do GitHub)
if ! command -v jq >/dev/null 2>&1; then
  echo "::error title=Dependência ausente::jq não encontrado. Instale o jq para rodar este script."
  exit 1
fi

erro() {
  # Anotação no GitHub (aparece no topo do run) + resumo do job
  echo "::error title=Deploy no Coolify::$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    printf '### ❌ Deploy no Coolify\n\n%s\n\n' "$1" >> "$GITHUB_STEP_SUMMARY"
  fi
}

resumo() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

validar_configuracao() {
  local faltando=()
  [ -z "${COOLIFY_URL:-}" ] && faltando+=("COOLIFY_URL (Variable)")
  [ -z "${COOLIFY_APP_UUID:-}" ] && faltando+=("COOLIFY_APP_UUID (Variable)")
  [ -z "${COOLIFY_TOKEN:-}" ] && faltando+=("COOLIFY_TOKEN (Secret)")

  if [ ${#faltando[@]} -gt 0 ]; then
    echo "::warning title=Deploy não configurado::Faltam no environment: ${faltando[*]}. A imagem foi publicada, mas nada foi implantado."
    resumo "### ⚠️ Deploy não configurado"$'\n\n'"Faltam no environment: ${faltando[*]}. A imagem foi publicada, mas nada foi implantado (ver docs/CICD.md)."
    exit 0
  fi

  # Remove espaços e quebras de linha que costumam vir de um copiar e colar
  COOLIFY_URL="$(printf '%s' "$COOLIFY_URL" | tr -d '[:space:]')"
  COOLIFY_APP_UUID="$(printf '%s' "$COOLIFY_APP_UUID" | tr -d '[:space:]')"
  COOLIFY_TOKEN="$(printf '%s' "$COOLIFY_TOKEN" | tr -d '[:space:]')"
  COOLIFY_URL="${COOLIFY_URL%/}"

  if ! printf '%s' "$COOLIFY_URL" | grep -qE '^https?://[^/?#]+$'; then
    erro "COOLIFY_URL deve ser só o endereço do painel do Coolify (ex.: https://coolify.exemplo.com), sem caminho nem parâmetros. Valor atual: $COOLIFY_URL"
    exit 1
  fi

  # Engano comum: colar a URL do "Deploy Webhook" do Coolify no lugar do UUID.
  # Nesse caso o UUID é extraído da própria URL, com um aviso para corrigir.
  if printf '%s' "$COOLIFY_APP_UUID" | grep -qE '[?&]uuid='; then
    local extraido
    extraido="$(printf '%s' "$COOLIFY_APP_UUID" | sed -E 's/.*[?&]uuid=([^&]+).*/\1/')"
    echo "::warning title=COOLIFY_APP_UUID com a URL do webhook::A variável tem a URL inteira do Deploy Webhook. Usando o UUID '$extraido'; corrija a variável para conter só ele."
    COOLIFY_APP_UUID="$extraido"
  fi

  if ! printf '%s' "$COOLIFY_APP_UUID" | grep -qE '^[A-Za-z0-9]+$'; then
    erro "COOLIFY_APP_UUID deve ser só o UUID da aplicação no Coolify (letras e números, ex.: f1ey1p82cb6xiqgflrmpwnme), que aparece na URL da aplicação no painel. Valor atual: $COOLIFY_APP_UUID"
    exit 1
  fi
}

# Faz a chamada à API do Coolify. Deixa o status em $STATUS e o corpo em $CORPO.
chamar() {
  local metodo="$1" caminho="$2"
  CORPO="$(curl --silent --show-error --max-time 60 -X "$metodo" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Accept: application/json" \
    -w $'\n%{http_code}' "$COOLIFY_URL$caminho" 2>&1)"
  STATUS="${CORPO##*$'\n'}"
  CORPO="${CORPO%$'\n'*}"
}

explicar_status() {
  case "$1" in
    000) echo "Não foi possível conectar em $COOLIFY_URL (DNS, firewall ou o painel fora do ar). Confira a variável COOLIFY_URL." ;;
    401) echo "Token recusado (401). Confira o secret COOLIFY_TOKEN: o token pode ter sido apagado ou copiado com erro." ;;
    403) echo "Token sem permissão (403). Crie o token em Keys & Tokens > API tokens com a permissão de deploy (ou root)." ;;
    404) echo "Não encontrado (404). Confira se COOLIFY_APP_UUID é o UUID da aplicação certa e se COOLIFY_URL aponta para o painel do Coolify." ;;
    405) echo "Método não aceito (405). A API do Coolify recusou o POST em /api/v1/deploy: confira se COOLIFY_URL aponta para o painel do Coolify, não para a aplicação." ;;
    429) echo "Limite de requisições da API do Coolify atingido (429). Tente rodar o deploy de novo em alguns minutos." ;;
    5??) echo "Erro interno do Coolify ($1). Veja o log do painel do Coolify." ;;
    *) echo "Resposta inesperada do Coolify (HTTP $1)." ;;
  esac
}

disparar() {
  validar_configuracao
  echo "Pedindo o deploy da aplicação $COOLIFY_APP_UUID em $COOLIFY_URL..."
  chamar POST "/api/v1/deploy?uuid=${COOLIFY_APP_UUID}&force=false"

  if [ "$STATUS" -lt 200 ] || [ "$STATUS" -ge 300 ]; then
    erro "$(explicar_status "$STATUS") Resposta: $(printf '%s' "$CORPO" | head -c 300)"
    exit 1
  fi

  local deployment
  deployment="$(printf '%s' "$CORPO" | jq -r '.deployments[0].deployment_uuid // empty' 2>/dev/null)"
  if [ -z "$deployment" ]; then
    erro "O Coolify aceitou o pedido, mas não devolveu o identificador do deploy. Resposta: $(printf '%s' "$CORPO" | head -c 300)"
    exit 1
  fi

  echo "Deploy na fila: $deployment"
  echo "uuid=$deployment" >> "${GITHUB_OUTPUT:-/dev/null}"
}

mostrar_log_do_deploy() {
  local logs
  logs="$(printf '%s' "$CORPO" | jq -r '
      (.logs // "[]") | (try fromjson catch [])
      | map(select(.hidden != true)) | .[-40:] | .[] | .output' 2>/dev/null)"

  if [ -n "$logs" ]; then
    echo "::group::Últimas linhas do log do deploy no Coolify"
    printf '%s\n' "$logs"
    echo "::endgroup::"
    resumo $'**Últimas linhas do log do Coolify:**\n\n```\n'"$(printf '%s' "$logs" | tail -n 20)"$'\n```'
  else
    echo "O Coolify não devolveu o log deste deploy; veja no painel."
  fi
}

aguardar() {
  local deployment="$1" status="" tentativa
  validar_configuracao

  for tentativa in $(seq 1 60); do
    chamar GET "/api/v1/deployments/${deployment}"

    if [ "$STATUS" != "200" ]; then
      echo "Tentativa $tentativa: não consegui consultar o deploy ($(explicar_status "$STATUS"))."
    else
      status="$(printf '%s' "$CORPO" | jq -r '.status // "desconhecido"')"
      echo "Tentativa $tentativa: $status"
      case "$status" in
        finished)
          echo "Deploy concluído no Coolify."
          resumo "### ✅ Deploy concluído no Coolify ($deployment)"
          exit 0 ;;
        failed|cancelled*|error)
          erro "O deploy terminou com status '$status' no Coolify (deploy $deployment). Causas comuns: a imagem não pôde ser baixada do GHCR (falta o docker login no servidor), variável de ambiente faltando no Coolify ou o container não subiu (health check falhando)."
          mostrar_log_do_deploy
          exit 1 ;;
      esac
    fi
    sleep 10
  done

  erro "O deploy $deployment não terminou em 10 minutos (último status: ${status:-desconhecido})."
  exit 1
}

case "${1:-}" in
  disparar) disparar ;;
  aguardar) aguardar "${2:?informe o uuid do deploy}" ;;
  *) echo "Uso: $0 disparar | aguardar <uuid>" >&2; exit 2 ;;
esac
