import { ACCESS_TOKEN_COOKIE, getBackendBaseUrl } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function proxyBackendRequest(request: NextRequest, path: string[]) {
  if (path.length === 0 || path.some((segment) => segment === "." || segment === "..")) {
    return NextResponse.json({ message: "Đường dẫn API không hợp lệ" }, { status: 400 });
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    const backendUrl = `${getBackendBaseUrl()}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const upstream = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    const contentDisposition = upstream.headers.get("content-disposition");
    if (upstreamContentType) responseHeaders.set("Content-Type", upstreamContentType);
    if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition);

    const emptyBodyStatus = [204, 205, 304].includes(upstream.status);
    const responseBody = emptyBodyStatus ? null : await upstream.arrayBuffer();
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Không thể kết nối đến backend. Hãy kiểm tra BACKEND_URL." },
      { status: 502 },
    );
  }
}