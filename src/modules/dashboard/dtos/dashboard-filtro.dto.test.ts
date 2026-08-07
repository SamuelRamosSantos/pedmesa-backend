import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidDashboardFiltroDto } from "./dashboard-filtro.dto";

describe("assertValidDashboardFiltroDto", () => {
  it("usa 'hoje' como padrão quando periodo não é informado", () => {
    expect(assertValidDashboardFiltroDto({})).toEqual({ periodo: "hoje" });
  });

  it("usa 'hoje' como padrão quando periodo é inválido", () => {
    expect(assertValidDashboardFiltroDto({ periodo: "ano_passado" })).toEqual({ periodo: "hoje" });
  });

  it("aceita periodo '7_dias'", () => {
    expect(assertValidDashboardFiltroDto({ periodo: "7_dias" })).toEqual({ periodo: "7_dias" });
  });

  it("aceita periodo '30_dias'", () => {
    expect(assertValidDashboardFiltroDto({ periodo: "30_dias" })).toEqual({ periodo: "30_dias" });
  });

  it("aceita periodo 'customizado' com data_inicio e data_fim válidos", () => {
    const dto = assertValidDashboardFiltroDto({
      periodo: "customizado",
      data_inicio: "2026-08-01",
      data_fim: "2026-08-10",
    });

    expect(dto).toEqual({ periodo: "customizado", dataInicio: "2026-08-01", dataFim: "2026-08-10" });
  });

  it("rejeita 'customizado' sem data_inicio", () => {
    expect(() => assertValidDashboardFiltroDto({ periodo: "customizado", data_fim: "2026-08-10" })).toThrow(
      AppError
    );
  });

  it("rejeita 'customizado' sem data_fim", () => {
    expect(() => assertValidDashboardFiltroDto({ periodo: "customizado", data_inicio: "2026-08-01" })).toThrow(
      AppError
    );
  });

  it("rejeita 'customizado' com datas em formato inválido", () => {
    expect(() =>
      assertValidDashboardFiltroDto({ periodo: "customizado", data_inicio: "01/08/2026", data_fim: "2026-08-10" })
    ).toThrow(AppError);
  });

  it("rejeita 'customizado' quando data_inicio é depois de data_fim", () => {
    expect(() =>
      assertValidDashboardFiltroDto({ periodo: "customizado", data_inicio: "2026-08-10", data_fim: "2026-08-01" })
    ).toThrow(AppError);
  });
});
