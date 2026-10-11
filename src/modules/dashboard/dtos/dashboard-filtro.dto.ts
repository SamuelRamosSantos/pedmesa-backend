import { AppError } from "../../../shared/errors/app-error";
import { TipoAtendimento } from "../../comandas/entities/comanda.entity";

export type PeriodoDashboard = "hoje" | "7_dias" | "30_dias" | "customizado";

const PERIODOS_VALIDOS: PeriodoDashboard[] = ["hoje", "7_dias", "30_dias", "customizado"];
const TIPOS_VALIDOS = Object.values(TipoAtendimento);
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface DashboardFiltroDto {
  periodo: PeriodoDashboard;
  dataInicio?: string;
  dataFim?: string;
  // Sem tipo: mesa e delivery juntos (PED-103).
  tipo?: TipoAtendimento;
}

function validarTipo(tipo: unknown): TipoAtendimento | undefined {
  if (tipo === undefined || tipo === "") {
    return undefined;
  }

  if (typeof tipo !== "string" || !TIPOS_VALIDOS.includes(tipo as TipoAtendimento)) {
    throw new AppError(`tipo deve ser um dos seguintes: ${TIPOS_VALIDOS.join(", ")}.`, 400);
  }

  return tipo as TipoAtendimento;
}

function validarPeriodo(
  periodo: PeriodoDashboard,
  dataInicio: unknown,
  dataFim: unknown
): Pick<DashboardFiltroDto, "periodo" | "dataInicio" | "dataFim"> {
  if (periodo !== "customizado") {
    return { periodo };
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

  return { periodo, dataInicio, dataFim };
}

export function assertValidDashboardFiltroDto(query: unknown): DashboardFiltroDto {
  const { periodo, data_inicio: dataInicio, data_fim: dataFim, tipo } = (query ?? {}) as Record<string, unknown>;

  const periodoResolvido =
    typeof periodo === "string" && PERIODOS_VALIDOS.includes(periodo as PeriodoDashboard)
      ? (periodo as PeriodoDashboard)
      : "hoje";

  const tipoValidado = validarTipo(tipo);
  const filtroPeriodo = validarPeriodo(periodoResolvido, dataInicio, dataFim);

  return tipoValidado === undefined ? filtroPeriodo : { ...filtroPeriodo, tipo: tipoValidado };
}
