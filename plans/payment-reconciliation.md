# Conciliação de pagamentos e estorno de duplicidades

- Status: `In progress`
- Branch: `fix/payment-reconciliation`
- Versão: `1.0.45`

## Objetivo

Registrar todos os pagamentos aprovados pelo Mercado Pago, tolerar webhooks fora de ordem e impedir que uma cobrança Pix duplicada crie um segundo período de assinatura.

## Critérios de aceite

- [x] Sincronização não retorna 415 por falta de Content-Type.
- [x] Webhook aprovado cria ou atualiza o registro local de pagamento de forma idempotente.
- [x] Sincronização verifica a cobrança pendente, a cobrança vigente e o histórico recente.
- [x] Período vigente é preservado quando outra cobrança aprovada é identificada como duplicada.
- [x] Estorno exige pagamento aprovado pertencente à empresa e usuário administrativo.
- [ ] Reparar os dois pagamentos aprovados identificados em produção, mantendo o primeiro e estornando o segundo.

## Impacto e rollback

- API, frontend de billing e migration Prisma adicionando metadados de estorno.
- Rollback de código não desfaz estornos já confirmados no Mercado Pago.
- A reparação de produção será executada somente após backup e confirmação do status remoto.

## Testes

- [x] Build shared, web e API.
- [x] Teste de validade do período pago em estados active, pending e canceled.
- [ ] Testes de webhook fora de ordem, duplicado, sincronização e estorno.
- [ ] Validação pós-deploy em produção.
