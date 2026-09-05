# Controle financeiro e livro-caixa

- Status: `In progress`
- Branch: `feat/financial-control`
- Versão: `1.0.48`

## Objetivo

Registrar despesas da confeitaria e combinar esses lançamentos com vendas, pagamentos recebidos,
valores a receber e lucro estimado em um resumo financeiro por período.

## Critérios de aceite

- [x] Despesas pertencem a uma única empresa e respeitam o contexto autenticado.
- [x] Usuário pode criar, listar, editar e excluir despesas.
- [x] API valida descrição, valor, data e intervalo do relatório.
- [x] Resumo retorna vendas, recebido, a receber, despesas e caixa líquido.
- [x] Painel permite lançar e excluir despesas e exibe o resumo do mês.
- [ ] Validar persistência e isolamento entre duas empresas em ambiente de integração.

## Testes

- [x] Testes de validação de despesas e período.
- [x] Build da API e frontend.
- [ ] Teste E2E de lançamento e resumo financeiro.
- [ ] Validar deploy e migration em produção.
