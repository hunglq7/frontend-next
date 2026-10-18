import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  getBackendAuthUrl,
  getBackendBaseUrl,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  type AuthTokens,
} from "./lib/auth";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);
const publicAuthPaths = new Set(["/signin", "/signup"]);

type TokenCheck = "valid" | "invalid" | "unavailable";

function getCanonicalPathname(pathname: string) {
  const segments = pathname.split("/");
  const firstSegment = segments[1];
  if (routing.locales.some((locale) => locale === firstSegment)) {
    return `/${segments.slice(2).join("/")}`;
  }
  return pathname;
}

function redirectToSignIn(request: NextRequest, clearCookies: boolean) {
  const response = NextResponse.redirect(new URL("/signin", request.url));
  if (clearCookies) clearAuthCookies(response);
  return response;
}

async function verifyAccessToken(accessToken: string): Promise<TokenCheck> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (response.ok) return "valid";
    return response.status === 401 || response.status === 403
      ? "invalid"
      : "unavailable";
  } catch {
    return "unavailable";
  }
}

type RefreshResult =
  | { status: "success"; tokens: AuthTokens }
  | { status: "invalid" | "unavailable" };

async function refreshTokens(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await fetch(getBackendAuthUrl("refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        status:
          response.status === 401 || response.status === 403
            ? "invalid"
            : "unavailable",
      };
    }

    const result = (await response.json()) as Partial<AuthTokens>;
    if (
      typeof result.accessToken !== "string" ||
      !result.accessToken ||
      typeof result.refreshToken !== "string" ||
      !result.refreshToken
    ) {
      return { status: "unavailable" };
    }
    return {
      status: "success",
      tokens: { accessToken: result.accessToken, refreshToken: result.refreshToken },
    };
  } catch {
    return { status: "unavailable" };
  }
}

export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);
  const pathname = getCanonicalPathname(request.nextUrl.pathname);
  const isPublicAuthPage = publicAuthPaths.has(pathname);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return isPublicAuthPage ? response : redirectToSignIn(request, false);
  }

  const accessCheck = accessToken
    ? await verifyAccessToken(accessToken)
    : "invalid";

  if (accessCheck === "unavailable" && !refreshToken) {
    return isPublicAuthPage ? response : redirectToSignIn(request, false);
  }

  if (accessCheck === "valid") {
    return isPublicAuthPage
      ? NextResponse.redirect(new URL("/", request.url))
      : response;
  }

  if (refreshToken) {
    const refreshResult = await refreshTokens(refreshToken);
    if (refreshResult.status === "success") {
      if (isPublicAuthPage) {
        const redirect = NextResponse.redirect(new URL("/", request.url));
        setAuthCookies(redirect, refreshResult.tokens);
        return redirect;
      }
      setAuthCookies(response, refreshResult.tokens);
      return response;
    }
    if (refreshResult.status === "unavailable") {
      return isPublicAuthPage ? response : redirectToSignIn(request, false);
    }
  }

  if (isPublicAuthPage) {
    clearAuthCookies(response);
    return response;
  }
  return redirectToSignIn(request, true);
}

export const config = {
  matcher: ["/((?!api/|_next|_vercel|.*\\..*).*)"],
};
