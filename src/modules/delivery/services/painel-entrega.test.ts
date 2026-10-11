import { describe, expect, it } from "vitest";
import { DescontoTipo } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import { LinhaPainelEntrega, montarCardPainel } from "./painel-entrega";

const AGORA = new Date("2026-10-11T19:00:00Z");
const LINHA: LinhaPainelEntrega = {
  id: "e1",
  numeroEntrega: 7,
  statusEntrega: StatusEntrega.EM_PRODUCAO,
  versao: 1,
  clienteNome: "Maria",
  clienteTelefone: "11987654321",
  enderecoLogradouro: "Av. Paulista",
  enderecoNumero: "1000",
  enderecoComplemento: "Apto 52",
  enderecoBairro: "Bela Vista",
  taxaEntrega: 7.5,
  formaPagamentoPrevista: FormaPagamento.DINHEIRO,
  trocoPara: 50,
  descontoTipo: DescontoTipo.NENHUM,
  descontoValor: 0,
  subtotalItensAtivos: 38.9,
  statusDosItens: [StatusItem.PENDENTE, StatusItem.PRONTO],
  criadoEm: new Date("2026-10-11T18:20:00Z"),
  previsaoEntregaEm: new Date("2026-10-11T19:10:00Z"),
};

describe("montarCardPainel", () => {
  it("monta o card com total, troco, endereço resumido e preparo agregado", () => {
    expect(montarCardPainel(LINHA, AGORA)).toEqual({
      id: "e1",
      numeroEntrega: 7,
      statusEntrega: StatusEntrega.EM_PRODUCAO,
      versao: 1,
      cliente: { nome: "Maria", telefone: "11987654321" },
      bairro: "Bela Vista",
      enderecoResumido: "Av. Paulista, 1000 - Apto 52",
      total: 46.4,
      formaPagamentoPrevista: FormaPagamento.DINHEIRO,
      troco: 3.6,
      trocoSuficiente: true,
      criadoEm: LINHA.criadoEm,
      previsaoEntregaEm: LINHA.previsaoEntregaEm,
      atrasado: false,
      statusPreparo: StatusPreparo.EM_PREPARO,
    });
  });

  it("troco recalculado: itens aumentaram e o troco para não cobre mais", () => {
    const card = montarCardPainel({ ...LINHA, subtotalItensAtivos: 58.35 }, AGORA);
    expect(card).toMatchObject({ total: 65.85, troco: 0, trocoSuficiente: false });
  });

  it("aplica desconto do caixa sobre os itens (taxa inteira)", () => {
    const card = montarCardPainel({ ...LINHA, descontoTipo: DescontoTipo.PERCENTUAL, descontoValor: 10, trocoPara: null }, AGORA);
    expect(card.total).toBe(42.51);
  });

  it("desconto fixo maior que os itens (itens cancelados depois) não quebra: limita aos itens", () => {
    const card = montarCardPainel({ ...LINHA, descontoTipo: DescontoTipo.VALOR_FIXO, descontoValor: 100, trocoPara: null }, AGORA);
    expect(card.total).toBe(7.5);
  });

  it("atrasado só depois da previsão e enquanto a entrega não terminou", () => {
    const depois = new Date("2026-10-11T19:30:00Z");
    expect(montarCardPainel(LINHA, depois).atrasado).toBe(true);
    expect(montarCardPainel({ ...LINHA, statusEntrega: StatusEntrega.ENTREGUE }, depois).atrasado).toBe(false);
    expect(montarCardPainel({ ...LINHA, previsaoEntregaEm: null }, depois).atrasado).toBe(false);
  });

  it("endereço sem complemento", () => {
    expect(montarCardPainel({ ...LINHA, enderecoComplemento: null }, AGORA).enderecoResumido).toBe("Av. Paulista, 1000");
  });

  it("preparo agregado: tudo pronto vira pronto", () => {
    expect(montarCardPainel({ ...LINHA, statusDosItens: [StatusItem.PRONTO, StatusItem.PRONTO] }, AGORA).statusPreparo).toBe(StatusPreparo.PRONTO);
  });
});
