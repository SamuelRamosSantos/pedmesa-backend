import { AppError } from "../../../shared/errors/app-error";
import { TipoAtendimento } from "../entities/comanda.entity";

// Juntar comandas é coisa de mesa (ADR-001, PED-103): uma comanda delivery tem cliente,
// endereço e taxa próprios, e juntá-la fecharia a entrega sem passar pela expedição.
// Recebe só as comandas já encontradas no tenant, então a mensagem não expõe nada de fora.
export function assertComandasPodemSerJuntadas(comandas: readonly { tipoAtendimento: TipoAtendimento }[]): void {
  if (comandas.some((comanda) => comanda.tipoAtendimento === TipoAtendimento.DELIVERY)) {
    throw new AppError("Comandas de delivery não podem ser juntadas.", 400);
  }
}
