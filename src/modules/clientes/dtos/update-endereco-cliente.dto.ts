import { AppError } from "../../../shared/errors/app-error";
import {
  validarBairro,
  validarBooleano,
  validarCep,
  validarCidade,
  validarComplemento,
  validarLogradouro,
  validarNumero,
  validarReferencia,
  validarUf,
} from "./endereco-input.validator";

export interface UpdateEnderecoClienteDto {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string | null;
  bairro?: string;
  cidade?: string;
  uf?: string;
  referencia?: string | null;
  // Só aceita true: para deixar de ser principal, outro endereço é que vira o principal.
  principal?: true;
}

// Atualização parcial: só os campos enviados são validados e alterados.
// complemento/referencia: null limpa o campo; ausente mantém o valor atual.
export function assertValidUpdateEnderecoClienteDto(body: unknown): UpdateEnderecoClienteDto {
  const campos = (body ?? {}) as Record<string, unknown>;
  const dto: UpdateEnderecoClienteDto = {};

  if (campos.cep !== undefined) dto.cep = validarCep(campos.cep);
  if (campos.logradouro !== undefined) dto.logradouro = validarLogradouro(campos.logradouro);
  if (campos.numero !== undefined) dto.numero = validarNumero(campos.numero);
  if ("complemento" in campos) dto.complemento = validarComplemento(campos.complemento);
  if (campos.bairro !== undefined) dto.bairro = validarBairro(campos.bairro);
  if (campos.cidade !== undefined) dto.cidade = validarCidade(campos.cidade);
  if (campos.uf !== undefined) dto.uf = validarUf(campos.uf);
  if ("referencia" in campos) dto.referencia = validarReferencia(campos.referencia);

  if (campos.principal !== undefined) {
    if (!validarBooleano(campos.principal, "principal")) {
      throw new AppError("Para trocar o endereço principal, marque outro endereço como principal.", 400);
    }
    dto.principal = true;
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("Informe ao menos um campo do endereço para atualizar.", 400);
  }

  return dto;
}
