import { NextFunction, Request, Response } from "express";
import { clearSuperAdminAuthCookie, clearTenantAuthCookie, setSuperAdminAuthCookie, setTenantAuthCookie } from "../../../shared/utils/auth-cookies";
import { assertValidLoginDto } from "../dtos/login.dto";
import { AuthService } from "../services/auth.service";
import { DEFAULT_JWT_EXPIRES_IN } from "../utils/jwt.util";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = assertValidLoginDto(req.body);
    const result = await AuthService.login(dto);
    const { token, ...body } = result;

    if (result.tipo === "tenant") {
      setTenantAuthCookie(res, token, DEFAULT_JWT_EXPIRES_IN);
    } else {
      setSuperAdminAuthCookie(res, token, DEFAULT_JWT_EXPIRES_IN);
    }

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}

// O front não consegue limpar um cookie HttpOnly sozinho — por isso logout agora
// precisa de uma chamada ao backend. Sem middleware de auth de propósito: logout
// deve funcionar mesmo com um token já expirado/inválido (idempotente).
export function logout(_req: Request, res: Response): void {
  clearTenantAuthCookie(res);
  res.status(200).json({ mensagem: "Sessão encerrada." });
}

export function adminLogout(_req: Request, res: Response): void {
  clearSuperAdminAuthCookie(res);
  res.status(200).json({ mensagem: "Sessão encerrada." });
}
