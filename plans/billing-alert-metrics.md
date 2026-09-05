# Métrica e alerta de falha de pagamento

- Status: `In progress`
- Branch: `feat/billing-alert-metrics`
- PR: `#pending`
- Versão: `1.0.63`

## Objetivo

Permitir que falhas do Mercado Pago sejam detectadas por métrica e alerta, sem
expor credenciais, valores ou dados pessoais.

## Escopo

- Incluído: contador OpenTelemetry, regra Prometheus/Grafana e documentação do sinal.
- Não incluído: alteração do fluxo de cobrança ou retry automático.

## Critérios de aceite

- [x] Cada falha registrada no log estruturado incrementa o contador.
- [x] A métrica não possui empresa, e-mail, token ou valor como label.
- [x] Regra alerta quando há falha do provedor nos últimos dez minutos.
- [ ] Validar a coleta e o disparo no ambiente de produção.

## Testes

- [x] `npm run verify`
- [x] Schema/alerta validado estaticamente.

## Pós-deploy

- [ ] Aplicar a regra no Prometheus/Grafana
- [ ] Simular falha controlada e confirmar notificação
- [ ] Status atualizado para `Completed`
