# Changelog

Todas as mudanças notáveis do Confeiti serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não publicado]

## [1.0.63] - 2026-09-05

### Adicionado

- Contador OpenTelemetry para falhas do provedor de pagamentos.
- Regra de alerta ConfeitiBillingProviderFailure no Prometheus/Grafana.

## [1.0.62] - 2026-09-05

### Adicionado

- Preferências de lembretes automáticos de entrega e cobrança.
- Fila idempotente de lembretes e ação de envio pelo WhatsApp no painel.

## [1.0.61] - 2026-09-05

### Adicionado

- Filtros independentes para os relatórios financeiros e operacionais.
- Exportações e impressão passam a respeitar o período selecionado.

## [1.0.51] - 2026-09-05

### Adicionado

- Logs HTTP estruturados com duração, status, rota e correlação por `x-request-id`.
- Smoke test para garantir a correlação das requisições.

## [1.0.50] - 2026-09-05

### Adicionado

- Exportação CSV dos indicadores e despesas do controle financeiro.

## [1.0.49] - 2026-09-05

### Corrigido

- Estoque agora é estornado ao cancelar ou reabrir encomendas que já tiveram baixa automática.
- Baixas e estornos permanecem idempotentes e registrados no histórico de movimentações.

## [1.0.60] - 2026-09-05

### Corrigido

- Restauração de backup agora valida a estrutura antes de limpar os dados da empresa.
- Adicionados testes para backups válidos e inválidos.

## [1.0.59] - 2026-09-05

### Alterado

- Falhas do Mercado Pago agora geram eventos estruturados para observabilidade.
- Logs de billing não incluem tokens, valores, e-mails ou respostas do provedor.

## [1.0.58] - 2026-09-05

### Adicionado

- Relatório operacional imprimível e salvável como PDF para o plano Completo.
- Exportação PDF bloqueada visualmente para empresas no plano Básico.

## [1.0.57] - 2026-09-05

### Adicionado

- Exportação CSV do relatório operacional com indicadores, produtos, clientes e materiais.

## [1.0.56] - 2026-09-05

### Adicionado

- Botão explícito para confirmar um orçamento e reservar a encomenda.
- Lembretes manuais de entrega e cobrança pelo WhatsApp, com histórico.

## [1.0.55] - 2026-09-05

### Adicionado

- Linha do tempo de comunicações no detalhe da encomenda.
- Atualização imediata do histórico após enviar um aviso pelo WhatsApp.

## [1.0.54] - 2026-09-05

### Adicionado

- Relatório operacional por período com faturamento, margem, lucro e recebimentos.
- Ranking de produtos vendidos, clientes recorrentes e consumo/custo de materiais.

## [1.0.53] - 2026-09-05

### Adicionado

- Histórico persistente dos avisos de WhatsApp por empresa e encomenda.
- Registro do status, template, destinatário e canal de cada comunicação.

## [1.0.52] - 2026-09-05

### Adicionado

- Mensagens de WhatsApp prontas para cada status da encomenda.
- Ação para avisar o cliente sobre o andamento da encomenda com um clique.
- Plano da fase de vendas e comunicação, incluindo próximos lembretes e histórico.

## [1.0.48] - 2026-09-05

### Adicionado

- Livro-caixa com lançamento de despesas e resumo de recebido, a receber, despesas e caixa líquido.
- Endpoints protegidos e isolados por empresa para operações financeiras.

## [1.0.47] - 2026-09-05

### Alterado

- Onboarding passou a reutilizar cadastros existentes e evitar duplicação do kit inicial.
- Adicionado roadmap das próximas fases de evolução do produto.

## [1.0.46] - 2026-09-05

### Corrigido

- Tornado o processamento de webhooks aprovados idempotente também para o mesmo pagamento repetido.
- Adicionados testes de conciliação, sincronização e estorno de pagamentos.

## [1.0.45] - 2026-09-05

### Corrigido

- Sincronização de pagamentos agora envia uma requisição JSON válida ao Fastify.
- Webhooks aprovados são conciliados mesmo quando chegam antes da gravação local.
- Pagamentos duplicados preservam o período pago sem ativar um segundo período.
- Histórico permite solicitar estorno de cobranças aprovadas duplicadas.

## [1.0.44] - 2026-09-05

### Corrigido

- Links públicos passam a respeitar o período pago da assinatura, inclusive quando a renovação foi cancelada.
- Empresas com plano ativo não conseguem criar novas cobranças Pix ou recorrentes.

## [1.0.43] - 2026-09-05

### Corrigido

- Cobranças Pix pendentes antigas agora podem ser canceladas individualmente pela tela Meu plano.

## [1.0.42] - 2026-09-05

### Alterado

- Configurações & Backup agora são uma tela própria, separada do gerenciamento de assinatura.
- Removidos o plano da tela de configurações e o banner global de pagamento.

## [1.0.41] - 2026-09-05

### Adicionado

- Fluxo de contribuição com planos versionados, PR obrigatório e validação de Conventional Commits.
- Template de PR com critérios de aceite, testes, impacto, deploy e rollback.

### Testes

- Adicionadas verificações locais e no CI para formatação, lint, build e smoke test da API.
