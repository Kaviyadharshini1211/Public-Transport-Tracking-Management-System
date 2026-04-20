import API from "./api";

export const login = async (credentials) => {
  const res = await API.post("/auth/login", credentials);
  return res.data;
};

export const register = async (userData) => {
  const res = await API.post("/auth/register", userData);
  return res.data;
};

export const updatePhone = async (phoneData) => {
  const res = await API.put("/auth/update-phone", phoneData);
  return res.data;
};

export const getMe = async () => {
  const res = await API.get("/auth/me");
  return res.data;
};

export const getGoogleAuthUrl = () => {
  return `${process.env.REACT_APP_API_URL}/auth/google`;
};
