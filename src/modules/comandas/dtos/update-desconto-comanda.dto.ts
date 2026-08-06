import { DescontoInputDto, assertValidDescontoInput } from "./desconto-input.validator";

export type UpdateDescontoComandaDto = DescontoInputDto;
export const assertValidUpdateDescontoComandaDto = assertValidDescontoInput;
