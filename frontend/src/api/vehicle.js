import API from "./api";

export const getVehicles = async () => {
  const res = await API.get("/vehicles");
  return res.data;
};

export const getVehicleById = async (id) => {
  const res = await API.get(`/vehicles/${id}`);
  return res.data;
};

export const getVehiclesByRoute = async (routeId) => {
  const res = await API.get(`/vehicles/by-route/${routeId}`);
  return res.data;
};
