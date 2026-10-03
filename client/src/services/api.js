const API_URL = "http://localhost:5000";

export const investigateShop = async (question) => {
  const response = await fetch(
    `${API_URL}/api/shop/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to investigate the shop");
  }

  const data = await response.json();

  return data;
};


export const uploadShopCsv = async (file) => {
  const formData = new FormData();

  formData.append("file", file);


  const response = await fetch(
    "http://localhost:5000/api/shop/upload",
    {
      method: "POST",
      body: formData
    }
  );


  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.message ||
      "Failed to upload CSV"
    );
  }


  return await response.json();
};
