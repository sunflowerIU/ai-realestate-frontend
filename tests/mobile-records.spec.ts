import { expect, test } from "@playwright/test";

test("client records expose details and edit on phones", async ({ page, context, baseURL, isMobile }) => {
  test.skip(!isMobile, "Mobile layout check");
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: new URL(baseURL!).origin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }) }));
  await page.route("**/api/data/clients**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [{ id: "client-1", name: "Asha Tamang", phone: "9812345678", alternatePhone: "9800000000", email: "asha@example.com", address: "Boudha, Kathmandu", notes: "Looking for a quiet home", status: "ACTIVE" }], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) }));
  await page.goto("/workspace/clients");
  const card = page.getByRole("article").filter({ hasText: "Asha Tamang" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("9800000000");
  await expect(card).toContainText("Looking for a quiet home");
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeHidden();
  await card.getByRole("button", { name: "Edit client" }).click();
  await expect(page.getByRole("dialog", { name: "Edit client" })).toBeVisible();
});

test("agent management uses cards with a working manage action on phones", async ({ page, context, baseURL, isMobile }) => {
  test.skip(!isMobile, "Mobile layout check");
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: new URL(baseURL!).origin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "admin-test", name: "Admin", email: "admin@example.com", role: "PLATFORM_ADMIN", status: "ACTIVE" } }) }));
  await page.route("**/api/data/admin-agents**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [{ id: "agent-1", name: "Maya Tamang", email: "maya@example.com", status: "ACTIVE", createdAt: "2026-10-20T04:00:00.000Z" }], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) }));
  await page.goto("/admin/agents");
  const card = page.getByRole("article").filter({ hasText: "Maya Tamang" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("maya@example.com");
  await expect(page.getByRole("columnheader", { name: "Agent" })).toBeHidden();
  await card.getByRole("button", { name: "Manage agent" }).click();
  await expect(page.getByRole("dialog", { name: "Maya Tamang" })).toBeVisible();
});
