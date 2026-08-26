import type { Page, Request, Route } from "@playwright/test";

type MockResponse = {
  body?: unknown;
  headers?: Record<string, string>;
  status?: number;
};

export type ApiMockContext = {
  request: Request;
  route: Route;
  method: string;
  path: string;
};

export type ApiMockHandler = (
  context: ApiMockContext,
) => MockResponse | Promise<MockResponse>;

export type ApiMockHandlers = Record<string, ApiMockHandler>;

function routeKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export async function installApiMock(
  page: Page,
  handlers: ApiMockHandlers,
): Promise<void> {
  await page.route("**/__e2e_api/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method().toUpperCase();
    const path = url.pathname.replace(/^\/__e2e_api/, "");
    const handler = handlers[routeKey(method, path)];

    if (!handler) {
      await route.fulfill({
        status: 501,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({
          message: `E2E sem mock para ${method} ${path}`,
        }),
      });
      return;
    }

    const response = await handler({ request, route, method, path });
    const status = response.status ?? 200;

    if (status === 204) {
      await route.fulfill({ status, headers: response.headers });
      return;
    }

    await route.fulfill({
      status,
      headers: {
        "Cache-Control": "no-store",
        ...response.headers,
      },
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(response.body ?? {}),
    });
  });
}
