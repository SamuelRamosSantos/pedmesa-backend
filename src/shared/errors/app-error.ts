export class AppError extends Error {
  public readonly statusCode: number;
  // Campos extras devolvidos no corpo junto com `message` (ex.: o estado atual de um
  // recurso num 409 de concorrência). Nunca coloque dados de outro tenant aqui.
  public readonly extras?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, extras?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.extras = extras;
  }
}
