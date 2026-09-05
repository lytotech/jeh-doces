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

- [ ] Criar lançamentos de receitas e despesas.
- [ ] Separar recebido, pendente e vencido.
- [ ] Exibir fluxo de caixa e lucro real por período.
- [ ] Exportar relatório financeiro.

### 3. Estoque automático

- [ ] Baixar ingredientes e materiais ao concluir uma encomenda.
- [ ] Reverter a baixa ao cancelar ou reabrir a encomenda.
- [ ] Exibir histórico e alertas de estoque mínimo.
- [ ] Cobrir concorrência e idempotência com testes.

### 4. Vendas e comunicação

- [ ] Converter orçamento em encomenda confirmada.
- [ ] Criar templates de WhatsApp por status.
- [ ] Enviar lembretes de entrega e cobrança.
- [ ] Registrar o histórico de comunicação.

### 5. Relatórios

- [ ] Faturamento, margem e lucro por período.
- [ ] Produtos mais vendidos e clientes recorrentes.
- [ ] Consumo e custo de ingredientes e materiais.
- [ ] Exportação PDF/CSV conforme o plano.

### 6. Confiabilidade

- [ ] Golden signals no Grafana: latência, tráfego, erros e saturação.
- [ ] Logs estruturados com correlação de requisição.
- [ ] Traces de autenticação, pedidos, estoque e billing.
- [ ] Alertas de indisponibilidade, erro e falha de pagamento.
- [ ] Testes E2E dos fluxos críticos e backup restaurável.

## Critérios de entrega

Cada fase será entregue em branch própria, com plano, versão, changelog, PR, build validado,
healthcheck pós-deploy e rollback documentado.
