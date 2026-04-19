import API from "./api";

export const getRoutes = async () => {
  const res = await API.get("/routes");
  return res.data;
};

export const getRouteById = async (id) => {
  const res = await API.get(`/routes/${id}`);
  return res.data;
};
