import { AppError } from "../../../shared/errors/app-error";

export type PeriodoDashboard = "hoje" | "7_dias" | "30_dias" | "customizado";

const PERIODOS_VALIDOS: PeriodoDashboard[] = ["hoje", "7_dias", "30_dias", "customizado"];
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface DashboardFiltroDto {
  periodo: PeriodoDashboard;
  dataInicio?: string;
  dataFim?: string;
}

export function assertValidDashboardFiltroDto(query: unknown): DashboardFiltroDto {
  const { periodo, data_inicio: dataInicio, data_fim: dataFim } = (query ?? {}) as Record<string, unknown>;

  const periodoResolvido =
    typeof periodo === "string" && PERIODOS_VALIDOS.includes(periodo as PeriodoDashboard)
      ? (periodo as PeriodoDashboard)
      : "hoje";

  if (periodoResolvido !== "customizado") {
    return { periodo: periodoResolvido };
  }

  if (typeof dataInicio !== "string" || !DATA_REGEX.test(dataInicio)) {
    throw new AppError("Para o período customizado, informe data_inicio no formato YYYY-MM-DD.", 400);
  }

  if (typeof dataFim !== "string" || !DATA_REGEX.test(dataFim)) {
    throw new AppError("Para o período customizado, informe data_fim no formato YYYY-MM-DD.", 400);
  }

  if (dataInicio > dataFim) {
    throw new AppError("data_inicio não pode ser depois de data_fim.", 400);
  }

  return { periodo: periodoResolvido, dataInicio, dataFim };
}
