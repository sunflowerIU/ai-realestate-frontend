import { expect, test } from "@playwright/test";

const clientId = "00000000-0000-4000-8000-000000000001";

async function mockWorkspace(page: import("@playwright/test").Page, baseURL: string) {
  await page.context().addCookies([
    { name: "ma_access", value: "test-only-cookie", url: new URL(baseURL).origin, httpOnly: true, sameSite: "Strict" },
  ]);
  await page.route("**/api/session/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }),
    }),
  );
  await page.route("**/api/data/**", (route) => {
    if (route.request().method() === "POST")
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "new-record" }) });
    const isClients = new URL(route.request().url()).pathname.endsWith("/clients");
    const items = isClients ? [{ id: clientId, name: "Maya Tamang", phone: "9812345678", email: "maya@example.com" }] : [];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items, pagination: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } }) });
  });
}

test("property accepts a typed owner and sends clientName", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.goto("/workspace/properties");
  await page.getByRole("button", { name: "Add property" }).first().click();
  await page.getByLabel("Listing title").fill("Hill house");
  await page.getByLabel("Property type").selectOption("HOUSE");
  await page.getByLabel("For").selectOption("SALE");
  await page.getByRole("button", { name: "Add property" }).last().click();
  await expect(page.getByText("Select a saved client or enter an owner / seller name.")).toBeVisible();
  await page.getByLabel("Owner / seller name").fill("Local owner");
  const request = page.waitForRequest((request) => request.url().endsWith("/api/data/properties") && request.method() === "POST");
  await page.getByRole("button", { name: "Add property" }).last().click();
  expect((await request).postDataJSON()).toMatchObject({ title: "Hill house", clientName: "Local owner", ownerClientId: null });
});

test("buyer requirement keeps contact details and a saved client link", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.goto("/workspace/requirements");
  await page.getByRole("button", { name: "Add requirement" }).first().click();
  await page.getByLabel("Saved buyer client").fill("Maya");
  await page.getByRole("option", { name: "Maya Tamang" }).click();
  await expect(page.getByLabel("Buyer name")).toHaveValue("Maya Tamang");
  await expect(page.getByLabel("Buyer phone number")).toHaveValue("9812345678");
  await page.getByLabel("For").selectOption("SALE");
  await page.getByLabel("Property type").selectOption("LAND");
  const request = page.waitForRequest((request) => request.url().endsWith("/api/data/requirements") && request.method() === "POST");
  await page.getByRole("button", { name: "Add requirement" }).last().click();
  expect((await request).postDataJSON()).toMatchObject({
    clientId,
    buyerName: "Maya Tamang",
    buyerEmail: "maya@example.com",
    buyerPhoneNo: "9812345678",
  });
});

test("visit uses the same searchable reference input", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.goto("/workspace/visits");
  await page.getByRole("button", { name: "Add visit" }).first().click();
  const client = page.getByLabel("Client", { exact: true });
  await client.fill("Maya");
  await expect(page.getByRole("option", { name: "Maya Tamang" })).toBeVisible();
  await client.press("ArrowDown");
  await client.press("Enter");
  await expect(client).toHaveValue("Maya Tamang");
  await client.fill("Unknown client");
  await client.blur();
  await expect(client).toHaveValue("");
});

test("buyer requirement accepts contact details without a saved client", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.goto("/workspace/requirements");
  await page.getByRole("button", { name: "Add requirement" }).first().click();
  await page.getByLabel("For").selectOption("RENT");
  await page.getByLabel("Property type").selectOption("APARTMENT");
  await page.getByRole("button", { name: "Add requirement" }).last().click();
  await expect(page.getByText("Buyer name is required.")).toBeVisible();
  await expect(page.getByText("Buyer phone number is required.")).toBeVisible();
  await page.getByLabel("Buyer name").fill("New buyer");
  await page.getByLabel("Buyer phone number").fill("+977 1 555 1234");
  const request = page.waitForRequest((request) => request.url().endsWith("/api/data/requirements") && request.method() === "POST");
  await page.getByRole("button", { name: "Add requirement" }).last().click();
  expect((await request).postDataJSON()).toMatchObject({
    clientId: null,
    buyerName: "New buyer",
    buyerPhoneNo: "+977 1 555 1234",
  });
});
