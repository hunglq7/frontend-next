import type { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function getBackendBaseUrl() {
  return (process.env.BACKEND_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function getBackendAuthUrl(endpoint: string) {
  return `${getBackendBaseUrl()}/auth/${endpoint}`;
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Number(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE) || 15 * 60,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Number(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE) || 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}