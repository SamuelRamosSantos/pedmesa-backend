import { UserRole } from "../../modules/usuarios/entities/user.entity";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        roles: UserRole[];
        podeExcluirItemFechamento: boolean;
      };
      tenantId?: string;
    }
  }
}

export {};
