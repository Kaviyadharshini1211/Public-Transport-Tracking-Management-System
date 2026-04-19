import API from "./api";

// Users
export const getUsers = async (role) => {
  const res = await API.get(`/users?role=${role || ""}`);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await API.delete(`/users/${id}`);
  return res.data;
};

// Vehicles
export const createVehicle = async (vehicleData) => {
  const res = await API.post("/vehicles", vehicleData);
  return res.data;
};

export const updateVehicle = async (id, vehicleData) => {
  const res = await API.put(`/vehicles/${id}`, vehicleData);
  return res.data;
};

export const deleteVehicle = async (id) => {
  const res = await API.delete(`/vehicles/${id}`);
  return res.data;
};

// Routes
export const createRoute = async (routeData) => {
  const res = await API.post("/routes", routeData);
  return res.data;
};

// Driver Assignment
export const assignDriver = async (data) => {
  const res = await API.post("/vehicles/assign-driver", data);
  return res.data;
};
