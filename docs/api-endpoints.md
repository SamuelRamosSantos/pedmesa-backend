# 🌐 Especificação da API REST - PedMesa

Este documento define os contratos de rotas, parâmetros e estruturas de dados (JSON) da API REST do PedMesa.

---

## 1. Padrões Globais da API

- Prefixo Base: /api/v1
- Formato dos Dados: application/json
- Headers Obrigatórios nas Rotas Autenticadas:
  - Authorization: Bearer <JWT_TOKEN>
  - X-Tenant-ID: <UUID_DO_TENANT> (Injetado via middleware a partir do token)

---

## 2. Autenticação & Perfil

### POST /api/v1/auth/login

Autentica o usuário e retorna o token de acesso contendo o tenant_id e a role.

Request Body:

```json
{
  "email": "garcom@lanchonete.com",
  "senha": "123"
}
```

Response (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "usuario": {
    "id": "e9a03b66-2d18-4e89-8d7d-e6b77209931d",
    "nome": "João Garçom",
    "role": "garcom",
    "tenant_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
  }
}
```

---

## 3. Comandas & Integrantes

### POST /api/v1/comandas

Abre uma nova comanda vinculada a um número de comanda física/mesa e cadastra os integrantes da mesa.

Request Body:

```json
{
  "numero_comanda": 15,
  "integrantes": [{ "nome": "Lucas" }, { "nome": "Mariana" }]
}
```

Response (201 Created):

```json
{
  "id": "c1f7a012-3b4e-4f62-9e8a-112233445566",
  "numero_comanda": 15,
  "status": "aberta",
  "aberta_em": "2026-07-29T22:30:00.000Z",
  "integrantes": [
    { "id": "f8c3de11-1111-2222-3333-444455556666", "nome": "Lucas" },
    { "id": "a9d4ef22-2222-3333-4444-555566667777", "nome": "Mariana" }
  ]
}
```

---

### GET /api/v1/comandas

Lista todas as comandas do estabelecimento.

Query Parameters:

- status (opcional): aberta | fechada (Padrão: aberta)

Response (200 OK):

```json
[
  {
    "id": "c1f7a012-3b4e-4f62-9e8a-112233445566",
    "numero_comanda": 15,
    "status": "aberta",
    "total_integrantes": 2,
    "aberta_em": "2026-07-29T22:30:00.000Z"
  }
]
```

---

### POST /api/v1/comandas/{id}/integrantes

Adiciona um novo integrante a uma comanda já aberta.

Request Body:

```json
{
  "nome": "Carlos"
}
```

---

## 4. Pedidos & Itens (Lançamento Inteligente)

### POST /api/v1/comandas/{id}/pedidos

Lança um grupo de itens na comanda e envia a impressão para a cozinha.

Request Body:

```json
{
  "itens": [
    {
      "produto_id": "b1112222-3333-4444-5555-666677778888",
      "integrante_id": "f8c3de11-1111-2222-3333-444455556666",
      "quantidade": 1,
      "observacao": "Sem cebola"
    },
    {
      "produto_id": "c2223333-4444-5555-6666-777788889999",
      "integrante_id": null,
      "quantidade": 1,
      "observacao": "Com maionese da casa"
    }
  ]
}
```

Response (201 Created):

```json
{
  "pedido_id": "d3334444-5555-6666-7777-888899990000",
  "status_preparo": "pendente",
  "mensagem": "Pedido enviado e enfileirado para impressão."
}
```

---

## 5. Extrato, Junção & Fechamento de Conta

### GET /api/v1/comandas/{id}/extrato

Retorna o espelho da comanda detalhado para o caixa ou garçom, aplicando a regra de divisão por pessoa.

Response (200 OK):

```json
{
  "comanda_id": "c1f7a012-3b4e-4f62-9e8a-112233445566",
  "numero_comanda": 15,
  "resumo_financeiro": {
    "total_itens_individuais": 45.0,
    "total_itens_compartilhados": 30.0,
    "quantidade_integrantes": 2,
    "valor_compartilhado_por_pessoa": 15.0,
    "valor_total_comanda": 75.0
  },
  "divisao_por_integrante": [
    {
      "integrante_id": "f8c3de11-1111-2222-3333-444455556666",
      "nome": "Lucas",
      "itens_individuais": [
        { "produto": "X-Salada", "qtd": 1, "subtotal": 25.0 }
      ],
      "total_individual": 25.0,
      "cota_compartilhada": 15.0,
      "total_a_pagar": 40.0
    },
    {
      "integrante_id": "a9d4ef22-2222-3333-4444-555566667777",
      "nome": "Mariana",
      "itens_individuais": [
        { "produto": "Suco de Laranja", "qtd": 2, "subtotal": 20.0 }
      ],
      "total_individual": 20.0,
      "cota_compartilhada": 15.0,
      "total_a_pagar": 35.0
    }
  ]
}
```

---

### POST /api/v1/comandas/juntar

Junta uma ou mais comandas secundárias em uma comanda principal na mesma mesa.

Request Body:

```json
{
  "comanda_principal_id": "c1f7a012-3b4e-4f62-9e8a-112233445566",
  "comandas_secundarias_ids": ["e5556666-7777-8888-9999-000011112222"]
}
```

---

### POST /api/v1/comandas/{id}/fechar

Encerra a comanda registrando as formas de pagamento e liberando a mesa.

Request Body:

```json
{
  "pagamentos": [
    { "forma": "pix", "valor": 40.0 },
    { "forma": "cartao_credito", "valor": 35.0 }
  ]
}
```

Response (200 OK):

```json
{
  "status": "fechada",
  "mensagem": "Comanda quitada com sucesso e liberada para o salão."
}
```
