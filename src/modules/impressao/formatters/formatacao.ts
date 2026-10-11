// Formatação de texto dos cupons. Portada 1:1 em pedmesa-print-agent/src/print/formatacao.js:
// ao mudar aqui, mude lá no mesmo commit.

export function formatarMoeda(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

// Telefone gravado só com dígitos (10 fixo, 11 celular) → "(11) 98765-4321".
export function formatarTelefone(digitos: string): string {
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return digitos;
}

// CEP gravado com 8 dígitos → "01310-100".
export function formatarCep(digitos: string): string {
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

// Linha que identifica o pedido no cupom: mesa ("Comanda/Mesa: #12") ou delivery
// ("DELIVERY #0007", com 4 dígitos para destacar e caber no padrão do balcão).
export function identificacaoDoPedido(numeroComanda: number | null, numeroEntrega: number | null): string {
  if (numeroComanda !== null) {
    return `Comanda/Mesa: #${numeroComanda}`;
  }

  if (numeroEntrega !== null) {
    return `DELIVERY #${String(numeroEntrega).padStart(4, "0")}`;
  }

  return "Pedido sem identificação";
}
