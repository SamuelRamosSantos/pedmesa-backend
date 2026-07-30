# ⚡ Arquitetura Real-Time & Serviço de Impressão - PedMesa

Este documento detalha o funcionamento dos eventos em tempo real (WebSockets) e o fluxo assíncrono de impressão térmica na cozinha.

---

## 1. Comunicação Real-Time (WebSockets)

A aplicação utiliza WebSockets (Socket.io / WS) para atualizar as telas da cozinha (KDS), dos garçons e do caixa sem a necessidade de atualizar a página (refresh).

### Salas (Rooms) por Tenant

Para garantir o isolamento multi-tenant nos WebSockets, cada dispositivo conectado entra em uma sala específica correspondente ao seu tenant_id:

- Nome da Sala: tenant\_{tenant_id}

### Eventos Disparados pelo Servidor

1. pedido:criado
   - Destino: Painel KDS (Cozinha) e Caixa
   - Payload: Retorna o ID do pedido, número da comanda, itens lançados, observações e o nome da pessoa (se for item individual).

2. pedido:status_alterado
   - Destino: App do Garçom e Caixa
   - Payload: Notifica quando a cozinha altera o status de um item (ex: de em_preparo para pronto).

3. comanda:atualizada
   - Destino: Mapa de Mesas do Garçom e Caixa
   - Payload: Notifica a abertura de uma nova comanda ou a junção de mesas.

---

## 2. Fluxo Assíncrono de Impressão Térmica (Fila de Impressão)

Para evitar que uma impressora térmica sem papel, desligada ou com lentidão trave a requisição no app do garçom, o disparo de impressão é feito de forma totalmente assíncrona usando uma Fila de Tarefas (Queue Manager / Redis / BullMQ).

### Diagrama do Fluxo de Impressão:

```text
1. Garçom clica em Enviar Pedido no App Mobile.
2. A API salva o pedido no PostgreSQL e responde imediatamente 201 Created na tela do Garçom (< 1 segundo).
3. Em segundo plano, a API adiciona um Job na fila de impressão (impressao_cozinha_queue).
4. O Worker de Impressão processa o Job e envia os comandos ESC/POS para a impressora IP/USB da cozinha.
5. Se a impressora falhar (offline/sem papel):
   - O Worker tenta reenviar automaticamente até 3 vezes.
   - Caso persista o erro, um alerta de erro de impressão é emitido via WebSocket para o Caixa.
```
