import { describe, expect, it } from "vitest";
import { resolverIntervaloPeriodo } from "./periodo-resolver";

const AGORA = new Date(2026, 7, 15, 14, 30, 0); // 15/08/2026 14:30, uma quarta-feira qualquer

describe("resolverIntervaloPeriodo", () => {
  it("resolve 'hoje' como o dia inteiro de agora", () => {
    const intervalo = resolverIntervaloPeriodo({ periodo: "hoje" }, AGORA);

    expect(intervalo.inicio).toEqual(new Date(2026, 7, 15, 0, 0, 0, 0));
    expect(intervalo.fim).toEqual(new Date(2026, 7, 15, 23, 59, 59, 999));
  });

  it("resolve '7_dias' como os últimos 7 dias incluindo hoje", () => {
    const intervalo = resolverIntervaloPeriodo({ periodo: "7_dias" }, AGORA);

    expect(intervalo.inicio).toEqual(new Date(2026, 7, 9, 0, 0, 0, 0));
    expect(intervalo.fim).toEqual(new Date(2026, 7, 15, 23, 59, 59, 999));
  });

  it("resolve '30_dias' como os últimos 30 dias incluindo hoje", () => {
    const intervalo = resolverIntervaloPeriodo({ periodo: "30_dias" }, AGORA);

    expect(intervalo.inicio).toEqual(new Date(2026, 6, 17, 0, 0, 0, 0));
    expect(intervalo.fim).toEqual(new Date(2026, 7, 15, 23, 59, 59, 999));
  });

  it("resolve 'customizado' a partir de data_inicio/data_fim informados", () => {
    const intervalo = resolverIntervaloPeriodo(
      { periodo: "customizado", dataInicio: "2026-08-01", dataFim: "2026-08-10" },
      AGORA
    );

    expect(intervalo.inicio).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0));
    expect(intervalo.fim).toEqual(new Date(2026, 7, 10, 23, 59, 59, 999));
  });

  it("resolve 'customizado' com a mesma data para início e fim como um único dia", () => {
    const intervalo = resolverIntervaloPeriodo(
      { periodo: "customizado", dataInicio: "2026-08-05", dataFim: "2026-08-05" },
      AGORA
    );

    expect(intervalo.inicio).toEqual(new Date(2026, 7, 5, 0, 0, 0, 0));
    expect(intervalo.fim).toEqual(new Date(2026, 7, 5, 23, 59, 59, 999));
  });
});
