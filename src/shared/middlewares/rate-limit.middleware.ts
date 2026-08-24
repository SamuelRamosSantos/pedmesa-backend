import rateLimit from "express-rate-limit";
import { envInt } from "../utils/env-int";

// Proteção geral contra abuso — aplicada em toda /api/v1. Limite bem mais folgado
// do que o de login, só pra conter uso excessivo/automatizado da API como um todo.
export const apiRateLimiter = rateLimit({
  windowMs: envInt("API_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: envInt("API_RATE_LIMIT_MAX", 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas requisições. Tente novamente mais tarde." },
});

// Login é o alvo clássico de força bruta — limite bem mais restritivo que o
// geral, e conta só tentativas que FALHAM (skipSuccessfulRequests), pra não
// travar um usuário legítimo que simplesmente errou a senha uma vez.
export const authRateLimiter = rateLimit({
  windowMs: envInt("AUTH_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: envInt("AUTH_RATE_LIMIT_MAX", 5),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});
