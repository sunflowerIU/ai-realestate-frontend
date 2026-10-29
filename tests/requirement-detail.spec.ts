import { expect, test } from "@playwright/test";

test("buyer requirement opens a complete detail page from the list", async ({ page, context, baseURL }) => {
  const id = "00000000-0000-4000-8000-000000000041";
  const requirement = {
    id,
    title: "Family home near Boudha",
    buyerName: "Asha Tamang",
    buyerEmail: "asha@example.com",
    buyerPhoneNo: "9812345678",
    propertyType: "HOUSE",
    transactionType: "SALE",
    status: "ACTIVE",
    minBudgetNpr: "18000000",
    maxBudgetNpr: "25000000",
    minLandAreaSqMm: "120000000",
    minBedrooms: 3,
    minRoadAccessMeters: "4.50",
    preferredLocations: [{ id: "place-1", province: "Bagmati", district: "Kathmandu", municipality: "Kathmandu", localities: ["Boudha", "Jorpati"] }],
    notes: "Quiet street, close to school.",
    createdAt: "2026-10-20T04:00:00.000Z",
    updatedAt: "2026-10-25T04:00:00.000Z",
  };
  await context.addCookies([{ name: "ma_access", value: "test-only-cookie", url: new URL(baseURL!).origin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/api/session/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "agent-test", name: "Test Agent", email: "agent@example.com", role: "AGENT", status: "ACTIVE" } }) }));
  await page.route("**/api/data/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === `/api/data/requirements/${id}`)
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(requirement) });
    if (path === "/api/data/requirements")
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [requirement], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }) });
  });

  await page.goto("/workspace/requirements");
  await page.getByRole("button", { name: "Record actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "View details" })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/workspace\/requirements$/);
  await page.keyboard.press("Escape");
  await page.getByRole("row", { name: /Family home near Boudha/ }).click();
  await expect(page).toHaveURL(new RegExp(`/workspace/requirements/${id}$`));
  await expect(page.getByRole("heading", { name: "Family home near Boudha." })).toBeVisible();
  await expect(page.getByText("Asha Tamang").first()).toBeVisible();
  await expect(page.getByText("Boudha", { exact: true })).toBeVisible();
  await expect(page.getByText("NPR 1,80,00,000")).toBeVisible();
  await expect(page.getByText("NPR 2,50,00,000")).toBeVisible();
  await expect(page.getByText("Quiet street, close to school.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit requirement" })).toBeVisible();
});
