import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/health", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"status":"ready"}' }),
  );
  await page.goto("/");
});

test("moves from the explanation to the numbered exercise", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PySpark");
  await expect(page.getByRole("button", { name: "Exercise", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: "Continue to example" }).click();
  await expect(page.getByRole("heading", { name: "Example" })).toBeVisible();

  await page.getByRole("button", { name: "Review key terms" }).click();
  await expect(page.getByRole("heading", { name: "Key terms", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Continue to exercises" }).click();
  await expect(page.getByText(/Lesson 1 exercise/)).toBeVisible();
  await expect(page.getByRole("tab", { name: /Exercise 1/ })).toBeVisible();
  await expect(page.getByLabel("PySpark exercise editor")).toBeVisible();
});

test("saves notebook notes and restores them after reload", async ({ page }) => {
  await page.getByRole("button", { name: "Continue to example" }).click();
  await page.getByRole("button", { name: "Review key terms" }).click();
  await page.getByRole("button", { name: "Continue to exercises" }).click();
  await page.getByRole("button", { name: "Notebook notes" }).click();
  await page.getByLabel("Exercise notebook notes").fill("Input grain: one row per lesson.");
  await page.reload();
  await page.getByRole("button", { name: "Exercise", exact: true }).click();
  await page.getByRole("button", { name: "Notebook notes" }).click();
  await expect(page.getByLabel("Exercise notebook notes")).toHaveValue("Input grain: one row per lesson.");
});
