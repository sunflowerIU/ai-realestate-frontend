export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
export type PageResult<T> = { items: T[]; pagination: Pagination };
export type RecordRow = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

import { getApiErrorMessage } from "./error-message";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshOnce() {
  if (!refreshInFlight)
    refreshInFlight = fetch("/api/session/refresh", { method: "POST" })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  return refreshInFlight;
}

async function request<T>(
  url: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError("Could not connect to the service.", 0);
  }
  if (response.status === 401 && retry) {
    if (await refreshOnce()) return request<T>(url, init, false);
    window.dispatchEvent(new Event("mero-session-expired"));
    throw new ApiError("Your session has expired.", 401);
  }
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body: unknown = await response.json();
      message = getApiErrorMessage(body, message);
    } catch {
      /* Keep fallback. */
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listRecords<T extends RecordRow>(
  resource: string,
  params: Record<string, string | number | undefined> = {},
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return request<PageResult<T>>(`/api/data/${resource}?${query}`);
}

export function getRecord<T extends RecordRow>(resource: string, id: string) {
  return request<T>(`/api/data/${resource}/${id}`);
}
export function writeRecord<T>(
  resource: string,
  method: "POST" | "PATCH",
  payload: unknown,
  id?: string,
) {
  return request<T>(`/api/data/${resource}${id ? `/${id}` : ""}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export function actionRecord(
  resource: string,
  id: string,
  action: string,
  method: "POST" | "DELETE" = "POST",
) {
  return request<unknown>(
    `/api/data/${resource}/${id}${action ? `/${action}` : ""}`,
    { method },
  );
}
