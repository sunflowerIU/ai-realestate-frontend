import { test, expect } from "@playwright/test";

test("main request-access path leads to a real contact method", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /the right property is already in your records/i })).toBeVisible();
  await page.getByRole("link", { name: /request access/i }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("button", { name: /prepare email/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /email us directly/i })).toHaveAttribute("href", "mailto:amittamang421@gmail.com");
});

test("mobile navigation exposes the login route", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile navigation check");
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Agent login" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("login requires credentials and never presents public registration", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /sign in to workspace/i }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
  await expect(page.getByRole("link", { name: /request access/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign up|register/i })).toHaveCount(0);
});

test("agent session never receives platform admin navigation", async ({ page, context }) => {
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: "http://127.0.0.1:3101", httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }) }));
  await page.route("**/api/data/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }) }));
  await page.goto("/workspace/clients");
  await expect(page.getByRole("heading", { name: /clients & people/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /manage agents/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add client/i }).first()).toBeVisible();
});

test("archived properties show edit and delete actions", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: new URL(baseURL!).origin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }) }));
  await page.route("**/api/data/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }) }));
  let deleted = false;
  const id = "00000000-0000-4000-8000-000000000001";
  await page.route("**/api/data/properties/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith(`/${id}/delete`)) {
      expect(route.request().method()).toBe("DELETE");
      deleted = true;
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.endsWith("/archived"))
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: deleted ? [] : [{ id, title: "Archived house", status: "ARCHIVED", propertyType: "HOUSE", transactionType: "SALE" }], pagination: { page: 1, pageSize: 20, total: deleted ? 0 : 1, totalPages: deleted ? 0 : 1 } }) });
    return route.continue();
  });
  await page.goto("/workspace/archived");
  await expect(page.getByRole("link", { name: "Archived" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("cell", { name: "Archived house" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "S.N" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Archived house/ }).getByRole("cell").first()).toHaveText("1");
  await page.getByRole("button", { name: "Record actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Delete property" }).click();
  await page.getByPlaceholder("yes").fill("yes");
  await page.getByRole("button", { name: "Delete property" }).click();
  await expect(page.getByText("No archived properties yet.")).toBeVisible();
  expect(deleted).toBe(true);
});

test("workspace theme and sidebar choices persist", async ({ page, context, isMobile }) => {
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: "http://127.0.0.1:3101", httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }) }));
  await page.route("**/api/data/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }) }));
  await page.goto("/workspace");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  if (!isMobile) {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(page.locator(".app-root")).toHaveClass(/sidebar-collapsed/);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  if (!isMobile) await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
});
