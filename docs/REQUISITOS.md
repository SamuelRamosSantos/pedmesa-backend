# Requisitos — PedMesa

> Fonte: código da `main` e cards do Jira (projeto PED). Requisitos marcados como **(planejado)** ainda não estão na `main`; ver `docs/ANDAMENTO.md`.

## 1. Perfis de usuário

| Perfil      | Quem é                             | O que faz                                                                                              |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Super-admin | Equipe do PedMesa                  | Cadastra e gerencia tenants, impersona para suporte e lê os leads                                      |
| Admin       | Dono ou gerente do estabelecimento | Cardápio, usuários, impressoras, taxas de entrega, configurações e dashboard; acesso a todas as visões |
| Caixa       | Operador do caixa                  | Mapa de mesas, extrato, descontos (com permissão), pagamentos, pré-conta e fechamento                  |
| Garçom      | Atendimento no salão               | Abre comandas, adiciona integrantes e lança pedidos                                                    |
| Cozinha     | Cozinha ou bar                     | KDS: avança o preparo dos itens e controla a disponibilidade dos produtos                              |
| Expedição   | Atendimento do delivery            | Identifica o cliente, registra o pedido delivery e opera o painel de expedição (ADR-001, PED-113)      |
| Visitante   | Interessado na landing page        | Envia contato (lead) pelo `pedmesa-site`                                                               |

Um usuário pode ter vários papéis; com mais de um, escolhe a visão após o login.

## 2. Requisitos funcionais

### Autenticação e tenants

- **RF-01** Login por e-mail e senha, com sessão em cookie HttpOnly e logout que encerra a sessão.
- **RF-02** Tenant suspenso ou cancelado não consegue entrar.
- **RF-03** O admin consulta e altera as configurações do estabelecimento (dados da empresa, endereço, módulo de cozinha, quantidade de comandas e configuração do delivery).
- **RF-04** O admin gera o token do agente de impressão.

### Super-admin

- **RF-05** Cadastrar, listar e editar tenants e mudar o status (`ativo`, `suspenso`, `cancelado`).
- **RF-06** Impersonar um tenant para suporte, com auditoria das ações de escrita.
- **RF-07** Listar os leads captados pela landing page.

### Usuários

- **RF-08** O admin cadastra, lista e edita usuários, troca senha e ativa ou desativa contas.
- **RF-09** O admin define quem pode conceder desconto e quem pode excluir item no fechamento.

### Cardápio

- **RF-10** Cadastrar categorias e produtos (preço, se precisa de preparo, ativo e imagem).
- **RF-11** Admin e cozinha marcam um produto como disponível ou indisponível.

### Comandas e pedidos

- **RF-12** Abrir comanda por número de mesa, adicionar integrantes e juntar comandas.
- **RF-13** Lançar pedidos com itens atribuídos a um integrante ou compartilhados.
- **RF-14** A cozinha acompanha e avança o status de preparo de cada item (KDS).
- **RF-15** Excluir pedido ou item, conforme o papel e a permissão.
- **RF-16** Consultar o extrato com a divisão da conta por integrante.
- **RF-17** Aplicar desconto percentual ou em valor fixo.
- **RF-18** Registrar e remover pagamentos (Pix, dinheiro, cartão de crédito e de débito).
- **RF-19** Imprimir a pré-conta.
- **RF-20** Fechar e cancelar comanda.

### Impressão

- **RF-21** Cadastrar impressoras de rede (IP e porta) por tenant.
- **RF-22** Enviar pedidos de cozinha, pré-contas e tickets de entrega para impressão, por TCP ou pelo agente desktop.
- **RF-23** O agente consulta os jobs pendentes e informa o resultado de cada um.

### Dashboard, leads e arquivos

- **RF-24** O admin vê os indicadores de vendas e operação no dashboard.
- **RF-25** A landing page registra leads sem login.
- **RF-29** O admin envia imagens (JPEG, PNG ou WebP, até 5 MB) para produtos e perfis.

### Delivery

- **RF-26** Identificar o cliente pelo telefone e manter seus endereços.
- **RF-27** Configurar taxas de entrega por bairro e cotar o frete.
- **RF-28** Registrar o pedido delivery com troco, imprimir os tickets de cozinha e de entrega e acompanhar a entrega no painel de expedição, com status sincronizado ao preparo.
- **RF-30 (planejado, PED-82)** Telas de novo pedido delivery, painel Kanban de expedição e administração das taxas no frontend.

## 3. Requisitos não funcionais

- **RNF-01** Isolamento multi-tenant: nenhum dado de um tenant é lido ou gravado por outro; o tenant vem da sessão.
- **RNF-02** Integridade: operações que gravam em várias tabelas são atômicas; mudanças concorrentes de status de entrega são controladas.
- **RNF-03** Precisão monetária: cálculos em centavos inteiros.
- **RNF-04** Segurança: senhas com hash `bcrypt`, sessão em cookie HttpOnly, segredos só em variáveis de ambiente, segredo separado para o super-admin, rate limit e sem `X-Powered-By`. Hardening adicional no épico PED-53.
- **RNF-05** Qualidade: `strict` no TypeScript, Biome sem avisos, testes unitários da lógica pura, testes de integração com banco descartável e CI em todo Pull Request.
- **RNF-06** Operação: `/health` e `/ready` para deploy e monitoramento.
- **RNF-07** Contrato estável: respostas em `snake_case` montadas por mappers.

## 4. Regras de negócio

- **RN-01** O número da comanda vai de 1 até o `quantidade_comandas` do tenant e não se repete entre comandas abertas.
- **RN-02** Comanda fechada não aceita pedido, pagamento, desconto nem alteração.
- **RN-03** O status de um item só muda pelas transições de `TRANSICOES_VALIDAS` (ver `ARQUITETURA.md`, seção 7).
- **RN-04** Só usuário com `pode_conceder_desconto` aplica desconto.
- **RN-05** Itens compartilhados são divididos igualmente entre os integrantes; itens individuais ficam com o integrante. Itens cancelados não são cobrados.
- **RN-06** Valores monetários são calculados em centavos. A cota compartilhada de cada pessoa é arredondada para o centavo mais próximo, então a soma das cotas pode diferir do total da comanda em alguns centavos.
- **RN-07** Ações de escrita feitas durante a impersonação são registradas em `audit_logs`.
- **RN-08** O histórico de status de entrega é imutável (append-only).
- **RN-09** A taxa de entrega soma ao total do pedido delivery e não recebe desconto.
- **RN-10** O status da entrega só muda pelas transições permitidas; cancelar ou voltar de `em_rota` para `pronto_para_envio` exige motivo.
- **RN-11** O troco tem um limite de sanidade (`TROCO_MAXIMO_CENTS`).

## 5. Restrições e premissas

- Um backend para todos os tenants, banco PostgreSQL único com `tenant_id` em todas as tabelas de negócio.
- A impressão local depende do agente desktop Windows (`pedmesa-print-agent`).
- Hospedagem no Coolify, em VPS própria; imagens em storage compatível com S3 em produção.
- Rastreamento de trabalho no Jira (projeto PED).
