import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { fromCents } from "../../../shared/utils/money";
import { Cliente } from "../../clientes/entities/cliente.entity";
import { EnderecoCliente } from "../../clientes/entities/endereco-cliente.entity";
import { criarEnderecoNaTransacao } from "../../clientes/services/endereco-cliente.service";
import { Comanda, ComandaStatus, TipoAtendimento } from "../../comandas/entities/comanda.entity";
import { IntegranteComanda } from "../../comandas/entities/integrante-comanda.entity";
import { PrintQueue } from "../../impressao/queue/print-queue";
import { lancarItensNaComanda } from "../../pedidos/services/lancamento-itens";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { CriarPedidoDeliveryDto, EnderecoNovo } from "../dtos/criar-pedido-delivery.dto";
import { Entrega, StatusEntrega } from "../entities/entrega.entity";
import { CotacaoPedido } from "./cotacao-pedido";
import { cotarPedidoDelivery } from "./cotacao.service";
import { assertCotacaoPermiteCriacao, calcularPrevisaoEntrega, statusInicialDaEntrega } from "./criacao-pedido-regras";
import { dataDaNumeracao } from "./data-numeracao";
import { registrarHistoricoStatusEntrega } from "./historico-status-entrega";
import { proximoNumeroEntrega } from "./numeracao-entrega";
import { enfileirarTicketEntrega } from "./ticket-entrega.service";

export interface PedidoDeliveryCriado {
  entrega: Entrega;
  cotacao: CotacaoPedido;
}

// Endereço de entrega: um endereço salvo do cliente (que precisa existir e ser dele) ou
// o endereço novo digitado no formulário.
async function resolverEnderecoDeEntrega(
  manager: EntityManager,
  tenantId: string,
  clienteExistente: Cliente | null,
  dto: CriarPedidoDeliveryDto
): Promise<EnderecoNovo> {
  if (dto.endereco.tipo === "novo") {
    return dto.endereco.endereco;
  }

  const salvo = clienteExistente
    ? await manager.findOneBy(EnderecoCliente, { id: dto.endereco.enderecoId, clienteId: clienteExistente.id, tenantId })
    : null;

  if (!salvo) {
    throw new AppError("Endereço não encontrado para este cliente.", 404);
  }

  return {
    cep: salvo.cep,
    logradouro: salvo.logradouro,
    numero: salvo.numero,
    complemento: salvo.complemento,
    bairro: salvo.bairro,
    cidade: salvo.cidade,
    uf: salvo.uf,
    referencia: salvo.referencia,
  };
}

// POST /delivery/pedidos (PED-96): uma chamada, uma transação. Todas as validações
// (delivery ativo, bairro atendido, pedido mínimo, troco, produtos) rodam ANTES da primeira
// gravação; qualquer falha depois disso desfaz tudo. Impressão só depois do commit.
export async function criarPedidoDelivery(
  tenantId: string,
  usuarioId: string,
  dto: CriarPedidoDeliveryDto
): Promise<PedidoDeliveryCriado> {
  const agora = new Date();

  const criado = await AppDataSource.transaction(async (manager) => {
    const clienteExistente = await manager.findOneBy(Cliente, { tenantId, telefone: dto.cliente.telefone });
    const endereco = await resolverEnderecoDeEntrega(manager, tenantId, clienteExistente, dto);

    // A taxa vem sempre daqui (servidor); nada do corpo da requisição entra no valor.
    const cotacao = await cotarPedidoDelivery(manager, tenantId, {
      endereco: { cidade: endereco.cidade, bairro: endereco.bairro },
      itens: dto.itens,
      formaPagamento: dto.formaPagamento,
      trocoParaCents: dto.trocoParaCents,
    });
    assertCotacaoPermiteCriacao(cotacao, dto.formaPagamento, dto.trocoParaCents);

    // ---- a partir daqui, gravações ----
    const cliente = clienteExistente ?? (await manager.save(manager.create(Cliente, { tenantId, ...dto.cliente })));

    if (dto.endereco.tipo === "novo" && dto.endereco.salvarNoCadastro) {
      await criarEnderecoNaTransacao(manager, tenantId, cliente.id, { ...dto.endereco.endereco, principal: false });
    }

    const tenant = await manager.findOneByOrFail(Tenant, { id: tenantId });
    const comanda = await manager.save(
      manager.create(Comanda, { tenantId, tipoAtendimento: TipoAtendimento.DELIVERY, numeroComanda: null, status: ComandaStatus.ABERTA })
    );
    // Um integrante com o nome do cliente: extrato, itens e fechamento funcionam como na mesa.
    const integrante = await manager.save(manager.create(IntegranteComanda, { comandaId: comanda.id, nome: cliente.nome }));

    const { pedido, itensImpressao } = await lancarItensNaComanda(manager, tenant, comanda, usuarioId, {
      itens: dto.itens.map((item) => ({ ...item, integranteId: integrante.id })),
    });

    const dataNumeracao = dataDaNumeracao(agora);
    const numeroEntrega = await proximoNumeroEntrega(manager, tenantId, dataNumeracao);
    const statusInicial = statusInicialDaEntrega(pedido.statusPreparo);

    const entrega = await manager.save(
      manager.create(Entrega, {
        tenantId,
        comandaId: comanda.id,
        clienteId: cliente.id,
        dataNumeracao,
        numeroEntrega,
        enderecoCep: endereco.cep,
        enderecoLogradouro: endereco.logradouro,
        enderecoNumero: endereco.numero,
        enderecoComplemento: endereco.complemento,
        enderecoBairro: endereco.bairro,
        enderecoCidade: endereco.cidade,
        enderecoUf: endereco.uf,
        enderecoReferencia: endereco.referencia,
        taxaEntrega: cotacao.taxaEntrega ?? 0,
        formaPagamentoPrevista: dto.formaPagamento,
        trocoPara: dto.trocoParaCents === null ? null : fromCents(dto.trocoParaCents),
        statusEntrega: statusInicial,
        previsaoEntregaEm: calcularPrevisaoEntrega(agora, cotacao.tempoEstimadoMin),
      })
    );

    await registrarHistoricoStatusEntrega(manager, {
      tenantId,
      entregaId: entrega.id,
      statusAnterior: null,
      statusNovo: statusInicial,
      usuarioId,
      motivo: null,
    });

    return { entrega, cotacao, comandaId: comanda.id, pedidoId: pedido.id, pedidoCriadoEm: pedido.criadoEm, itensImpressao };
  }).catch((error: unknown) => {
    // Dois pedidos simultâneos para um telefone novo: o segundo esbarra na unique do cliente.
    if (isUniqueViolation(error)) {
      throw new AppError("Outro pedido acabou de cadastrar este cliente. Envie o pedido novamente.", 409);
    }
    throw error;
  });

  // Depois do commit: nunca imprimir um pedido que acabou desfeito.
  await PrintQueue.enqueuePedidoCozinha({
    tenant_id: tenantId,
    comanda_id: criado.comandaId,
    pedido_id: criado.pedidoId,
    numero_comanda: null,
    numero_entrega: criado.entrega.numeroEntrega,
    criado_em: criado.pedidoCriadoEm,
    itens: criado.itensImpressao,
  });

  if (criado.entrega.statusEntrega === StatusEntrega.PRONTO_PARA_ENVIO) {
    await enfileirarTicketEntrega(tenantId, criado.entrega.id);
  }

  return { entrega: criado.entrega, cotacao: criado.cotacao };
}
