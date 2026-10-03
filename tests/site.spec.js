import { test, expect } from "@playwright/test";
const releaseAPI = "https://api.github.com/repos/masalaempire/OnTimely/releases/latest";
const download = "https://github.com/masalaempire/OnTimely/releases/latest/download/OnTimely.dmg";
test.beforeEach(async ({ page }) => {
  await page.route(releaseAPI, (route) => route.fulfill({ json: {
    tag_name: "v0.1.1", assets: [{ name: "OnTimely.dmg", browser_download_url: "https://github.com/masalaempire/OnTimely/releases/download/v0.1.1/OnTimely.dmg" }]
  } }));
});
test("download, logo, navigation, and responsive layout", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A little less last-minute." })).toBeVisible();
  for (const link of await page.locator("[data-download]").all()) await expect(link).toHaveAttribute("href", download);
  await expect(page.locator("[data-release]").first()).toHaveText("Version 0.1.1");
  expect(await page.locator("img").evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "FAQ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Good questions." })).toBeInViewport();
  expect(errors).toEqual([]);
  await page.goto("/");
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
});
test("preview captures work, snooze, completion, and reset", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Snooze", exact: true }).click();
  await expect(page.locator("[data-task-status]")).toHaveText("Snoozed for 10 minutes.");
  await page.getByRole("button", { name: "I’m Working", exact: true }).click();
  await expect(page.locator("[data-task-status]")).toHaveText("You’re working. One step closer.");
  await page.getByRole("button", { name: "Submitted / Done", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Done" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("[data-completed-essay]")).toBeVisible();
  await expect(page.locator("[data-active-count]")).toHaveText("1");
  await page.getByRole("button", { name: "Reset preview" }).click();
  await expect(page.locator("#example-task")).toBeVisible();
  await expect(page.locator("[data-done-count]")).toHaveText("1");
  await page.getByRole("tab", { name: "Inbox" }).click();
  await expect(page.getByRole("heading", { name: "Read chapter 4" })).toBeVisible();
});
test("keyboard tabs and native FAQ disclosure", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Active" }).focus();
  await page.getByRole("tab", { name: "Active" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Done" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Done" }).press("Home");
  await expect(page.getByRole("tab", { name: "Inbox" })).toHaveAttribute("aria-selected", "true");
  const faq = page.locator(".faq-list details").filter({ hasText: "Does the app need to stay open?" });
  await faq.locator("summary").press("Enter");
  await expect(faq).toHaveAttribute("open", "");
  await expect(faq.locator("p")).toBeVisible();
});
test("downloads still work when GitHub metadata is unavailable", async ({ page }) => {
  await page.route(releaseAPI, (route) => route.fulfill({ status: 403, body: "{}" }));
  await page.goto("/");
  await expect(page.locator("[data-release]").first()).toHaveText("Latest on GitHub");
  await expect(page.locator("[data-download]").first()).toHaveAttribute("href", download);
});
