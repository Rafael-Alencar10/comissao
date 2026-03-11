import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isLocalhost = req.hostname === "localhost" || req.hostname === "127.0.0.1" || req.hostname === "::1";
  const isSecure = isSecureRequest(req);

  // In development (localhost), allow cookies without secure flag
  // In production, always use secure and sameSite: none for cross-origin
  return {
    httpOnly: true,
    path: "/",
    sameSite: isLocalhost ? "lax" : "none",
    secure: isLocalhost ? false : isSecure,
  };
}
