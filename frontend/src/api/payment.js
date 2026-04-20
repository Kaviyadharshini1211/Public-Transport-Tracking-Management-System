import API from "./api";

export const createOrder = async (orderData) => {
  const res = await API.post("/payments/create-order", orderData);
  return res.data;
};

export const verifyPayment = async (verifyData) => {
  const res = await API.post("/payments/verify", verifyData);
  return res.data;
};
