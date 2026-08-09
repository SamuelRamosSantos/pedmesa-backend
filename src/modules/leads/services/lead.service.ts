import { AppDataSource } from "../../../config/data-source";
import { CreateLeadDto } from "../dtos/create-lead.dto";
import { Lead } from "../entities/lead.entity";

export class LeadService {
  static async criar(dto: CreateLeadDto): Promise<Lead> {
    const repository = AppDataSource.getRepository(Lead);

    return repository.save(
      repository.create({
        nome: dto.nome,
        email: dto.email,
        whatsapp: dto.whatsapp,
        nomeEstabelecimento: dto.nomeEstabelecimento,
        cpfCnpj: dto.cpfCnpj,
      })
    );
  }

  static async listar(): Promise<Lead[]> {
    const repository = AppDataSource.getRepository(Lead);
    return repository.find({ order: { criadoEm: "DESC" } });
  }
}
