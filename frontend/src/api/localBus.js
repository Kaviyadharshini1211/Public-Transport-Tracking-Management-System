import API from "./api";

export const getLocalRoutes = async () => {
  const res = await API.get("/local-buses/routes");
  return res.data;
};

export const getLiveBuses = async (routeId) => {
  const res = await API.get(`/local-buses/live?routeId=${routeId}`);
  return res.data;
};

export const getStopETA = async (routeId, stopIndex) => {
  const res = await API.get(`/local-buses/eta/${routeId}/${stopIndex}`);
  return res.data;
};
