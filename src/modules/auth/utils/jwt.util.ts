import * as dotenv from "dotenv";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../../usuarios/entities/user.entity";

dotenv.config();

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  roles: UserRole[];
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não configurado nas variáveis de ambiente.");
  }

  return secret;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
