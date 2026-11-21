#!/usr/bin/env bash
# Verificação de segurança pós-deploy (PED-120).
#
# Uso: scripts/check-security-headers.sh <url-base> <api|web>
#   CHECK_MODE=report (padrão): lista os problemas e sai com 0.
#   CHECK_MODE=enforce: sai com 1 se houver qualquer problema.
#
# Confere os itens do scan de 08/08/2026 (PED-59, PED-64 e PED-69): HSTS,
# nosniff, anti-clickjacking, CSP, cabeçalhos duplicados, X-Powered-By, versão
# no Server, compressão de respostas dinâmicas e IP privado na resposta.
set -u

if [ $# -ne 2 ] || { [ "$2" != "api" ] && [ "$2" != "web" ]; }; then
  echo "Uso: $0 <url-base> <api|web>" >&2
  exit 2
fi

BASE="${1%/}"
PERFIL="$2"
MODO="${CHECK_MODE:-report}"
FALHAS=0
RELATORIO=""

registrar() { RELATORIO="${RELATORIO}$1"$'\n'; }
ok() { registrar "✅ $1"; }
falha() { registrar "❌ $1"; FALHAS=$((FALHAS + 1)); }

# Devolve só os cabeçalhos da resposta (sem \r), seguindo no máximo 0 redirects.
cabecalhos() { curl -sS -D - -o /dev/null --max-time 20 "$@" | tr -d '\r'; }
valor() { printf '%s\n' "$2" | grep -i "^$1:" | head -1 | cut -d: -f2- | sed 's/^ *//'; }
contar() { printf '%s\n' "$2" | grep -ci "^$1:"; }

verificar_cabecalhos() {
  local rotulo="$1" url="$2" h csp xfo hsts maxage server
  h="$(cabecalhos "$url")" || { falha "[$rotulo] não foi possível acessar $url"; return; }

  hsts="$(valor strict-transport-security "$h")"
  maxage="$(printf '%s' "$hsts" | grep -oiE 'max-age=[0-9]+' | cut -d= -f2)"
  if [ -n "$maxage" ] && [ "$maxage" -ge 31536000 ]; then ok "[$rotulo] HSTS com max-age >= 1 ano"
  else falha "[$rotulo] Strict-Transport-Security ausente ou com max-age < 31536000"; fi

  if [ "$(valor x-content-type-options "$h" | tr 'A-Z' 'a-z')" = "nosniff" ]; then ok "[$rotulo] X-Content-Type-Options: nosniff"
  else falha "[$rotulo] X-Content-Type-Options: nosniff ausente"; fi

  csp="$(valor content-security-policy "$h")"
  xfo="$(valor x-frame-options "$h" | tr 'a-z' 'A-Z')"
  if [ "$xfo" = "DENY" ] || printf '%s' "$csp" | grep -q "frame-ancestors 'none'"; then ok "[$rotulo] proteção anti-clickjacking"
  else falha "[$rotulo] sem X-Frame-Options: DENY nem CSP frame-ancestors 'none'"; fi

  if [ -z "$csp" ]; then
    falha "[$rotulo] Content-Security-Policy ausente (Report-Only não conta)"
  elif [ "$PERFIL" = "api" ] && ! { printf '%s' "$csp" | grep -q "default-src 'none'" && printf '%s' "$csp" | grep -q "frame-ancestors 'none'"; }; then
    falha "[$rotulo] CSP da API sem default-src 'none' e frame-ancestors 'none'"
  else
    ok "[$rotulo] Content-Security-Policy presente"
  fi

  local nome
  for nome in strict-transport-security x-content-type-options x-frame-options content-security-policy; do
    if [ "$(contar "$nome" "$h")" -gt 1 ]; then falha "[$rotulo] cabeçalho $nome duplicado (proxy e imagem configurando o mesmo?)"; fi
  done

  if [ "$(contar x-powered-by "$h")" -eq 0 ]; then ok "[$rotulo] sem X-Powered-By"
  else falha "[$rotulo] X-Powered-By presente: $(valor x-powered-by "$h")"; fi

  server="$(valor server "$h")"
  if printf '%s' "$server" | grep -q '[0-9]'; then falha "[$rotulo] Server expõe versão: $server"
  else ok "[$rotulo] Server sem versão (${server:-ausente})"; fi
}

if [ "$PERFIL" = "api" ]; then
  PRINCIPAL="$BASE/health"
  verificar_cabecalhos "health" "$PRINCIPAL"
  verificar_cabecalhos "404" "$BASE/api/v1/rota-inexistente-verificacao"
else
  PRINCIPAL="$BASE/"
  verificar_cabecalhos "página" "$PRINCIPAL"
fi

# Compressão em resposta dinâmica (BREACH, PED-69)
H_GZIP="$(cabecalhos -H 'Accept-Encoding: gzip, br' "$PRINCIPAL")"
if [ "$(contar content-encoding "$H_GZIP")" -eq 0 ]; then ok "sem compressão na resposta principal"
else falha "resposta principal comprimida (Content-Encoding: $(valor content-encoding "$H_GZIP"))"; fi

# IP privado nos cabeçalhos ou no corpo (PED-64)
IP_PRIVADO='(^|[^0-9.])(10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3})'
RESPOSTA="$(curl -sS -i --max-time 20 "$PRINCIPAL" 2>/dev/null)"
if printf '%s' "$RESPOSTA" | grep -qE "$IP_PRIVADO"; then falha "IP privado na resposta de $PRINCIPAL"
else ok "nenhum IP privado na resposta"; fi

TITULO="Verificação de segurança: $BASE ($PERFIL, modo $MODO) — $FALHAS problema(s)"
printf '%s\n\n%s' "$TITULO" "$RELATORIO"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  printf '### %s\n\n%s\n' "$TITULO" "$(printf '%s' "$RELATORIO" | sed 's/^/- /')" >> "$GITHUB_STEP_SUMMARY"
fi

if [ "$FALHAS" -gt 0 ] && [ "$MODO" = "enforce" ]; then
  exit 1
fi
exit 0
