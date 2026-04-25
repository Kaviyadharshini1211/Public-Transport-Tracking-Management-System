import API from "./api";

export const sendChatMessage = async (payload) => {
  const res = await API.post("/chatbot", payload);
  return res.data;
};

