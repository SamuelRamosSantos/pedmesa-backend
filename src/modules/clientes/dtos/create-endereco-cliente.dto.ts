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

export interface CreateEnderecoClienteDto {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string | null;
  principal: boolean;
}

export function assertValidCreateEnderecoClienteDto(body: unknown): CreateEnderecoClienteDto {
  const { cep, logradouro, numero, complemento, bairro, cidade, uf, referencia, principal } = (body ?? {}) as Record<
    string,
    unknown
  >;

  return {
    cep: validarCep(cep),
    logradouro: validarLogradouro(logradouro),
    numero: validarNumero(numero),
    complemento: validarComplemento(complemento),
    bairro: validarBairro(bairro),
    cidade: validarCidade(cidade),
    uf: validarUf(uf),
    referencia: validarReferencia(referencia),
    principal: principal === undefined ? false : validarBooleano(principal, "principal"),
  };
}
