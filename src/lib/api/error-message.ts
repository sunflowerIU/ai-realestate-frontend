function messageFrom(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const messages = value.map(messageFrom).filter((item): item is string => Boolean(item));
    return messages.length ? messages.join(" ") : undefined;
  }
  if (value && typeof value === "object") {
    const details = value as Record<string, unknown>;
    return messageFrom(details.message) || messageFrom(details.error);
  }
  return undefined;
}

export function getApiErrorMessage(body: unknown, fallback = "Something went wrong. Please try again.") {
  return messageFrom(body) || fallback;
}
