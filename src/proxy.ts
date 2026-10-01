import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  getBackendAuthUrl,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  type AuthTokens,
} from "./lib/auth";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

async function verifyAccessToken(accessToken: string) {
  try {
    const response = await fetch(getBackendAuthUrl("me"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const response = await fetch(getBackendAuthUrl("refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const result = (await response.json()) as Partial<AuthTokens>;
    if (!result.accessToken || !result.refreshToken) return null;
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);
  const pathname = request.nextUrl.pathname;
  const isHome = pathname === "/";
  const isSignIn = pathname === "/signin";

  if (!isHome && !isSignIn) return response;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && (await verifyAccessToken(accessToken))) {
    return isSignIn
      ? NextResponse.redirect(new URL("/", request.url))
      : response;
  }

  if (refreshToken) {
    const tokens = await refreshTokens(refreshToken);
    if (tokens) {
      setAuthCookies(response, tokens);
      return isSignIn
        ? NextResponse.redirect(new URL("/", request.url))
        : response;
    }
  }

  clearAuthCookies(response);
  return isHome
    ? NextResponse.redirect(new URL("/signin", request.url))
    : response;
}

export const config = {
  matcher: ["/((?!api/|_next|_vercel|.*\\..*).*)"],
};
