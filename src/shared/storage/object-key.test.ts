import { describe, expect, it } from "vitest";
import {
  chaveDefinitiva,
  ehUploadPendenteDoTenant,
  interpretarUrl,
  montarChavePendente,
  montarUrlPublica,
} from "./object-key";

const TENANT = "11111111-1111-4111-8111-111111111111";
const OUTRO_TENANT = "22222222-2222-4222-8222-222222222222";
const ARQUIVO = "33333333-3333-4333-8333-333333333333";
const BASE = "https://cdn.pedmesa.com.br";
const DEFINITIVA = `tenants/${TENANT}/${ARQUIVO}.webp`;
const PENDENTE = `pendentes/${DEFINITIVA}`;

describe("object-key", () => {
  it("monta a chave pendente e a definitiva correspondente", () => {
    expect(montarChavePendente(TENANT, ARQUIVO, "webp")).toBe(PENDENTE);
    expect(chaveDefinitiva(PENDENTE)).toBe(DEFINITIVA);
    expect(chaveDefinitiva(DEFINITIVA)).toBe(DEFINITIVA);
  });

  it("monta a URL pública sem barra dupla", () => {
    expect(montarUrlPublica(`${BASE}/`, PENDENTE)).toBe(`${BASE}/${PENDENTE}`);
  });

  it("interpreta URLs pendentes e definitivas do próprio storage", () => {
    expect(interpretarUrl(`${BASE}/${PENDENTE}`, BASE)).toEqual({
      chave: PENDENTE,
      tenantId: TENANT,
      pendente: true,
    });
    expect(interpretarUrl(`${BASE}/${DEFINITIVA}`, BASE)).toEqual({
      chave: DEFINITIVA,
      tenantId: TENANT,
      pendente: false,
    });
  });

  it("recusa URL externa, domínio parecido ou caminho fora do formato", () => {
    expect(interpretarUrl(`https://exemplo.com/${PENDENTE}`, BASE)).toBeNull();
    expect(
      interpretarUrl(`https://cdn.pedmesa.com.br.evil.com/${PENDENTE}`, BASE),
    ).toBeNull();
    expect(
      interpretarUrl(`${BASE}/tenants/${TENANT}/../segredo.webp`, BASE),
    ).toBeNull();
    expect(
      interpretarUrl(`${BASE}/tenants/${TENANT}/${ARQUIVO}.svg`, BASE),
    ).toBeNull();
  });

  it("só considera válida para salvar a URL pendente do próprio tenant", () => {
    expect(ehUploadPendenteDoTenant(`${BASE}/${PENDENTE}`, BASE, TENANT)).toBe(
      true,
    );
    expect(
      ehUploadPendenteDoTenant(`${BASE}/${PENDENTE}`, BASE, OUTRO_TENANT),
    ).toBe(false);
    // Imagem já em uso (definitiva) não pode ser reaproveitada em outro cadastro
    expect(
      ehUploadPendenteDoTenant(`${BASE}/${DEFINITIVA}`, BASE, TENANT),
    ).toBe(false);
    expect(
      ehUploadPendenteDoTenant("https://exemplo.com/foto.png", BASE, TENANT),
    ).toBe(false);
  });
});
