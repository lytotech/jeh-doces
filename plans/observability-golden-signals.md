# Observabilidade e golden signals

- Status: `In progress`
- Branch: `feat/observability-golden-signals`
- Versão: `1.0.51`

## Critérios de aceite

- [x] Traces e métricas OpenTelemetry continuam habilitados por configuração.
- [x] Toda requisição recebe ou preserva `x-request-id`.
- [x] Logs HTTP estruturados registram rota, método, status, duração e correlação.
- [x] Logs não incluem cookies, tokens, corpo ou dados financeiros.
- [x] Smoke test valida o cabeçalho de correlação.
- [ ] Dashboard Grafana com latência, tráfego, erros e saturação.
- [ ] Alertas de indisponibilidade, erro e falha de pagamento.
- [x] API emite eventos estruturados para falhas do provedor de pagamentos.
- [ ] Validar coleta no ambiente de produção.
