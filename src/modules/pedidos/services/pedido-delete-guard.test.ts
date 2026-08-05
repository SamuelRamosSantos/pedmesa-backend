import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../../usuarios/entities/user.entity";
import { StatusItem } from "../entities/item-pedido.entity";
import { assertPodeExcluirPedido } from "./pedido-delete-guard";

describe("assertPodeExcluirPedido", () => {
  it("permite o próprio garçom excluir o pedido quando todos os itens que precisam de preparo estão pendentes", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [
          { statusItem: StatusItem.PENDENTE, precisaPreparo: true },
          { statusItem: StatusItem.PENDENTE, precisaPreparo: true },
        ],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "garcom-1",
        actingUserRoles: [UserRole.GARCOM],
      })
    ).not.toThrow();
  });

  it("rejeita quando ao menos um item que precisa de preparo já saiu de pendente (em_preparo)", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [
          { statusItem: StatusItem.PENDENTE, precisaPreparo: true },
          { statusItem: StatusItem.EM_PREPARO, precisaPreparo: true },
        ],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "garcom-1",
        actingUserRoles: [UserRole.GARCOM],
      })
    ).toThrow(AppError);
  });

  it("permite excluir quando há um item auto-pronto (nasceu pronto) ainda não entregue, junto de itens pendentes", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [
          { statusItem: StatusItem.PENDENTE, precisaPreparo: true },
          { statusItem: StatusItem.PRONTO, precisaPreparo: false },
        ],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "garcom-1",
        actingUserRoles: [UserRole.GARCOM],
      })
    ).not.toThrow();
  });

  it("rejeita quando o item auto-pronto já foi entregue ao cliente", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [
          { statusItem: StatusItem.PENDENTE, precisaPreparo: true },
          { statusItem: StatusItem.ENTREGUE, precisaPreparo: false },
        ],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "garcom-1",
        actingUserRoles: [UserRole.GARCOM],
      })
    ).toThrow(AppError);
  });

  it("ignora itens cancelados na checagem, de qualquer tipo", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [
          { statusItem: StatusItem.CANCELADO, precisaPreparo: true },
          { statusItem: StatusItem.PRONTO, precisaPreparo: false },
        ],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "garcom-1",
        actingUserRoles: [UserRole.GARCOM],
      })
    ).not.toThrow();
  });

  it("rejeita quando um garçom tenta excluir o pedido de outro garçom", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [{ statusItem: StatusItem.PENDENTE, precisaPreparo: true }],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "garcom-2",
        actingUserRoles: [UserRole.GARCOM],
      })
    ).toThrow(AppError);
  });

  it("permite um admin excluir o pedido de qualquer garçom, mesmo não sendo o dono", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [{ statusItem: StatusItem.PENDENTE, precisaPreparo: true }],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "admin-1",
        actingUserRoles: [UserRole.ADMIN],
      })
    ).not.toThrow();
  });

  it("mesmo um admin não pode excluir se um item que precisa de preparo já não está mais pendente", () => {
    expect(() =>
      assertPodeExcluirPedido({
        itens: [{ statusItem: StatusItem.PRONTO, precisaPreparo: true }],
        pedidoUsuarioId: "garcom-1",
        actingUserId: "admin-1",
        actingUserRoles: [UserRole.ADMIN],
      })
    ).toThrow(AppError);
  });
});
