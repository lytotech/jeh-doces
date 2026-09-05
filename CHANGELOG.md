# Changelog

Todas as mudanças notáveis do Confeiti serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não publicado]

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
