import { getAuthApi } from "@/utils/api";

export type PromoAdMediaType = "image" | "video";

export interface PromoAd {
  id: string;
  title: string;
  description: string;
  companyName: string;
  companyLogoUrl: string;
  mediaUrl: string;
  mediaType: PromoAdMediaType;
  durationSeconds?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

async function adminFetch(
  token: string,
  path: string,
  init: RequestInit = {}
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string>),
  };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${getAuthApi()}${path}`, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

async function adminUpload(
  token: string,
  path: string,
  file: Blob,
  filename: string
) {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await fetch(`${getAuthApi()}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
  return json;
}

export async function uploadAdminAdMedia(
  token: string,
  file: Blob,
  filename: string
): Promise<{ url: string; mediaType: PromoAdMediaType }> {
  const json = await adminUpload(token, "/admin/ads/upload/media", file, filename);
  return {
    url: json.url,
    mediaType: (json.mediaType as PromoAdMediaType) || "image",
  };
}

export async function uploadAdminAdLogo(
  token: string,
  file: Blob,
  filename: string
): Promise<{ url: string }> {
  const json = await adminUpload(token, "/admin/ads/upload/logo", file, filename);
  return { url: json.url };
}

export async function fetchAdminAds(token: string): Promise<PromoAd[]> {
  const json = await adminFetch(token, "/admin/ads");
  return json.ads ?? [];
}

export async function createAdminAd(
  token: string,
  data: {
    title: string;
    description?: string;
    companyName: string;
    companyLogoUrl?: string;
    mediaUrl: string;
    mediaType: PromoAdMediaType;
    isActive?: boolean;
    sortOrder?: number;
  }
): Promise<PromoAd> {
  const json = await adminFetch(token, "/admin/ads", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      mediaType: data.mediaType.toUpperCase(),
    }),
  });
  return json.ad;
}

export async function updateAdminAd(
  token: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    companyName: string;
    companyLogoUrl: string;
    mediaUrl: string;
    mediaType: PromoAdMediaType;
    isActive: boolean;
    sortOrder: number;
  }>
): Promise<PromoAd> {
  const payload = { ...data };
  if (payload.mediaType) payload.mediaType = payload.mediaType.toUpperCase() as PromoAdMediaType;
  const json = await adminFetch(token, `/admin/ads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return json.ad;
}

export async function deleteAdminAd(token: string, id: string): Promise<void> {
  await adminFetch(token, `/admin/ads/${id}`, { method: "DELETE" });
}

export async function fetchActiveAds(): Promise<PromoAd[]> {
  const res = await fetch(`${getAuthApi()}/ads/active`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return json.ads ?? [];
}
