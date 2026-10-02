import { Order, OrderStatus } from '../types';

export const ACTIVE_FUNNEL_STATUSES: OrderStatus[] = [
  'orcamento',
  'confirmado',
  'produzindo',
  'pronto',
  'entregue',
];

export interface FunnelStageSummary {
  status: OrderStatus;
  orders: Order[];
  count: number;
  totalValue: number;
}

export interface SalesFunnelSummary {
  stages: FunnelStageSummary[];
  canceled: FunnelStageSummary;
}

const summarizeStage = (status: OrderStatus, orders: Order[]): FunnelStageSummary => ({
  status,
  orders,
  count: orders.length,
  totalValue: orders.reduce((sum, order) => sum + order.totalCharged, 0),
});

export const getSalesFunnelSummary = (orders: Order[]): SalesFunnelSummary => {
  const byStatus = new Map<OrderStatus, Order[]>();
  orders.forEach((order) => {
    const current = byStatus.get(order.status) || [];
    current.push(order);
    byStatus.set(order.status, current);
  });

  return {
    stages: ACTIVE_FUNNEL_STATUSES.map((status) =>
      summarizeStage(status, byStatus.get(status) || []),
    ),
    canceled: summarizeStage('cancelado', byStatus.get('cancelado') || []),
  };
};
