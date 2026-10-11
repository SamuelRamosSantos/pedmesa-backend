import { EntityManager } from "typeorm";
import { AppError } from "../../../../shared/errors/app-error";
import { Tenant } from "../../../tenants/entities/tenant.entity";
import { TaxaEntrega } from "../../entities/taxa-entrega.entity";
import { normalizarLocalidade } from "../localidade-normalizer";
import { CalculadoraFrete, CotacaoFrete, EnderecoFrete } from "./calculadora-frete";
import { resolverTaxa } from "./resolver-taxa";

// Frete por bairro (ADR-001). Só busca os dados; a decisão fica em resolverTaxa (pura).
// Recebe o EntityManager para poder rodar dentro da transação da criação do pedido.
export class FretePorBairroCalculator implements CalculadoraFrete {
  constructor(private readonly manager: EntityManager) {}

  async cotar(tenantId: string, endereco: EnderecoFrete): Promise<CotacaoFrete> {
    const tenant = await this.manager.findOne(Tenant, { select: { id: true, taxaEntregaPadrao: true }, where: { id: tenantId } });

    if (!tenant) {
      throw new AppError("Tenant não encontrado.", 404);
    }

    // Só a linha que pode casar com o endereço (chave única por tenant/cidade/bairro).
    const taxas = await this.manager.findBy(TaxaEntrega, {
      tenantId,
      cidadeNormalizada: normalizarLocalidade(endereco.cidade),
      bairroNormalizado: normalizarLocalidade(endereco.bairro),
    });

    return resolverTaxa(taxas, endereco, tenant.taxaEntregaPadrao);
  }
}
