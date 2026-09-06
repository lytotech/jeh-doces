# Período unificado do dashboard

## Objetivo

Eliminar os dois seletores independentes do dashboard e oferecer um único período para a visão geral, evitando que entregas e relatórios aparentem estar em janelas diferentes.

## Escopo

- Um único estado de período no `DashboardView`.
- O mesmo seletor atualiza encomendas, indicadores, despesas, exportações e relatório operacional.
- `Mês atual` usa o mês corrente para entregas e relatórios.
- `30 dias` e `90 dias` usam entregas futuras e dados financeiros dos últimos dias correspondentes, sem sugerir duas janelas independentes na interface.
- `Todo o histórico` mantém todos os registros ativos e o histórico financeiro.

## Validação

- TypeScript e build do frontend.
- Verificação visual para confirmar a remoção do segundo seletor.
