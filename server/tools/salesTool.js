export const analyzeSales = (salesData) => {
  let totalRevenue = 0;
  let totalQuantity = 0;

  const productMap = {};

  for (const sale of salesData) {
    const product = sale.product;
    const quantity = Number(sale.quantity);
    const revenue = Number(sale.revenue);

    totalRevenue += revenue;
    totalQuantity += quantity;

    if (!productMap[product]) {
      productMap[product] = {
        product,
        quantity: 0,
        revenue: 0,
        orders: 0
      };
    }

    productMap[product].quantity += quantity;
    productMap[product].revenue += revenue;
    productMap[product].orders += 1;
  }

  const totalOrders = salesData.length;

  const averageOrderValue =
    totalOrders > 0
      ? totalRevenue / totalOrders
      : 0;

  const products = Object.values(productMap).map((product) => ({
    ...product,
    revenue: Number(product.revenue.toFixed(2))
  }));

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalQuantity,
    totalOrders,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    products
  };
};