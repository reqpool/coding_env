export function getApiKey(req: Request): string | null {
  return req.headers.get("x-api-key");
}

export function validateApiKey(key: string | null): boolean {
  if (!key) return false;
  const keys = (process.env.API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return keys.includes(key);
}

export function unauthorized(msg = "Unauthorized") {
  return Response.json({ error: msg }, { status: 401 });
}

export function badRequest(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}

export function notFound(msg = "Not found") {
  return Response.json({ error: msg }, { status: 404 });
}
