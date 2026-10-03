export const analyzeInventory = (inventoryData) => {
  const products = [];

  for (const item of inventoryData) {
    const currentStock = Number(item.currentStock);
    const reorderLevel = Number(item.reorderLevel);
    const unitCost = Number(item.unitCost);

    products.push({
      product: item.product,
      currentStock,
      reorderLevel,
      unitCost,
      belowReorderLevel: currentStock < reorderLevel
    });
  }

  const lowStockProducts = products.filter(
    (product) => product.belowReorderLevel
  );

  return {
    products,
    lowStockProducts,
    lowStockCount: lowStockProducts.length
  };
};