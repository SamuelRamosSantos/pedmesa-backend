import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { envInt } from "./env-int";

const ENV_KEY = "ENV_INT_TEST_VALUE";

describe("envInt", () => {
  beforeEach(() => {
    delete process.env[ENV_KEY];
  });

  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it("usa o fallback quando a env var não está definida", () => {
    expect(envInt(ENV_KEY, 42)).toBe(42);
  });

  it("usa o valor da env var quando é um número válido maior que zero", () => {
    process.env[ENV_KEY] = "100";
    expect(envInt(ENV_KEY, 42)).toBe(100);
  });

  it("cai no fallback para valores inválidos (não numérico, zero ou negativo)", () => {
    process.env[ENV_KEY] = "abc";
    expect(envInt(ENV_KEY, 42)).toBe(42);

    process.env[ENV_KEY] = "0";
    expect(envInt(ENV_KEY, 42)).toBe(42);

    process.env[ENV_KEY] = "-5";
    expect(envInt(ENV_KEY, 42)).toBe(42);
  });
});
