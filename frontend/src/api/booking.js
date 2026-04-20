import API from "./api";

export const toggleAlerts = async (bookingId) => {
  const res = await API.put(`/bookings/${bookingId}/toggle-alerts`);
  return res.data;
};

export const getUserBookings = async (userId) => {
  const res = await API.get(`/bookings/user/${userId}`);
  return res.data;
};

export const checkActiveBooking = async (userId, vehicleId) => {
  const res = await API.get(`/bookings/check-active/${userId}/${vehicleId}`);
  return res.data;
};

export const getBookingsByVehicle = async (vehicleId, date) => {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const res = await API.get(`/bookings/vehicle/${vehicleId}${query}`);
  return res.data;
};
