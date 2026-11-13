import axios from "axios";
import { API_URL } from "@/config/constant";

const authHeader = () => {
  try {
    const stored = localStorage.getItem("nrv-user");
    const token = stored ? JSON.parse(stored)?.accessToken : undefined;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const createShortStayRoom = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/shortlets/rooms`, formData, {
    headers: authHeader(),
  });
  return response.data;
};

export const fetchOwnerShortStayListings = async () => {
  const response = await axios.get(`${API_URL}/shortlets/listings`, {
    headers: authHeader(),
  });
  return response.data?.data || [];
};

export const fetchShortStayRooms = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const response = await axios.get(`${API_URL}/shortlets/rooms`, {
    params: { limit: 24, ...params },
  });
  return response.data;
};

export const fetchShortStayRoom = async (id: string) => {
  const response = await axios.get(`${API_URL}/shortlets/rooms/${id}`);
  return response.data?.data;
};

export const fetchShortStayAvailability = async (
  id: string,
  from?: string,
  to?: string,
) => {
  const response = await axios.get(
    `${API_URL}/shortlets/rooms/${id}/availability`,
    { params: { from, to } },
  );
  return response.data?.data;
};

export const createShortStayBooking = async (body: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestNin?: string;
  firstName?: string;
  lastName?: string;
}) => {
  const response = await axios.post(`${API_URL}/shortlets/bookings`, body, {
    headers: authHeader(),
  });
  return response.data;
};

export const fetchMyShortStayBookings = async (role: "owner" | "booker") => {
  const response = await axios.get(`${API_URL}/shortlets/bookings`, {
    params: { role },
    headers: authHeader(),
  });
  return response.data?.data || [];
};

export const fetchShortStayBooking = async (id: string) => {
  const response = await axios.get(`${API_URL}/shortlets/bookings/${id}`, {
    headers: authHeader(),
  });
  return response.data?.data;
};

export const acceptShortStayBooking = async (id: string) => {
  const response = await axios.post(
    `${API_URL}/shortlets/bookings/${id}/accept`,
    {},
    { headers: authHeader() },
  );
  return response.data;
};

export const declineShortStayBooking = async (id: string) => {
  const response = await axios.post(
    `${API_URL}/shortlets/bookings/${id}/decline`,
    {},
    { headers: authHeader() },
  );
  return response.data;
};

export const runShortStayIdentityCheck = async (id: string) => {
  const response = await axios.post(
    `${API_URL}/shortlets/bookings/${id}/identity-check`,
    {},
    { headers: authHeader() },
  );
  return response.data;
};

export const fetchShortStayPayBooking = async (
  id: string,
  token: string,
) => {
  const response = await axios.get(`${API_URL}/shortlets/bookings/pay/${id}`, {
    params: { token },
  });
  return response.data?.data;
};

export const payShortStayBooking = async (
  bookingId: string,
  guestPayToken?: string,
) => {
  const response = await axios.post(
    `${API_URL}/payments/initialize-shortlet`,
    { bookingId, guestPayToken },
    { headers: authHeader() },
  );
  return response.data;
};

export const verifyShortStayPayment = async (reference: string) => {
  const response = await axios.post(`${API_URL}/payments/verify/${reference}`);
  return response.data;
};
