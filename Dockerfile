# =============================================================
# PedMesa API (PED-117)
# Versão da imagem base fixa: o Dependabot abre PR quando sair uma nova
# (patches e minors do Node 26; a troca de major é manual).
# =============================================================

# ---- Estágio 1: compila o TypeScript ----
FROM node:26.13.1-alpine3.24 AS build

WORKDIR /app

# Manifestos primeiro, para aproveitar o cache do Docker quando só o código muda
COPY package.json package-lock.json ./
# --ignore-scripts: o "prepare" (Husky) não tem utilidade dentro da imagem
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Estágio 2: só o necessário para rodar ----
FROM node:26.13.1-alpine3.24 AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Commit da imagem, informado pelo pipeline. Aparece em GET /health ("versao") e
# é o que a verificação final do deploy compara com o commit publicado.
ARG GIT_SHA=desenvolvimento
ENV APP_VERSION=$GIT_SHA

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY entrypoint.sh ./entrypoint.sh

# O processo roda como o usuário "node" (uid 1000), nunca como root
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Liveness: /health não consulta o banco, então só reprova se o processo travar
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT:-3000}/health" || exit 1

# Aplica as migrations pendentes e então sobe a API (ver entrypoint.sh)
ENTRYPOINT ["sh", "./entrypoint.sh"]
