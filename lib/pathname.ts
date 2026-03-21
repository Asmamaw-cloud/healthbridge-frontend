/**
 * Normalize pathname for stable route checks (strip query + trailing slashes).
 */
export function normalizePathname(pathname: string) {
  return pathname.split('?')[0].replace(/\/+$/, '') || '/';
}

/** True when pathname is .../messages (any role), e.g. /patient/messages */
export function isMessagesPath(pathname: string) {
  return normalizePathname(pathname).endsWith('/messages');
}

/** True when pathname is .../notifications */
export function isNotificationsPath(pathname: string) {
  return normalizePathname(pathname).endsWith('/notifications');
}
