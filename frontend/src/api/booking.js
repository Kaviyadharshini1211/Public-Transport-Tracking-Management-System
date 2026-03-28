import API from "./api";

export const toggleAlerts = async (bookingId) => {
  const res = await API.put(`/bookings/${bookingId}/toggle-alerts`);
  return res.data;
};
