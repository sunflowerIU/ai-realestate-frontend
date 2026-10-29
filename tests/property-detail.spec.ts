import { expect, test } from "@playwright/test";

test("property row opens a detailed listing and archives it", async ({ page, context, baseURL }) => {
  const id = "00000000-0000-4000-8000-000000000052";
  const ownerId = "00000000-0000-4000-8000-000000000053";
  let archived = false;
  const property = {
    id,
    title: "Sunlit home in Lazimpat",
    code: "KTM-052",
    propertyType: "HOUSE",
    transactionType: "SALE",
    ownerClientId: ownerId,
    province: "3",
    district: "Kathmandu",
    municipality: "Kathmandu",
    locality: "Lazimpat",
    priceNpr: "35000000",
    landAreaValue: "5",
    landAreaUnit: "AANA",
    builtUpAreaSqMm: "220000000",
    bedrooms: 4,
    bathrooms: 3,
    roadAccessMeters: "6.00",
    facing: "EAST",
    description: "Bright living spaces and a quiet garden.",
    remarks: "Owner prefers afternoon calls.",
    createdAt: "2026-10-20T04:00:00.000Z",
    updatedAt: "2026-10-25T04:00:00.000Z",
  };
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: new URL(baseURL!).origin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }) }));
  await page.route("**/api/data/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === `/api/data/properties/${id}/archive`) {
      expect(route.request().method()).toBe("POST");
      archived = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...property, status: "ARCHIVED" }) });
    }
    if (path === `/api/data/properties/${id}`)
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...property, status: archived ? "ARCHIVED" : "ACTIVE" }) });
    if (path === `/api/data/clients/${ownerId}`)
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: ownerId, name: "Mina Shrestha", phone: "9812345678" }) });
    if (path === "/api/data/properties")
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: archived ? [] : [{ ...property, status: "ACTIVE" }], pagination: { page: 1, pageSize: 20, total: archived ? 0 : 1, totalPages: archived ? 0 : 1 } }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }) });
  });

  await page.goto("/workspace/properties");
  await page.getByRole("button", { name: "Record actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/workspace\/properties$/);
  await page.keyboard.press("Escape");
  await page.getByRole("row", { name: /Sunlit home in Lazimpat/ }).click();
  await expect(page).toHaveURL(new RegExp(`/workspace/properties/${id}$`));
  await expect(page.getByRole("heading", { name: "Sunlit home in Lazimpat." })).toBeVisible();
  await expect(page.getByText("NPR 3,50,00,000")).toBeVisible();
  await expect(page.getByText("5 Aana")).toBeVisible();
  await expect(page.getByText("Mina Shrestha")).toBeVisible();
  await expect(page.getByText("Bright living spaces and a quiet garden.")).toBeVisible();
  await expect(page.getByLabel("Property location map")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View in Google Maps" })).toHaveCount(0);
  await page.getByRole("button", { name: "Archive property" }).click();
  await page.getByRole("button", { name: "Archive property" }).last().click();
  await expect(page.getByRole("button", { name: "Delete property" })).toBeVisible();
  expect(archived).toBe(true);
});

test("property coordinates show a map and a Google Maps link", async ({ page, context, baseURL }) => {
  const id = "00000000-0000-4000-8000-000000000054";
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: new URL(baseURL!).origin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }) }));
  await page.route("**/api/data/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id, title: "Mapped home", propertyType: "HOUSE", transactionType: "SALE", status: "ACTIVE", latitude: "27.7172", longitude: "85.3240", createdAt: "2026-10-20T04:00:00.000Z", updatedAt: "2026-10-25T04:00:00.000Z" }) }));
  await page.goto(`/workspace/properties/${id}`);
  await expect(page.getByLabel("Property location map")).toBeVisible();
  await expect(page.getByRole("link", { name: "View in Google Maps" })).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=27.7172%2C85.324");
});
