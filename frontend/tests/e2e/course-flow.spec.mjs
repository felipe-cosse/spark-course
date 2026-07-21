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
  await expect(page.getByText("Notebook notes", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Exercise notebook notes")).toBeVisible();
  await expect(page.getByLabel("PySpark exercise editor")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Spark code" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run code" })).toHaveCount(0);
});

test("saves a written response and restores it after reload", async ({ page }) => {
  await page.getByRole("button", { name: "Continue to example" }).click();
  await page.getByRole("button", { name: "Review key terms" }).click();
  await page.getByRole("button", { name: "Continue to exercises" }).click();
  await page.getByLabel("Exercise notebook notes").fill("Input grain: one row per lesson.");
  await expect(page.getByText("Exercise completed")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Exercise", exact: true }).click();
  await expect(page.getByLabel("Exercise notebook notes")).toHaveValue("Input grain: one row per lesson.");
  await expect(page.getByText("Exercise completed")).toBeVisible();
});

test("reveals a reference solution and automatically completes a written response", async ({ page }) => {
  await page.getByRole("button", { name: "Continue to example" }).click();
  await page.getByRole("button", { name: "Review key terms" }).click();
  await page.getByRole("button", { name: "Continue to exercises" }).click();

  await page.getByRole("button", { name: "Show solution" }).click();
  await expect(page.getByRole("heading", { name: "Reference solution" })).toBeVisible();
  await expect(page.getByText(/distributed execution.*schemas and types/i)).toBeVisible();

  await page.getByLabel("Exercise notebook notes").fill(
    "My dependency map links execution, schemas, DataFrames, joins, and production evidence.",
  );
  await expect(page.getByText("Response saved")).toBeVisible();
  await expect(page.getByText("Exercise completed")).toBeVisible();
});

test("requires recorded evidence before an open-ended exercise can pass", async ({ page }) => {
  await page.getByRole("button", { name: "Continue to example" }).click();
  await page.getByRole("button", { name: "Review key terms" }).click();
  await page.getByRole("button", { name: "Continue to exercises" }).click();

  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Write something in Notebook notes to complete this exercise.")).toBeVisible();

  const checks = page.getByRole("checkbox");
  const checkCount = await checks.count();
  for (let index = 0; index < checkCount; index += 1) await checks.nth(index).check();
  await expect(page.getByRole("button", { name: "Confirm evidence meets criteria" })).toBeDisabled();
  await expect(page.getByText("Exercise completed")).not.toBeVisible();
});

test("switches between Notebook notes and Spark code based on the exercise", async ({ page }) => {
  await page.goto("/#/00-getting-started-02-setup");
  await page.reload();
  await page.getByRole("button", { name: "Continue to example" }).click();
  await page.getByRole("button", { name: "Review key terms" }).click();
  await page.getByRole("button", { name: "Continue to exercises" }).click();

  await expect(page.getByRole("heading", { name: "Capture reproducible environment evidence" })).toBeVisible();
  await expect(page.getByLabel("Exercise notebook notes")).toBeVisible();
  await expect(page.getByLabel("PySpark exercise editor")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Spark code" })).toHaveCount(0);

  await page.getByRole("tab", { name: "Exercise 2" }).click();
  await expect(page.getByRole("heading", { name: "Extend the smoke test" })).toBeVisible();
  await expect(page.getByLabel("PySpark exercise editor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Spark code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Notebook notes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run code" })).toBeVisible();

  await page.getByRole("tab", { name: "Exercise 3" }).click();
  await expect(page.getByRole("heading", { name: "Troubleshooting drill" })).toBeVisible();
  await expect(page.getByLabel("Exercise notebook notes")).toBeVisible();
  await expect(page.getByLabel("PySpark exercise editor")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Spark code" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run code" })).toHaveCount(0);
});

test("skips an exercise and advances to the next unresolved task", async ({ page }) => {
  await page.getByRole("button", { name: "Continue to example" }).click();
  await page.getByRole("button", { name: "Review key terms" }).click();
  await page.getByRole("button", { name: "Continue to exercises" }).click();

  await page.getByRole("button", { name: "Skip exercise" }).click();

  await expect(page.getByRole("tab", { name: "Exercise 2" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Convert objectives into evidence" })).toBeVisible();
});
