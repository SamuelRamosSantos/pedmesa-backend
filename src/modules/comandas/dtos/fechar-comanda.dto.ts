import {
  assertValidDescontoInput,
  DescontoInputDto,
} from "./desconto-input.validator";

export type FecharComandaDto = DescontoInputDto;
export const assertValidFecharComandaDto = assertValidDescontoInput;
