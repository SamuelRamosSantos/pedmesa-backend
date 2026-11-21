#!/bin/sh
set -e

# Aplica as migrations pendentes antes de subir a API: um deploy nunca roda
# código novo sobre um banco sem as colunas que ele espera. Se uma migration
# falhar, o container para aqui e o Coolify mantém a versão anterior no ar.
echo "[entrypoint] Aplicando migrations pendentes..."
node ./node_modules/typeorm/cli.js migration:run -d dist/config/data-source.js

echo "[entrypoint] Iniciando a API..."
exec node dist/server.js
