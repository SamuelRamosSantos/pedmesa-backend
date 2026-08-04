import { describe, expect, it } from "vitest";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { calcularExtrato } from "./extrato-calculator";

describe("calcularExtrato", () => {
  it("calcula o exemplo documentado em api-endpoints.md (itens individuais + compartilhados)", () => {
    const resultado = calcularExtrato({
      integrantes: [
        { id: "lucas", nome: "Lucas" },
        { id: "mariana", nome: "Mariana" },
      ],
      itens: [
        {
          produtoNome: "X-Salada",
          quantidade: 1,
          precoUnitario: 25.0,
          integranteId: "lucas",
          statusItem: StatusItem.ENTREGUE,
        },
        {
          produtoNome: "Suco de Laranja",
          quantidade: 2,
          precoUnitario: 10.0,
          integranteId: "mariana",
          statusItem: StatusItem.ENTREGUE,
        },
        {
          produtoNome: "Porção de Batatas",
          quantidade: 1,
          precoUnitario: 30.0,
          integranteId: null,
          statusItem: StatusItem.ENTREGUE,
        },
      ],
    });

    expect(resultado.resumo_financeiro).toEqual({
      total_itens_individuais: 45.0,
      total_itens_compartilhados: 30.0,
      quantidade_integrantes: 2,
      valor_compartilhado_por_pessoa: 15.0,
      valor_total_comanda: 75.0,
    });

    const lucas = resultado.divisao_por_integrante.find((i) => i.integrante_id === "lucas");
    expect(lucas).toEqual({
      integrante_id: "lucas",
      nome: "Lucas",
      itens_individuais: [{ produto: "X-Salada", qtd: 1, preco_unitario: 25.0, subtotal: 25.0 }],
      total_individual: 25.0,
      cota_compartilhada: 15.0,
      total_a_pagar: 40.0,
    });

    const mariana = resultado.divisao_por_integrante.find((i) => i.integrante_id === "mariana");
    expect(mariana).toEqual({
      integrante_id: "mariana",
      nome: "Mariana",
      itens_individuais: [{ produto: "Suco de Laranja", qtd: 2, preco_unitario: 10.0, subtotal: 20.0 }],
      total_individual: 20.0,
      cota_compartilhada: 15.0,
      total_a_pagar: 35.0,
    });
  });

  it("retorna cota compartilhada 0 quando a comanda não tem integrantes cadastrados", () => {
    const resultado = calcularExtrato({
      integrantes: [],
      itens: [
        {
          produtoNome: "Porção de Batatas",
          quantidade: 1,
          precoUnitario: 30.0,
          integranteId: null,
          statusItem: StatusItem.ENTREGUE,
        },
      ],
    });

    expect(resultado.resumo_financeiro.quantidade_integrantes).toBe(0);
    expect(resultado.resumo_financeiro.valor_compartilhado_por_pessoa).toBe(0);
    expect(resultado.resumo_financeiro.total_itens_compartilhados).toBe(30.0);
    expect(resultado.resumo_financeiro.valor_total_comanda).toBe(30.0);
    expect(resultado.divisao_por_integrante).toEqual([]);
  });

  it("retorna tudo zerado para uma comanda sem nenhum item lançado", () => {
    const resultado = calcularExtrato({
      integrantes: [{ id: "lucas", nome: "Lucas" }],
      itens: [],
    });

    expect(resultado.resumo_financeiro).toEqual({
      total_itens_individuais: 0,
      total_itens_compartilhados: 0,
      quantidade_integrantes: 1,
      valor_compartilhado_por_pessoa: 0,
      valor_total_comanda: 0,
    });

    expect(resultado.divisao_por_integrante).toEqual([
      {
        integrante_id: "lucas",
        nome: "Lucas",
        itens_individuais: [],
        total_individual: 0,
        cota_compartilhada: 0,
        total_a_pagar: 0,
      },
    ]);
  });

  it("inclui integrantes sem nenhum item individual, mas que ainda dividem a cota compartilhada", () => {
    const resultado = calcularExtrato({
      integrantes: [
        { id: "lucas", nome: "Lucas" },
        { id: "mariana", nome: "Mariana" },
      ],
      itens: [
        {
          produtoNome: "Porção de Batatas",
          quantidade: 1,
          precoUnitario: 30.0,
          integranteId: null,
          statusItem: StatusItem.ENTREGUE,
        },
      ],
    });

    const mariana = resultado.divisao_por_integrante.find((i) => i.integrante_id === "mariana");
    expect(mariana?.itens_individuais).toEqual([]);
    expect(mariana?.total_individual).toBe(0);
    expect(mariana?.cota_compartilhada).toBe(15.0);
    expect(mariana?.total_a_pagar).toBe(15.0);
  });

  it("soma múltiplos itens individuais do mesmo integrante", () => {
    const resultado = calcularExtrato({
      integrantes: [{ id: "lucas", nome: "Lucas" }],
      itens: [
        { produtoNome: "X-Salada", quantidade: 1, precoUnitario: 25.0, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
        { produtoNome: "Refrigerante", quantidade: 2, precoUnitario: 6.5, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
      ],
    });

    const lucas = resultado.divisao_por_integrante[0];
    expect(lucas.itens_individuais).toHaveLength(2);
    expect(lucas.total_individual).toBe(38.0);
    expect(lucas.total_a_pagar).toBe(38.0);
  });

  it("arredonda a cota compartilhada sem erros de ponto flutuante quando a divisão não é exata", () => {
    const resultado = calcularExtrato({
      integrantes: [{ id: "a", nome: "A" }, { id: "b", nome: "B" }, { id: "c", nome: "C" }],
      itens: [
        { produtoNome: "Rodízio", quantidade: 1, precoUnitario: 10.0, integranteId: null, statusItem: StatusItem.ENTREGUE },
      ],
    });

    // 10.00 / 3 = 3.333... -> arredonda para 3.33 (centavo restante não é redistribuído, por especificação)
    expect(resultado.resumo_financeiro.valor_compartilhado_por_pessoa).toBe(3.33);
    expect(resultado.divisao_por_integrante.every((i) => i.cota_compartilhada === 3.33)).toBe(true);
  });

  it("não sofre erros clássicos de ponto flutuante do JavaScript ao somar quantidades e preços", () => {
    const resultado = calcularExtrato({
      integrantes: [{ id: "lucas", nome: "Lucas" }],
      // 0.1 + 0.2 !== 0.3 em JS puro; e 3 * 10.1 !== 30.3 em JS puro
      itens: [
        { produtoNome: "Item A", quantidade: 1, precoUnitario: 0.1, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
        { produtoNome: "Item B", quantidade: 1, precoUnitario: 0.2, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
        { produtoNome: "Item C", quantidade: 3, precoUnitario: 10.1, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
      ],
    });

    expect(resultado.divisao_por_integrante[0].total_individual).toBe(30.6);
    expect(resultado.resumo_financeiro.valor_total_comanda).toBe(30.6);
  });

  it("calcula o valor_total_comanda como a soma de individuais e compartilhados, mesmo com vários integrantes e itens mistos", () => {
    const resultado = calcularExtrato({
      integrantes: [
        { id: "lucas", nome: "Lucas" },
        { id: "mariana", nome: "Mariana" },
        { id: "carlos", nome: "Carlos" },
      ],
      itens: [
        { produtoNome: "X-Salada", quantidade: 1, precoUnitario: 25.0, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
        { produtoNome: "X-Bacon", quantidade: 1, precoUnitario: 28.0, integranteId: "mariana", statusItem: StatusItem.ENTREGUE },
        { produtoNome: "Suco", quantidade: 1, precoUnitario: 8.0, integranteId: "carlos", statusItem: StatusItem.ENTREGUE },
        { produtoNome: "Porção de Batatas", quantidade: 1, precoUnitario: 30.0, integranteId: null, statusItem: StatusItem.ENTREGUE },
        { produtoNome: "Jarra de Suco", quantidade: 1, precoUnitario: 18.0, integranteId: null, statusItem: StatusItem.ENTREGUE },
      ],
    });

    expect(resultado.resumo_financeiro.total_itens_individuais).toBe(61.0);
    expect(resultado.resumo_financeiro.total_itens_compartilhados).toBe(48.0);
    expect(resultado.resumo_financeiro.valor_compartilhado_por_pessoa).toBe(16.0);
    expect(resultado.resumo_financeiro.valor_total_comanda).toBe(109.0);

    const somaTotalAPagar = resultado.divisao_por_integrante.reduce((soma, i) => soma + i.total_a_pagar, 0);
    expect(somaTotalAPagar).toBeCloseTo(109.0, 2);
  });

  describe("detecção de itens pendentes de entrega", () => {
    it("retorna possui_itens_pendentes = false quando 100% dos itens estão entregues", () => {
      const resultado = calcularExtrato({
        integrantes: [{ id: "lucas", nome: "Lucas" }],
        itens: [
          { produtoNome: "X-Salada", quantidade: 1, precoUnitario: 25.0, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
          { produtoNome: "Refrigerante", quantidade: 1, precoUnitario: 5.0, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
        ],
      });

      expect(resultado.possui_itens_pendentes).toBe(false);
      expect(resultado.itens_pendentes_entrega).toBe(0);
      expect(resultado.itens_pendentes).toEqual([]);
    });

    it("ignora itens cancelados: não contam como pendentes de entrega", () => {
      const resultado = calcularExtrato({
        integrantes: [{ id: "lucas", nome: "Lucas" }],
        itens: [
          { produtoNome: "X-Salada", quantidade: 1, precoUnitario: 25.0, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
          { produtoNome: "Suco de Uva", quantidade: 1, precoUnitario: 9.0, integranteId: "lucas", statusItem: StatusItem.CANCELADO },
        ],
      });

      expect(resultado.possui_itens_pendentes).toBe(false);
      expect(resultado.itens_pendentes_entrega).toBe(0);
    });

    it("retorna possui_itens_pendentes = true quando há itens ainda na cozinha/bar (pendente, em_preparo ou pronto)", () => {
      const resultado = calcularExtrato({
        integrantes: [{ id: "lucas", nome: "Lucas" }],
        itens: [
          { produtoNome: "X-Salada", quantidade: 1, precoUnitario: 25.0, integranteId: "lucas", statusItem: StatusItem.ENTREGUE },
          { produtoNome: "Batata Frita", quantidade: 1, precoUnitario: 16.0, integranteId: null, statusItem: StatusItem.EM_PREPARO },
          { produtoNome: "Refrigerante", quantidade: 2, precoUnitario: 5.0, integranteId: "lucas", statusItem: StatusItem.PENDENTE },
          { produtoNome: "Suco de Laranja", quantidade: 1, precoUnitario: 8.0, integranteId: "lucas", statusItem: StatusItem.PRONTO },
        ],
      });

      expect(resultado.possui_itens_pendentes).toBe(true);
      expect(resultado.itens_pendentes_entrega).toBe(3);
      expect(resultado.itens_pendentes).toEqual([
        { produto_nome: "Batata Frita", quantidade: 1, status_item: StatusItem.EM_PREPARO },
        { produto_nome: "Refrigerante", quantidade: 2, status_item: StatusItem.PENDENTE },
        { produto_nome: "Suco de Laranja", quantidade: 1, status_item: StatusItem.PRONTO },
      ]);
    });

    it("não altera os totais financeiros existentes ao adicionar a detecção de pendências", () => {
      const resultado = calcularExtrato({
        integrantes: [{ id: "lucas", nome: "Lucas" }],
        itens: [
          { produtoNome: "Batata Frita", quantidade: 1, precoUnitario: 16.0, integranteId: "lucas", statusItem: StatusItem.EM_PREPARO },
        ],
      });

      expect(resultado.resumo_financeiro.valor_total_comanda).toBe(16.0);
      expect(resultado.possui_itens_pendentes).toBe(true);
    });
  });
});
