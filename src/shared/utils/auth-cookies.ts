import { CookieOptions, Response } from "express";
import { parseDurationToMs } from "./parse-duration";

// PED-76: o token nunca mais é devolvido no corpo da resposta — ele vai só nesses
// cookies HttpOnly, invisíveis para qualquer script rodando na página (mitiga
// roubo de token via XSS). Dois nomes distintos porque tenant e super-admin podem
// estar autenticados ao mesmo tempo no mesmo navegador (ver PED-41, impersonation)
// — exatamente o mesmo motivo pelo qual antes eram duas chaves de localStorage
// separadas.
export const TENANT_COOKIE_NAME = "pedmesa_token";
export const SUPER_ADMIN_COOKIE_NAME = "pedmesa_admin_token";

// Secure exige HTTPS — em dev local a API roda em http://localhost, então um
// cookie Secure=true seria descartado silenciosamente pelo navegador e o login
// pareceria "funcionar" (200 OK) mas nenhuma requisição autenticada depois
// funcionaria. Por isso o flag é condicional ao ambiente, não sempre true.
const isProduction = process.env.NODE_ENV === "production";

function baseCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

// Usado também para limpar (res.clearCookie) — precisa dos mesmos atributos
// (exceto maxAge/value) usados ao criar o cookie, senão o navegador não reconhece
// como o mesmo cookie e não remove.
function clearCookieOptions(): CookieOptions {
  return { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/" };
}

export function setTenantAuthCookie(res: Response, token: string, expiresIn: string): void {
  res.cookie(TENANT_COOKIE_NAME, token, baseCookieOptions(parseDurationToMs(expiresIn)));
}

export function setSuperAdminAuthCookie(res: Response, token: string, expiresIn: string): void {
  res.cookie(SUPER_ADMIN_COOKIE_NAME, token, baseCookieOptions(parseDurationToMs(expiresIn)));
}

export function clearTenantAuthCookie(res: Response): void {
  res.clearCookie(TENANT_COOKIE_NAME, clearCookieOptions());
}

export function clearSuperAdminAuthCookie(res: Response): void {
  res.clearCookie(SUPER_ADMIN_COOKIE_NAME, clearCookieOptions());
}
