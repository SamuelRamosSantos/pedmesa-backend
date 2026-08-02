import "reflect-metadata";
import { join } from "path";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

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
