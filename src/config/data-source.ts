import "reflect-metadata";
import { join } from "node:path";
import { DataSource, DataSourceOptions } from "typeorm";
import { carregarEnv } from "./env";
import { assertBancoDeTeste } from "./test-database-guard";

carregarEnv();
// Vale para a API, para a CLI de migrations e para o seed: em modo de teste,
// nenhum desses caminhos consegue abrir conexão com um banco que não seja o de testes.
assertBancoDeTeste(process.env);

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [join(__dirname, "..", "modules/**/entities/*.{ts,js}")],
  migrations: [join(__dirname, "..", "database/migrations/*.{ts,js}")],
  migrationsTableName: "migrations",
};

export const AppDataSource = new DataSource(dataSourceOptions);
