/// <reference types="vite/client" />

// O data-source encontra entidades e migrations por glob de arquivos, e o TypeORM
// carrega esses arquivos com o require nativo do Node. Dentro do Vitest isso falha
// ("TypeScript enum is not supported in strip-only mode") e, mesmo que carregasse,
// criaria classes diferentes das que os services importam. Aqui o próprio Vite carrega
// os módulos, e o setup entrega ao TypeORM essas mesmas classes.

type Classe = abstract new (...args: never[]) => unknown;

function classesExportadas(modulos: Record<string, unknown>): Classe[] {
  return Object.values(modulos).flatMap((modulo) =>
    Object.values(modulo as Record<string, unknown>).filter(
      (exportado): exportado is Classe => typeof exportado === "function",
    ),
  );
}

// Classes sem @Entity (se houver) são ignoradas pelo TypeORM ao montar os metadados.
export const entidades = classesExportadas(
  import.meta.glob("../../src/modules/**/entities/*.entity.ts", {
    eager: true,
  }),
);

export const migrations = classesExportadas(
  import.meta.glob("../../src/database/migrations/*.ts", { eager: true }),
);
