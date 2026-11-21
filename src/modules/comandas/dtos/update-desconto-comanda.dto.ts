import {
  assertValidDescontoInput,
  DescontoInputDto,
} from "./desconto-input.validator";

export type UpdateDescontoComandaDto = DescontoInputDto;
export const assertValidUpdateDescontoComandaDto = assertValidDescontoInput;
