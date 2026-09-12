import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "esp32_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.SESSION_SECRET || "change-this-session-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function makeSession(username: string) {
  const timestamp = Date.now().toString();
  const payload = `${username}.${timestamp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(value: string | undefined) {
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [username, timestamp, signature] = parts;
  const payload = `${username}.${timestamp}`;

  if (username !== (process.env.AUTH_USERNAME || "admin")) return false;

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE * 1000) return false;

  const expected = sign(payload);

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function isAuthenticated() {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAME)?.value);
}

export async function setSession(username: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, makeSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/"
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}
