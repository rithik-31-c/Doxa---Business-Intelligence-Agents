export const analyzeTrends = (salesData) => {

  if (!salesData || !salesData.length) {
    return {
      message: "No sales data available"
    };
  }


  /*
   * ==========================================
   * 1. SORT DATA BY DATE
   * ==========================================
   */

  const sortedData = [...salesData].sort(
    (a, b) =>
      new Date(a.date) -
      new Date(b.date)
  );


  /*
   * ==========================================
   * 2. SPLIT DATA INTO TWO PERIODS
   * ==========================================
   */

  const midpoint =
    Math.floor(
      sortedData.length / 2
    );


  const firstHalf =
    sortedData.slice(
      0,
      midpoint
    );


  const secondHalf =
    sortedData.slice(
      midpoint
    );


  /*
   * ==========================================
   * 3. CALCULATE REVENUE
   * ==========================================
   */

  const firstHalfRevenue =
    firstHalf.reduce(
      (total, sale) =>
        total +
        Number(sale.revenue || 0),
      0
    );


  const secondHalfRevenue =
    secondHalf.reduce(
      (total, sale) =>
        total +
        Number(sale.revenue || 0),
      0
    );


  /*
   * ==========================================
   * 4. CALCULATE REVENUE CHANGE
   * ==========================================
   */

  const revenueChange =
    firstHalfRevenue > 0
      ? (
          (
            secondHalfRevenue -
            firstHalfRevenue
          ) /
          firstHalfRevenue
        ) *
        100
      : 0;


  /*
   * ==========================================
   * 5. CALCULATE REVENUE DROP
   * ==========================================
   *
   * This is calculated by the backend.
   *
   * Llama does NOT calculate this.
   */

  const revenueDrop =
    Math.max(
      firstHalfRevenue -
      secondHalfRevenue,
      0
    );


  /*
   * ==========================================
   * 6. PRODUCT TRENDS
   * ==========================================
   */

  const productTrends = {};


  sortedData.forEach(
    (sale, index) => {

      const product =
        sale.product;

      const quantity =
        Number(
          sale.quantity || 0
        );


      if (!productTrends[product]) {

        productTrends[product] = {

          product,

          firstHalfQuantity: 0,

          secondHalfQuantity: 0

        };

      }


      if (
        index < midpoint
      ) {

        productTrends[
          product
        ].firstHalfQuantity +=
          quantity;

      } else {

        productTrends[
          product
        ].secondHalfQuantity +=
          quantity;

      }

    }
  );


  /*
   * ==========================================
   * 7. CALCULATE PRODUCT CHANGES
   * ==========================================
   */

  const products =
    Object.values(
      productTrends
    ).map(
      (product) => {

        const change =
          product.firstHalfQuantity > 0
            ? (
                (
                  product.secondHalfQuantity -
                  product.firstHalfQuantity
                ) /
                product.firstHalfQuantity
              ) *
              100
            : 0;


        return {

          ...product,

          percentageChange:
            Number(
              change.toFixed(2)
            )

        };

      }
    );


  /*
   * ==========================================
   * 8. DETERMINE DIRECTION
   * ==========================================
   */

  let direction =
    "stable";


  if (
    revenueChange < 0
  ) {

    direction =
      "decreasing";

  } else if (
    revenueChange > 0
  ) {

    direction =
      "increasing";

  }


  /*
   * ==========================================
   * 9. RETURN DETERMINISTIC EVIDENCE
   * ==========================================
   */

  return {

    firstHalfRevenue:
      Number(
        firstHalfRevenue.toFixed(2)
      ),

    secondHalfRevenue:
      Number(
        secondHalfRevenue.toFixed(2)
      ),

    revenueDrop:
      Number(
        revenueDrop.toFixed(2)
      ),

    revenueChangePercentage:
      Number(
        revenueChange.toFixed(2)
      ),

    direction,

    products

  };

};