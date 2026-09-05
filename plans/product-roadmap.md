# Roadmap de evolução do Confeiti

- Status: `In progress`
- Branch inicial: `feat/onboarding-roadmap`
- Próxima versão: `1.0.47`

## Objetivo

Entregar uma experiência completa para a confeitaria, evoluindo do cadastro inicial até
controle financeiro, estoque, comunicação, relatórios e operação confiável.

## Fases

### 1. Onboarding inicial

- [x] Exibir guia de primeiros passos para empresas sem cadastros.
- [x] Oferecer kit de produtos, ingredientes e materiais de exemplo.
- [x] Evitar duplicar o kit quando o usuário clicar novamente.
- [x] Informar falhas parciais e permitir nova tentativa.
- [ ] Validar o fluxo em desktop e mobile.

### 2. Controle financeiro

- [x] Criar lançamentos de despesas e consolidar receitas dos pagamentos.
- [x] Separar recebido e pendente no resumo financeiro.
- [x] Exibir caixa líquido e lucro estimado por período no painel.
- [x] Exportar relatório financeiro em CSV.

### 3. Estoque automático

- [x] Baixar materiais ao confirmar/iniciar uma encomenda.
- [x] Reverter a baixa ao cancelar ou reabrir a encomenda.
- [x] Exibir histórico e alertas de estoque mínimo.
- [x] Cobrir idempotência e composição com testes unitários.

### 4. Vendas e comunicação

- [ ] Converter orçamento em encomenda confirmada.
- [x] Criar templates de WhatsApp por status.
- [x] Avisar o cliente sobre o status atual com um clique.
- [ ] Enviar lembretes de entrega e cobrança.
- [x] Registrar o histórico de comunicação.

### 5. Relatórios

- [ ] Faturamento, margem e lucro por período.
- [ ] Produtos mais vendidos e clientes recorrentes.
- [ ] Consumo e custo de ingredientes e materiais.
- [ ] Exportação PDF/CSV conforme o plano.

### 6. Confiabilidade

- [ ] Golden signals no Grafana: latência, tráfego, erros e saturação.
- [x] Logs estruturados com correlação de requisição.
- [x] Traces automáticos da API via OpenTelemetry.
- [ ] Alertas de indisponibilidade, erro e falha de pagamento.
- [ ] Testes E2E dos fluxos críticos e backup restaurável.

## Critérios de entrega

Cada fase será entregue em branch própria, com plano, versão, changelog, PR, build validado,
healthcheck pós-deploy e rollback documentado.
