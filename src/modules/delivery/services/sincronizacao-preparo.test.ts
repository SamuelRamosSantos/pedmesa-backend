import { describe, expect, it } from "vitest";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import { decidirStatusPorPreparo } from "./sincronizacao-preparo";

const { PENDENTE, EM_PREPARO, PRONTO, ENTREGUE } = StatusPreparo;

describe("decidirStatusPorPreparo", () => {
  it("em produção avança quando todo o preparo está concluído", () => {
    expect(decidirStatusPorPreparo(StatusEntrega.EM_PRODUCAO, [PRONTO, PRONTO], true)).toBe(StatusEntrega.PRONTO_PARA_ENVIO);
    expect(decidirStatusPorPreparo(StatusEntrega.EM_PRODUCAO, [PRONTO, ENTREGUE], true)).toBe(StatusEntrega.PRONTO_PARA_ENVIO);
  });

  it("em produção fica parado enquanto algum pedido não está pronto", () => {
    expect(decidirStatusPorPreparo(StatusEntrega.EM_PRODUCAO, [PRONTO, EM_PREPARO], true)).toBeNull();
    expect(decidirStatusPorPreparo(StatusEntrega.EM_PRODUCAO, [PENDENTE], true)).toBeNull();
  });

  it("pronto para envio volta para em produção se a cozinha regredir um item", () => {
    expect(decidirStatusPorPreparo(StatusEntrega.PRONTO_PARA_ENVIO, [PRONTO, EM_PREPARO], true)).toBe(StatusEntrega.EM_PRODUCAO);
  });

  it("pronto para envio continua pronto quando o preparo segue concluído", () => {
    expect(decidirStatusPorPreparo(StatusEntrega.PRONTO_PARA_ENVIO, [PRONTO], true)).toBeNull();
  });

  it.each([StatusEntrega.EM_ROTA, StatusEntrega.ENTREGUE, StatusEntrega.CANCELADO])(
    "%s: a cozinha não mexe mais, em nenhum sentido",
    (status) => {
      expect(decidirStatusPorPreparo(status, [PRONTO], true)).toBeNull();
      expect(decidirStatusPorPreparo(status, [EM_PREPARO], true)).toBeNull();
    }
  );

  it("sem itens ativos (tudo cancelado) não avança, mesmo com status de preparo 'entregue'", () => {
    expect(decidirStatusPorPreparo(StatusEntrega.EM_PRODUCAO, [ENTREGUE], false)).toBeNull();
  });

  it("sem pedidos não avança", () => {
    expect(decidirStatusPorPreparo(StatusEntrega.EM_PRODUCAO, [], true)).toBeNull();
  });
});
