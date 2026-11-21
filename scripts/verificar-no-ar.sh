#!/usr/bin/env bash
# Verificação final do deploy (PED-119): a aplicação está no ar E é a versão nova?
#
#   scripts/verificar-no-ar.sh <url-base> <api|web> <commit-esperado>
#
# - api: GET /health deve responder 200 com "versao" igual ao commit, e GET /ready 200.
# - web: GET / deve responder 200 e GET /versao.txt deve conter o commit.
# A imagem recebe o commit no build (GIT_SHA): se a versão no ar for outra, o
# Coolify não trocou o container e o deploy não valeu.
set -u

# jq lê as respostas JSON (já vem instalado nos runners do GitHub)
if ! command -v jq >/dev/null 2>&1; then
  echo "::error title=Dependência ausente::jq não encontrado. Instale o jq para rodar este script."
  exit 1
fi

if [ $# -ne 3 ] || { [ "$2" != "api" ] && [ "$2" != "web" ]; }; then
  echo "Uso: $0 <url-base> <api|web> <commit-esperado>" >&2
  exit 2
fi

BASE="${1%/}"
PERFIL="$2"
ESPERADO="$3"
TENTATIVAS="${TENTATIVAS:-12}"
INTERVALO="${INTERVALO:-15}"
PROBLEMA=""

resumo() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

# GET sem cache (parâmetro aleatório: o proxy da Cloudflare não serve cópia antiga)
buscar() {
  RESPOSTA="$(curl --silent --show-error --max-time 15 -H 'Cache-Control: no-cache' \
    -w $'\n%{http_code}' "$1?nocache=$(date +%s%N)" 2>&1)"
  CODIGO="${RESPOSTA##*$'\n'}"
  CORPO="${RESPOSTA%$'\n'*}"
}

descrever_codigo() {
  case "$1" in
    000) echo "sem resposta (DNS, certificado ou servidor fora do ar)" ;;
    502|504) echo "HTTP $1: o proxy não alcança o container (porta errada no Coolify ou container reiniciando)" ;;
    503) echo "HTTP 503: no ar, mas sem banco de dados" ;;
    *) echo "HTTP $1" ;;
  esac
}

checar_api() {
  buscar "$BASE/health"
  if [ "$CODIGO" != "200" ]; then PROBLEMA="/health: $(descrever_codigo "$CODIGO")"; return 1; fi

  local versao
  versao="$(printf '%s' "$CORPO" | jq -r '.versao // "ausente"' 2>/dev/null || echo "inválida")"
  if [ "$versao" != "$ESPERADO" ]; then
    PROBLEMA="a versão no ar é '$versao', esperada '$ESPERADO' (o container antigo continua rodando)"
    return 1
  fi

  buscar "$BASE/ready"
  if [ "$CODIGO" != "200" ]; then PROBLEMA="/ready: $(descrever_codigo "$CODIGO")"; return 1; fi
  return 0
}

checar_web() {
  buscar "$BASE/"
  if [ "$CODIGO" != "200" ]; then PROBLEMA="/: $(descrever_codigo "$CODIGO")"; return 1; fi

  buscar "$BASE/versao.txt"
  local versao
  versao="$(printf '%s' "$CORPO" | tr -d '[:space:]' | head -c 64)"
  if [ "$CODIGO" != "200" ] || [ "$versao" != "$ESPERADO" ]; then
    PROBLEMA="a versão no ar é '${versao:-ausente}', esperada '$ESPERADO' (o container antigo continua rodando)"
    return 1
  fi
  return 0
}

for tentativa in $(seq 1 "$TENTATIVAS"); do
  if [ "$PERFIL" = "api" ]; then checar_api; else checar_web; fi && {
    echo "✅ $BASE está no ar com a versão $ESPERADO (tentativa $tentativa)."
    resumo "### ✅ No ar"$'\n\n'"$BASE responde com a versão \`$ESPERADO\`."
    exit 0
  }
  echo "Tentativa $tentativa de $TENTATIVAS: $PROBLEMA. Nova tentativa em ${INTERVALO}s."
  sleep "$INTERVALO"
done

echo "::error title=Aplicação fora do ar ou versão antiga::$BASE — $PROBLEMA"
resumo "### ❌ Verificação final falhou"$'\n\n'"$BASE — $PROBLEMA"$'\n\n'"Veja o log do container no Coolify. Causas comuns: variável de ambiente faltando (a API recusa subir), migration falhando no start, porta errada (3000 na API, 8080 no app e no site)."
exit 1
