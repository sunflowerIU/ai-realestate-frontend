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
  const payload = (await request).postDataJSON();
  expect(payload).toMatchObject({ title: "Hill house", status: "ACTIVE", clientName: "Local owner", ownerClientId: null });
  expect(payload).not.toHaveProperty("latitude");
  expect(payload).not.toHaveProperty("longitude");
});

test("saved owner fills the name and land omits building fields", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.goto("/workspace/properties");
  await page.getByRole("button", { name: "Add property" }).first().click();
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue("ACTIVE");
  await expect(page.getByLabel("Status", { exact: true }).getByRole("option", { name: "Draft" })).toHaveCount(0);
  await page.getByLabel("Listing title").fill("Land plot");
  await page.getByLabel("For").selectOption("SALE");
  await page.getByLabel("Property type").selectOption("HOUSE");
  await page.getByLabel("Built-up area (m²)").fill("125");
  await page.getByLabel("Bedrooms").fill("3");
  await page.getByLabel("Bathrooms").fill("2");
  await page.getByLabel("Facing").selectOption("EAST");
  await page.getByLabel("Owner / seller name").fill("Previous owner");
  await page.getByLabel("Saved owner / seller").fill("Maya");
  await page.getByRole("option", { name: "Maya Tamang" }).click();
  await expect(page.getByLabel("Owner / seller name")).toHaveValue("Maya Tamang");
  await page.getByLabel("Property type").selectOption("LAND");
  for (const field of ["Built-up area (m²)", "Bedrooms", "Bathrooms", "Facing"])
    await expect(page.getByLabel(field)).toHaveCount(0);
  await expect(page.getByLabel("Add map location (optional)")).toBeVisible();
  expect(await page.getByLabel("Add map location (optional)").evaluate((map) => {
    const description = document.getElementById("field-description");
    return description !== null && Boolean(description.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  const request = page.waitForRequest((item) => item.url().endsWith("/api/data/properties") && item.method() === "POST");
  await page.getByRole("button", { name: "Add property" }).last().click();
  const payload = (await request).postDataJSON();
  expect(payload).toMatchObject({ propertyType: "LAND", status: "ACTIVE", ownerClientId: clientId, clientName: "Maya Tamang" });
  for (const field of ["builtUpAreaSqM", "bedrooms", "bathrooms", "facing"])
    expect(payload).not.toHaveProperty(field);
});

test("property map loads on request and saves a selected location", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.route("https://*.tile.openstreetmap.org/**", (route) => route.abort());
  await page.goto("/workspace/properties");
  await page.getByRole("button", { name: "Add property" }).first().click();
  await expect(page.getByLabel("Add map location (optional)")).toBeVisible();
  await expect(page.getByLabel("Latitude", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Longitude", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Choose property location on map")).toHaveCount(0);
  await page.getByLabel("Listing title").fill("Mapped house");
  await page.getByLabel("Property type").selectOption("HOUSE");
  await page.getByLabel("For").selectOption("SALE");
  await page.getByLabel("Owner / seller name").fill("Local owner");
  await page.getByLabel("Add map location (optional)").check();
  const map = page.getByLabel("Choose property location on map");
  await expect(map).toBeVisible();
  await expect(page.getByText("No location selected yet.")).toBeVisible();
  await map.click({ position: { x: 150, y: 120 } });
  await expect(page.getByText(/Selected: 27\./)).toBeVisible();
  const request = page.waitForRequest((item) => item.url().endsWith("/api/data/properties") && item.method() === "POST");
  await page.getByRole("button", { name: "Add property" }).last().click();
  const payload = (await request).postDataJSON();
  expect(Number(payload.latitude)).toBeGreaterThan(27);
  expect(Number(payload.longitude)).toBeGreaterThan(85);
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

test("buyer requirement sends structured preferred areas with multiple localities", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.goto("/workspace/requirements");
  await page.getByRole("button", { name: "Add requirement" }).first().click();
  await page.getByLabel("Buyer name").fill("New buyer");
  await page.getByLabel("Buyer email").fill("buyer@example.com");
  await page.getByLabel("Buyer phone number").fill("9812345678");
  await page.getByLabel("For").selectOption("SALE");
  await page.getByLabel("Property type").selectOption("LAND");

  await page.getByRole("button", { name: "Add preferred area" }).click();
  const first = page.getByText("Preferred area 1").locator("..");
  const firstArea = first.locator("..");
  await firstArea.getByLabel("Province").selectOption("Bagmati");
  await firstArea.getByLabel("District").selectOption("Kathmandu");
  await firstArea.getByLabel("Municipality / metropolitan city").selectOption("Kathmandu Metropolitan City");
  await firstArea.getByLabel("Localities").fill("Baneshwor, Maitidevi");

  await page.getByRole("button", { name: "Add preferred area" }).click();
  const second = page.getByText("Preferred area 2").locator("..").locator("..");
  await second.getByLabel("Province").selectOption("Bagmati");
  await second.getByLabel("District").selectOption("Makwanpur");
  await second.getByLabel("Municipality / metropolitan city").selectOption("Hetauda Sub-Metropolitan City");
  await second.getByLabel("Localities").fill("Shantinagar");

  const request = page.waitForRequest((request) => request.url().endsWith("/api/data/requirements") && request.method() === "POST");
  await page.getByRole("button", { name: "Add requirement" }).last().click();
  expect((await request).postDataJSON().preferredLocations).toEqual([
    { province: "Bagmati", district: "Kathmandu", municipality: "Kathmandu Metropolitan City", localities: ["Baneshwor", "Maitidevi"] },
    { province: "Bagmati", district: "Makwanpur", municipality: "Hetauda Sub-Metropolitan City", localities: ["Shantinagar"] },
  ]);
});

test("buyer requirement restores preferred areas when editing", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.route("**/api/data/requirements?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      items: [{
        id: "requirement-1",
        title: "Land for buyer",
        buyerName: "New buyer",
        buyerEmail: "buyer@example.com",
        buyerPhoneNo: "9812345678",
        transactionType: "SALE",
        propertyType: "LAND",
        preferredLocations: [{
          id: "area-1",
          province: "Bagmati",
          district: "Makwanpur",
          municipality: "Hetauda Sub-Metropolitan City",
          localities: ["Shantinagar"],
        }],
      }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
  }));
  await page.goto("/workspace/requirements");
  await page.getByRole("button", { name: "Record actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const area = page.getByText("Preferred area 1").locator("..").locator("..");
  await expect(area.getByLabel("District")).toHaveValue("Makwanpur");
  await expect(area.getByLabel("Localities")).toHaveValue("Shantinagar");
  await area.getByLabel("Localities").fill("Shantinagar, Huprachaur");
  const request = page.waitForRequest((request) => request.url().endsWith("/api/data/requirements/requirement-1") && request.method() === "PATCH");
  await page.getByRole("button", { name: "Save changes" }).click();
  expect((await request).postDataJSON().preferredLocations).toEqual([{
    province: "Bagmati",
    district: "Makwanpur",
    municipality: "Hetauda Sub-Metropolitan City",
    localities: ["Shantinagar", "Huprachaur"],
  }]);
});

test("requirement search sends the selected search field", async ({ page, baseURL }) => {
  await mockWorkspace(page, baseURL!);
  await page.goto("/workspace/requirements");
  await page.getByRole("combobox", { name: "Search by" }).selectOption("location");
  const locationRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/api/data/requirements" && url.searchParams.get("search") === "Shanti" && url.searchParams.get("searchBy") === "location";
  });
  await page.getByPlaceholder("Search province, district, municipality, or locality…").fill("Shanti");
  await locationRequest;
  const clientRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/api/data/requirements" && url.searchParams.get("search") === "Shanti" && url.searchParams.get("searchBy") === "client";
  });
  await page.getByRole("combobox", { name: "Search by" }).selectOption("client");
  await clientRequest;
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
