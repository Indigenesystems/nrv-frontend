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

export type GuestVerificationStatus =
  | "pending_invite"
  | "in_progress"
  | "verified"
  | "review_required"
  | "unsuccessful"
  | "expired";

export type GuestVerificationRequest = {
  _id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  status: GuestVerificationStatus;
  ninLast4?: string;
  identitySummary?: {
    faceMatch?: boolean;
    faceConfidence?: number;
    livenessPassed?: boolean;
    livenessScore?: number;
    checkMethod?: "live_camera" | "still_selfie";
    providerError?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
    nameMatch?: boolean;
  };
  report?: {
    headline?: string;
    recommendation?: string;
    checks?: Array<{
      label: string;
      result: "passed" | "failed" | "review" | "pending";
      detail?: string;
    }>;
    idName?: string;
    gender?: string;
    dateOfBirth?: string;
    ninLast4?: string;
    providerError?: string;
    consentedAt?: string;
    completedAt?: string;
  };
  consentAt?: string;
  dojahRanAt?: string;
  inviteExpiresAt?: string;
  inviteUrl?: string;
  createdAt?: string;
};

export const createGuestVerification = async (body: {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  sendEmail?: boolean;
}) => {
  const response = await axios.post(`${API_URL}/guest-verifications`, body, {
    headers: authHeader(),
  });
  return response.data;
};

export const fetchGuestVerifications = async () => {
  const response = await axios.get(`${API_URL}/guest-verifications`, {
    headers: authHeader(),
  });
  return response.data?.data as {
    items: GuestVerificationRequest[];
    counts: {
      pending: number;
      in_progress: number;
      verified: number;
      review_required: number;
      unsuccessful: number;
      expired: number;
      total: number;
    };
  };
};

export const fetchGuestVerification = async (id: string) => {
  const response = await axios.get(`${API_URL}/guest-verifications/${id}`, {
    headers: authHeader(),
  });
  return response.data?.data as GuestVerificationRequest;
};

export const resendGuestVerification = async (
  id: string,
  sendEmail = true,
) => {
  const response = await axios.post(
    `${API_URL}/guest-verifications/${id}/resend`,
    { sendEmail },
    { headers: authHeader() },
  );
  return response.data;
};

export const fetchGuestInvite = async (token: string) => {
  const response = await axios.get(
    `${API_URL}/guest-verifications/invite/${encodeURIComponent(token)}`,
  );
  return response.data?.data;
};

export const consentGuestInvite = async (token: string) => {
  const response = await axios.post(
    `${API_URL}/guest-verifications/invite/${encodeURIComponent(token)}/consent`,
    {},
  );
  return response.data?.data;
};

export const completeGuestInvite = async (
  token: string,
  body: {
    nin: string;
    selfieImageBase64?: string;
    usedWidget?: boolean;
    widgetReferenceId?: string;
  },
) => {
  const response = await axios.post(
    `${API_URL}/guest-verifications/invite/${encodeURIComponent(token)}/complete`,
    body,
  );
  return response.data?.data;
};
