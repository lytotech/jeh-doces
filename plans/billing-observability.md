# Plano: observabilidade de pagamentos

## Objetivo

Permitir que falhas do Mercado Pago sejam identificadas no Loki/Grafana sem registrar
tokens, e-mails, valores ou conteúdo de respostas do provedor.

## Entrega

- [x] Emitir eventos JSON com operação, provedor, status HTTP e resultado esperado.
- [x] Cobrir criação Pix, assinatura recorrente, cancelamento, sincronização e estorno.
- [x] Manter os eventos livres de credenciais, valores e dados pessoais.
- [ ] Criar alerta Grafana/Loki para `billing_provider_failure`.
- [ ] Validar um erro controlado no ambiente de produção.

## Validação

- `npm run verify`
- Conferir que o evento contém `event=billing_provider_failure` e `provider=mercadopago`.
- Confirmar que a resposta ao usuário continua genérica.

## Rollback

Reverter o commit da branch. A mudança só altera a forma dos logs de erro.
