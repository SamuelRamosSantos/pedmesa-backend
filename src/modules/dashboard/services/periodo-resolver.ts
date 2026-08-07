import { DashboardFiltroDto } from "../dtos/dashboard-filtro.dto";

export interface IntervaloData {
  inicio: Date;
  fim: Date;
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);
}

function fimDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59, 999);
}

export function resolverIntervaloPeriodo(dto: DashboardFiltroDto, agora: Date = new Date()): IntervaloData {
  if (dto.periodo === "customizado") {
    return {
      inicio: inicioDoDia(new Date(`${dto.dataInicio}T00:00:00`)),
      fim: fimDoDia(new Date(`${dto.dataFim}T00:00:00`)),
    };
  }

  const fim = fimDoDia(agora);

  if (dto.periodo === "hoje") {
    return { inicio: inicioDoDia(agora), fim };
  }

  const dias = dto.periodo === "7_dias" ? 6 : 29;
  const inicio = inicioDoDia(agora);
  inicio.setDate(inicio.getDate() - dias);

  return { inicio, fim };
}
