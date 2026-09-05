# Plano: vendas e comunicação

## Objetivo

Dar continuidade ao atendimento depois do cadastro da encomenda, reduzindo mensagens
escritas manualmente e deixando o cliente informado sobre cada etapa.

## Entrega desta fase

- [x] Criar templates de WhatsApp para orçamento, confirmação, produção, pronto, entregue e cancelado.
- [x] Adicionar ação para abrir o WhatsApp já com a mensagem do status atual.
- [x] Validar telefone ausente sem abrir um link inválido.
- [ ] Registrar histórico de mensagens enviadas.
- [ ] Criar lembretes automáticos de entrega e cobrança.

## Validação

- `npm run verify`
- Testar a ação com telefone com e sem DDD.
- Confirmar que a mensagem não inclui dados sensíveis além da encomenda selecionada.

## Rollback

Reverter o commit desta branch. A funcionalidade é aditiva e não altera o modelo de dados.
