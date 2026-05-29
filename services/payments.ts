import { API_BASE } from "@/utils/api";

export interface BankTransferDetails {
  accountNumber: string;
  bankName: string;
  amount: number;
  currency?: string;
  txRef?: string;
  reference?: string | null;
  note?: string | null;
  expiresAt?: string | null;
}

export interface InitiateBankTransferResponse {
  txRef: string;
  chargeId?: string;
  status: string;
  bankDetails: BankTransferDetails;
  productName?: string;
  amount: number;
}

async function authedFetch(path: string, token: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string>),
  };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export async function initiateBankTransfer(
  token: string,
  multiplier: 2 | 3,
  quantity = 1
): Promise<InitiateBankTransferResponse> {
  const res = await authedFetch("/api/payments/initiate-bank-transfer", token, {
    method: "POST",
    body: JSON.stringify({ multiplier, quantity }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json.details ||
      json.error ||
      `initiateBankTransfer failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

export interface VerifyPaymentResponse {
  status: "PENDING" | "SUCCESS" | "FAILED";
  payment: { id: string; txRef: string; multiplier: number; quantity: number; status: string };
}

export async function verifyPayment(
  token: string,
  txRef: string
): Promise<VerifyPaymentResponse> {
  const res = await authedFetch(`/api/payments/verify/${encodeURIComponent(txRef)}`, token);
  if (!res.ok) throw new Error(`verifyPayment failed (${res.status})`);
  return res.json();
}

export async function fetchBoostBalance(token: string) {
  const res = await authedFetch("/api/payments/boosts", token);
  if (!res.ok) throw new Error("Failed to fetch boosts");
  return res.json();
}
