export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  user?: AuthenticatedUser;
}

export function getClientIp(request: RequestLike): string {
  const cloudflareIp = request.headers['cf-connecting-ip'];
  if (typeof cloudflareIp === 'string' && cloudflareIp.trim()) return cloudflareIp.trim();

  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return request.ip || 'unknown';
}

export function readCookie(request: RequestLike, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (typeof cookieHeader !== 'string') return undefined;

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }

  return undefined;
}
