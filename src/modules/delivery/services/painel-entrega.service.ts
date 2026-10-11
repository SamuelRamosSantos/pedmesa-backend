import { Brackets } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { DescontoTipo } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { Pedido } from "../../pedidos/entities/pedido.entity";
import { ListarEntregasFiltros } from "../dtos/listar-entregas.dto";
import { Entrega, StatusEntrega } from "../entities/entrega.entity";
import { dataDaNumeracao } from "./data-numeracao";
import { CardPainelEntrega, montarCardPainel, STATUS_TERMINAIS } from "./painel-entrega";

// Linha crua do Postgres: decimais chegam como string.
interface LinhaPainelBruta {
  id: string;
  numeroEntrega: number;
  statusEntrega: StatusEntrega;
  versao: number;
  clienteNome: string;
  clienteTelefone: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string | null;
  enderecoBairro: string;
  taxaEntrega: string;
  formaPagamentoPrevista: FormaPagamento;
  trocoPara: string | null;
  descontoTipo: DescontoTipo;
  descontoValor: string;
  subtotalItensAtivos: string;
  statusDosItens: StatusItem[];
  criadoEm: Date;
  previsaoEntregaEm: Date | null;
}

// Painel da expedição (PED-101): entregas em andamento + as encerradas hoje, numa única
// consulta. Soma e status dos itens são agregados no banco (sem N+1).
async function buscarLinhasPainel(
  tenantId: string,
  filtros: ListarEntregasFiltros,
  agora: Date
): Promise<LinhaPainelBruta[]> {
  const consulta = AppDataSource.getRepository(Entrega)
    .createQueryBuilder("entrega")
    .innerJoin("entrega.cliente", "cliente", "cliente.tenantId = entrega.tenantId")
    .innerJoin("entrega.comanda", "comanda", "comanda.tenantId = entrega.tenantId")
    .leftJoin(Pedido, "pedido", "pedido.comandaId = comanda.id")
    .leftJoin("pedido.itens", "item")
    .select("entrega.id", "id")
    .addSelect("entrega.numeroEntrega", "numeroEntrega")
    .addSelect("entrega.statusEntrega", "statusEntrega")
    .addSelect("entrega.versao", "versao")
    .addSelect("cliente.nome", "clienteNome")
    .addSelect("cliente.telefone", "clienteTelefone")
    .addSelect("entrega.enderecoLogradouro", "enderecoLogradouro")
    .addSelect("entrega.enderecoNumero", "enderecoNumero")
    .addSelect("entrega.enderecoComplemento", "enderecoComplemento")
    .addSelect("entrega.enderecoBairro", "enderecoBairro")
    .addSelect("entrega.taxaEntrega", "taxaEntrega")
    .addSelect("entrega.formaPagamentoPrevista", "formaPagamentoPrevista")
    .addSelect("entrega.trocoPara", "trocoPara")
    .addSelect("comanda.descontoTipo", "descontoTipo")
    .addSelect("comanda.descontoValor", "descontoValor")
    .addSelect(
      "COALESCE(SUM(item.quantidade * item.precoUnitario) FILTER (WHERE item.statusItem <> :itemCancelado), 0)",
      "subtotalItensAtivos"
    )
    .addSelect(
      "COALESCE(ARRAY_AGG(CAST(item.statusItem AS text)) FILTER (WHERE item.id IS NOT NULL), ARRAY[]::text[])",
      "statusDosItens"
    )
    .addSelect("entrega.criadoEm", "criadoEm")
    .addSelect("entrega.previsaoEntregaEm", "previsaoEntregaEm")
    .where("entrega.tenantId = :tenantId", { tenantId, itemCancelado: StatusItem.CANCELADO })
    .andWhere(
      new Brackets((visivel) =>
        visivel
          .where("entrega.statusEntrega NOT IN (:...terminais)", { terminais: STATUS_TERMINAIS })
          .orWhere("entrega.dataNumeracao = :hoje", { hoje: dataDaNumeracao(agora) })
      )
    )
    .groupBy("entrega.id")
    .addGroupBy("cliente.id")
    .addGroupBy("comanda.id")
    .orderBy("entrega.criadoEm", "ASC");

  if (filtros.status !== null) {
    consulta.andWhere("entrega.statusEntrega = :status", { status: filtros.status });
  }

  return consulta.getRawMany<LinhaPainelBruta>();
}

export async function listarEntregasPainel(tenantId: string, filtros: ListarEntregasFiltros): Promise<CardPainelEntrega[]> {
  const agora = new Date();
  const linhas = await buscarLinhasPainel(tenantId, filtros, agora);

  return linhas.map((linha) =>
    montarCardPainel(
      {
        ...linha,
        taxaEntrega: Number(linha.taxaEntrega),
        trocoPara: linha.trocoPara === null ? null : Number(linha.trocoPara),
        descontoValor: Number(linha.descontoValor),
        subtotalItensAtivos: Number(linha.subtotalItensAtivos),
      },
      agora
    )
  );
}
