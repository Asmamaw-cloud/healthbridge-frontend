/** Parse consultation UUID from backend notification text, e.g. "(ID: <uuid>)". */
export function parseConsultationIdFromNotificationMessage(
  message: string,
): string | null {
  const m = message.match(/\(ID:\s*([0-9a-f-]{36})\)/i);
  return m?.[1] ?? null;
}
