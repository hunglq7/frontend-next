import {
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  getBackendAuthUrl,
  setAuthCookies,
  type AuthTokens,
} from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

interface AuthResponse extends Partial<AuthTokens> {
  message?: string | string[];
}

async function readResponse(response: Response): Promise<AuthResponse> {
  try {
    const value: unknown = await response.json();
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { message: "Phản hồi không hợp lệ từ máy chủ" };
    }

    const payload = value as Record<string, unknown>;
    const message = payload.message;
    return {
      accessToken:
        typeof payload.accessToken === "string" ? payload.accessToken : undefined,
      refreshToken:
        typeof payload.refreshToken === "string" ? payload.refreshToken : undefined,
      message:
        typeof message === "string" ||
        (Array.isArray(message) && message.every((item) => typeof item === "string"))
          ? message
          : undefined,
    };
  } catch {
    return { message: "Không thể đọc phản hồi từ máy chủ" };
  }
}

function hasTokens(value: AuthResponse): value is AuthTokens {
  return Boolean(
    typeof value.accessToken === "string" &&
      value.accessToken.length > 0 &&
      typeof value.refreshToken === "string" &&
      value.refreshToken.length > 0,
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  if (!["login", "refresh", "logout"].includes(action)) {
    return NextResponse.json({ message: "Không tìm thấy API" }, { status: 404 });
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (action === "logout") {
    let backendResponse: Response | undefined;
    let backendUnavailable = false;

    if (refreshToken) {
      try {
        backendResponse = await fetch(getBackendAuthUrl("logout"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });
      } catch {
        backendUnavailable = true;
      }
    }

    const response = NextResponse.json(
      backendUnavailable
        ? { message: "Không thể kết nối đến máy chủ để thu hồi phiên" }
        : backendResponse && !backendResponse.ok
          ? await readResponse(backendResponse)
          : { message: "Đã đăng xuất" },
      {
        status: backendUnavailable
          ? 502
          : backendResponse && !backendResponse.ok
            ? backendResponse.status
            : 200,
      },
    );
    clearAuthCookies(response);
    return response;
  }

  let body: unknown;
  if (action === "login") {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Dữ liệu đăng nhập không hợp lệ" }, { status: 400 });
    }
  } else {
    if (!refreshToken) {
      const response = NextResponse.json(
        { message: "Phiên đăng nhập đã hết hạn" },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }
    body = { refreshToken };
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(getBackendAuthUrl(action), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Không thể kết nối đến máy chủ" },
      { status: 502 },
    );
  }

  const result = await readResponse(backendResponse);
  if (!backendResponse.ok || !hasTokens(result)) {
    const response = NextResponse.json(
      backendResponse.ok
        ? { message: "Phản hồi token không hợp lệ" }
        : result,
      { status: backendResponse.ok ? 502 : backendResponse.status },
    );
    if (
      action === "refresh" &&
      (backendResponse.status === 401 || backendResponse.status === 403)
    ) {
      clearAuthCookies(response);
    }
    return response;
  }

  const response = NextResponse.json({ message: "Đăng nhập thành công" });
  setAuthCookies(response, result);
  return response;
}