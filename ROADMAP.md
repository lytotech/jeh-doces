# Roadmap do Confeiti

Objetivo: transformar o Confeiti em uma aplicação confiável para produção, com onboarding simples, cobrança recorrente e proteção dos dados das confeitarias.

## Status atual

- [x] Cadastro de produtos, receitas, ingredientes, materiais e clientes.
- [x] Encomendas, calendário, produção, pagamentos e relatórios básicos.
- [x] Categorias persistentes e duplicação de produtos.
- [x] Links públicos de pedidos com bloqueio por plano.
- [x] Planos Básico e Completo.
- [x] Pix manual e assinatura recorrente via Mercado Pago.
- [x] Cancelamento de renovação e cancelamento de cobrança Pix pendente.
- [x] LGPD com solicitação de exclusão e janela de recuperação de 90 dias.
- [x] Onboarding inicial com kit de ingredientes, materiais e produtos de exemplo.
- [x] PWA instalável, OpenTelemetry, logs, traces, métricas e dashboards.

## Fase 1 — Estabilização em produção

Prioridade: máxima.

- [ ] Validar o deploy atual e o healthcheck após cada publicação.
- [ ] Testar o link público `/pedido/:token` em navegador anônimo.
- [ ] Testar o fluxo completo do Pix: gerar, pagar, receber webhook e liberar o plano.
- [ ] Testar reutilização e cancelamento de cobrança pendente.
- [ ] Testar assinatura mensal e anual no Mercado Pago.
- [ ] Confirmar que o Plano Básico não acessa recursos premium por chamadas diretas à API.
- [ ] Corrigir as vulnerabilidades reportadas pelo Dependabot.

Critério de conclusão: nenhuma falha conhecida nos fluxos de login, cadastro, encomenda, link público e pagamento.

## Fase 2 — Pagamentos confiáveis

- [ ] Criar retry controlado para webhooks que falharem.
- [ ] Registrar eventos de webhook e resultado do processamento.
- [ ] Implementar reconciliação de pagamentos pendentes e recorrentes.
- [ ] Tratar cobranças recusadas, expiradas, canceladas e duplicadas.
- [ ] Exibir histórico detalhado de cobranças no painel de configurações.
- [ ] Criar testes automatizados para Pix, assinatura e idempotência.

Critério de conclusão: o status da assinatura sempre converge para o status real do Mercado Pago.

## Fase 3 — Dados, LGPD e recuperação

- [ ] Separar o scheduler de contas do processo HTTP principal.
- [ ] Inativar contas após 90 dias de forma segura e auditável.
- [ ] Garantir reativação sem conflito com uma nova empresa usando o mesmo e-mail.
- [ ] Criar backup automático externo.
- [ ] Testar restauração de backup em ambiente separado.
- [ ] Criar alerta para backup atrasado ou com falha.
- [ ] Registrar auditoria para exclusão, reativação e alterações críticas.

Critério de conclusão: dados podem ser recuperados dentro do prazo definido e contas não conflitam entre si.

## Fase 4 — Segurança e permissões

- [ ] Revisar rate limit de login, recuperação de senha e webhooks.
- [ ] Revisar validação de payloads em todos os endpoints.
- [ ] Finalizar permissões de proprietário, administrador e funcionário.
- [ ] Corrigir e testar convites de equipe.
- [ ] Adicionar remoção de membros e histórico de alterações.
- [ ] Revisar secrets e avisos do build Docker.

Critério de conclusão: cada operação sensível é validada no backend e possui registro quando necessário.

## Fase 5 — Experiência do usuário

- [ ] Melhorar mensagens de erro e estados de carregamento.
- [ ] Adicionar central de ajuda e FAQ.
- [ ] Permitir reabrir o onboarding pelo menu de ajuda.
- [ ] Mostrar claramente os limites e funcionalidades disponíveis do plano atual.
- [ ] Adicionar notificações de pagamento, vencimento e encomenda.
- [ ] Melhorar responsividade mobile e acessibilidade.

Critério de conclusão: um novo usuário consegue cadastrar dados e criar a primeira encomenda sem suporte externo.

## Fase 6 — Crescimento do produto

- [ ] Relatórios financeiros avançados.
- [ ] Integração de notificações por WhatsApp e e-mail.
- [ ] Mais opções de exportação.
- [ ] Área administrativa para assinaturas e suporte.
- [ ] Indicadores de conversão, retenção e cancelamento.
- [ ] Pesquisa de satisfação e coleta de feedback.

Critério de conclusão: o produto possui dados suficientes para melhorar retenção e tomar decisões comerciais.

## Rotina para cada alteração

1. Implementar uma melhoria pequena e isolada.
2. Executar `npm run build`.
3. Executar os testes relacionados.
4. Atualizar a versão.
5. Fazer commit e push.
6. Validar o deploy e os logs em produção.
7. Marcar o item concluído neste arquivo.

## Próximo item

Começar pela **Fase 1**, validando o deploy `1.0.38` e o fluxo real de pagamentos antes de avançar para o scheduler e os backups.
