export const calculateBusinessMetrics = ({
  revenue,
  expenses = 0
}) => {
  const totalRevenue = Number(revenue);
  const totalExpenses = Number(expenses);

  const profit = totalRevenue - totalExpenses;

  const profitMargin =
    totalRevenue > 0
      ? (profit / totalRevenue) * 100
      : 0;

  return {
    revenue: Number(totalRevenue.toFixed(2)),
    expenses: Number(totalExpenses.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    profitMargin: Number(profitMargin.toFixed(2))
  };
};