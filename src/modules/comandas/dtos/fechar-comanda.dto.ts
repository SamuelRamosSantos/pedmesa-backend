import { DescontoInputDto, assertValidDescontoInput } from "./desconto-input.validator";

export type FecharComandaDto = DescontoInputDto;
export const assertValidFecharComandaDto = assertValidDescontoInput;
