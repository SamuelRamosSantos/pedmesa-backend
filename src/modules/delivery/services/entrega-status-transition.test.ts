import { describe, expect, it } from "vitest";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import {
  assertTransicaoEntregaValida,
  ContextoTransicaoEntrega,
  transicaoExigeMotivo,
  TRANSICOES_VALIDAS,
} from "./entrega-status-transition";

const { EM_PRODUCAO, PRONTO_PARA_ENVIO, EM_ROTA, ENTREGUE, CANCELADO } = StatusEntrega;
const TODOS = [EM_PRODUCAO, PRONTO_PARA_ENVIO, EM_ROTA, ENTREGUE, CANCELADO];

// Contexto que satisfaz todas as guardas: isola o teste da tabela de transições.
const CONTEXTO_OK: ContextoTransicaoEntrega = {
  statusPreparoDosPedidos: [StatusPreparo.PRONTO],
  motivo: "Cliente desistiu do pedido",
};

// Esperado escrito à mão, independente da tabela do código.
const PERMITIDAS = new Set([
  `${EM_PRODUCAO}>${PRONTO_PARA_ENVIO}`,
  `${EM_PRODUCAO}>${CANCELADO}`,
  `${PRONTO_PARA_ENVIO}>${EM_ROTA}`,
  `${PRONTO_PARA_ENVIO}>${EM_PRODUCAO}`,
  `${PRONTO_PARA_ENVIO}>${CANCELADO}`,
  `${EM_ROTA}>${ENTREGUE}`,
  `${EM_ROTA}>${PRONTO_PARA_ENVIO}`,
]);

const MATRIZ = TODOS.flatMap((atual) => TODOS.map((novo) => [atual, novo] as const));

describe("assertTransicaoEntregaValida: matriz dos 25 pares", () => {
  it("cobre exatamente 25 pares, 7 permitidos", () => {
    expect(MATRIZ).toHaveLength(25);
    expect(MATRIZ.filter(([a, n]) => PERMITIDAS.has(`${a}>${n}`))).toHaveLength(7);
  });

  it.each(MATRIZ.filter(([a, n]) => PERMITIDAS.has(`${a}>${n}`)))("permite %s → %s", (atual, novo) => {
    expect(() => assertTransicaoEntregaValida(atual, novo, CONTEXTO_OK)).not.toThrow();
  });

  it.each(MATRIZ.filter(([a, n]) => a !== n && !PERMITIDAS.has(`${a}>${n}`)))("rejeita %s → %s", (atual, novo) => {
    expect(() => assertTransicaoEntregaValida(atual, novo, CONTEXTO_OK)).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: `Transição de status inválida: não é possível ir de "${atual}" para "${novo}".`,
      })
    );
  });

  it.each(TODOS)("rejeita manter o mesmo status %s", (status) => {
    expect(() => assertTransicaoEntregaValida(status, status, CONTEXTO_OK)).toThrow(
      expect.objectContaining({ statusCode: 400, message: `A entrega já está com o status "${status}".` })
    );
  });

  it("entregue e cancelado são terminais", () => {
    expect(TRANSICOES_VALIDAS[ENTREGUE]).toEqual([]);
    expect(TRANSICOES_VALIDAS[CANCELADO]).toEqual([]);
  });
});

describe("guarda: pronto para envio exige preparo concluído", () => {
  it.each([
    ["todos prontos", [StatusPreparo.PRONTO, StatusPreparo.PRONTO]],
    ["prontos e entregues", [StatusPreparo.PRONTO, StatusPreparo.ENTREGUE]],
  ])("permite com %s", (_caso, statusPreparoDosPedidos) => {
    expect(() =>
      assertTransicaoEntregaValida(EM_PRODUCAO, PRONTO_PARA_ENVIO, { ...CONTEXTO_OK, statusPreparoDosPedidos })
    ).not.toThrow();
  });

  it.each([
    ["um pedido ainda em preparo", [StatusPreparo.PRONTO, StatusPreparo.EM_PREPARO]],
    ["um pedido pendente", [StatusPreparo.PENDENTE]],
  ])("recusa com %s", (_caso, statusPreparoDosPedidos) => {
    expect(() =>
      assertTransicaoEntregaValida(EM_PRODUCAO, PRONTO_PARA_ENVIO, { ...CONTEXTO_OK, statusPreparoDosPedidos })
    ).toThrow(expect.objectContaining({ statusCode: 400, message: expect.stringMatching(/todos os pedidos estiverem prontos/) }));
  });

  it("recusa entrega sem pedidos", () => {
    expect(() =>
      assertTransicaoEntregaValida(EM_PRODUCAO, PRONTO_PARA_ENVIO, { ...CONTEXTO_OK, statusPreparoDosPedidos: [] })
    ).toThrow(expect.objectContaining({ message: "A entrega não tem pedidos para enviar." }));
  });

  it("vale também no retorno em_rota → pronto_para_envio", () => {
    expect(() =>
      assertTransicaoEntregaValida(EM_ROTA, PRONTO_PARA_ENVIO, {
        statusPreparoDosPedidos: [StatusPreparo.EM_PREPARO],
        motivo: "Endereço não encontrado",
      })
    ).toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("não se aplica às demais transições", () => {
    expect(() =>
      assertTransicaoEntregaValida(PRONTO_PARA_ENVIO, EM_ROTA, { ...CONTEXTO_OK, statusPreparoDosPedidos: [] })
    ).not.toThrow();
  });
});

describe("guarda: motivo obrigatório", () => {
  it.each([
    [EM_PRODUCAO, CANCELADO],
    [PRONTO_PARA_ENVIO, CANCELADO],
    [EM_ROTA, PRONTO_PARA_ENVIO],
  ])("%s → %s exige motivo", (atual, novo) => {
    expect(transicaoExigeMotivo(atual, novo)).toBe(true);

    for (const motivo of [null, "", "    ", "abcd", "  ab  "]) {
      expect(() => assertTransicaoEntregaValida(atual, novo, { ...CONTEXTO_OK, motivo })).toThrow(
        expect.objectContaining({ statusCode: 400, message: "Informe o motivo com pelo menos 5 caracteres." })
      );
    }

    expect(() => assertTransicaoEntregaValida(atual, novo, { ...CONTEXTO_OK, motivo: "abcde" })).not.toThrow();
    expect(() => assertTransicaoEntregaValida(atual, novo, { ...CONTEXTO_OK, motivo: "  abcde  " })).not.toThrow();
  });

  it.each([
    [EM_PRODUCAO, PRONTO_PARA_ENVIO],
    [PRONTO_PARA_ENVIO, EM_ROTA],
    [PRONTO_PARA_ENVIO, EM_PRODUCAO],
    [EM_ROTA, ENTREGUE],
  ])("%s → %s não exige motivo", (atual, novo) => {
    expect(transicaoExigeMotivo(atual, novo)).toBe(false);
    expect(() => assertTransicaoEntregaValida(atual, novo, { ...CONTEXTO_OK, motivo: null })).not.toThrow();
  });
});
