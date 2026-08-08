import * as dotenv from "dotenv";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../../usuarios/entities/user.entity";

dotenv.config();

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  roles: UserRole[];
  pode_excluir_item_fechamento: boolean;
  pode_conceder_desconto: boolean;
  // Presente somente em tokens gerados via "Acessar como" (PED-41) — o id do
  // super-admin que iniciou a sessão de impersonation. authMiddleware propaga
  // isso para req.user, pra qualquer ação/log poder registrar quem realmente
  // está por trás da requisição.
  impersonated_by?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não configurado nas variáveis de ambiente.");
  }

  return secret;
}

export function signToken(payload: JwtPayload, options?: { expiresIn?: SignOptions["expiresIn"] }): string {
  const signOptions: SignOptions = {
    expiresIn: options?.expiresIn ?? ((process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"]),
  };

  return jwt.sign(payload, getJwtSecret(), signOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export interface SuperAdminJwtPayload {
  sub: string;
  type: "super_admin";
}

function getSuperAdminJwtSecret(): string {
  const secret = process.env.SUPER_ADMIN_JWT_SECRET;

  if (!secret) {
    throw new Error("SUPER_ADMIN_JWT_SECRET não configurado nas variáveis de ambiente.");
  }

  return secret;
}

// Assinado com um secret próprio (não o JWT_SECRET dos tenants) para que um
// token nunca possa ser validado pelo middleware errado, mesmo por engano —
// a verificação falha na camada de criptografia, não depende de checar um
// campo específico do payload.
export function signSuperAdminToken(payload: SuperAdminJwtPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, getSuperAdminJwtSecret(), options);
}

export function verifySuperAdminToken(token: string): SuperAdminJwtPayload {
  return jwt.verify(token, getSuperAdminJwtSecret()) as SuperAdminJwtPayload;
}
