import { test, expect } from "@playwright/test";
const releaseAPI = "https://api.github.com/repos/masalaempire/OnTimely/releases/latest";
const download = "https://github.com/masalaempire/OnTimely/releases/latest/download/OnTimely.dmg";
test.beforeEach(async ({ page }) => {
  await page.route(releaseAPI, (route) => route.fulfill({ json: {
    tag_name: "v0.1.1", assets: [{ name: "OnTimely.dmg", browser_download_url: "https://github.com/masalaempire/OnTimely/releases/download/v0.1.1/OnTimely.dmg" }]
  } }));
});
test("download, logo, navigation, and responsive layout", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A little less last-minute." })).toBeVisible();
  for (const link of await page.locator("[data-download]").all()) await expect(link).toHaveAttribute("href", download);
  await expect(page.locator("[data-release]").first()).toHaveText("Version 0.1.1");
  await page.locator(".reminders-section").scrollIntoViewIfNeeded();
  await page.locator(".notes-section").scrollIntoViewIfNeeded();
  await page.locator(".download-section").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "FAQ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Good questions." })).toBeInViewport();
  expect(errors).toEqual([]);
});
test("screenshot carousel supports arrows, wraparound, and direct selection", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "OnTimely screenshots" });
  const status = carousel.getByRole("status");
  await expect(status).toHaveText("Screenshot 1 of 7");
  await expect(carousel.locator('[data-slide]:not([aria-hidden="true"]) img')).toHaveAttribute("src", "./assets/screenshots/inbox.png");
  await carousel.getByRole("button", { name: "Previous screenshot" }).click();
  await expect(status).toHaveText("Screenshot 7 of 7");
  await expect(carousel.getByRole("img")).toHaveAttribute("src", "./assets/screenshots/notes.png");
  await carousel.getByRole("button", { name: "Next screenshot" }).click();
  await expect(status).toHaveText("Screenshot 1 of 7");
  await carousel.getByRole("button", { name: "Next screenshot" }).click();
  await expect(status).toHaveText("Screenshot 2 of 7");
  await expect(carousel.getByRole("img")).toHaveAttribute("src", "./assets/screenshots/estimate.png");
  await carousel.getByRole("button", { name: "Show screenshot 3: Review your plan" }).click();
  await expect(status).toHaveText("Screenshot 3 of 7");
  await expect(carousel.getByRole("img")).toHaveAttribute("src", "./assets/screenshots/review-plan.png");
  await expect(carousel.getByRole("img")).toBeInViewport();
  await expect(carousel.locator('[aria-current="true"]')).toHaveCount(1);
  await expect(page.getByRole("tab")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("keyboard navigation and the complete how-to FAQ", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "OnTimely screenshots" });
  const status = carousel.getByRole("status");
  await carousel.focus();
  await carousel.press("ArrowRight");
  await expect(status).toHaveText("Screenshot 2 of 7");
  await carousel.press("ArrowLeft");
  await expect(status).toHaveText("Screenshot 1 of 7");
  await carousel.press("End");
  await expect(status).toHaveText("Screenshot 7 of 7");
  await carousel.press("Home");
  await expect(status).toHaveText("Screenshot 1 of 7");
  const faq = page.locator(".faq-list details").filter({ has: page.locator("summary", { hasText: "How to use" }) });
  await faq.locator("summary").focus();
  await faq.locator("summary").press("Enter");
  await expect(faq).toHaveAttribute("open", "");
  await expect(faq.locator("li")).toHaveCount(5);
  await expect(faq).toContainText("Use current settings");
  await expect(faq).toContainText("⌘N");
  await expect(faq).toContainText("Activate reminders");
  await expect(faq).toContainText("I’m Working");
  await expect(faq).toContainText("Submitted / Done");
  await expect(faq).toContainText("Reopen in Inbox");
  await expect(faq).toContainText("You can close its window and leave the app open.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("repeated reminders feature shows both native notification screenshots", async ({ page }) => {
  await page.goto("/");
  const section = page.locator(".reminders-section");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole("heading")).toHaveText("Reminders thatkeep coming back.");
  await expect(section).toContainText("keeps pinging you with macOS notifications");
  await expect(section).toContainText("Choose how often reminders repeat");
  await expect(section.getByRole("img")).toHaveCount(2);
  await expect.poll(() => section.locator("img").evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth === 740))).toBe(true);
});
test("mobile carousel supports horizontal touch swipes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Touch navigation is checked on mobile.");
  await page.goto("/");
  const viewport = page.locator("[data-carousel-viewport]");
  await viewport.scrollIntoViewIfNeeded();
  const box = await viewport.boundingBox();
  const session = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  const from = box.x + box.width * 0.8;
  const to = box.x + box.width * 0.2;
  const swipe = async (start, end) => {
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: end, y }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await swipe(from, to);
  await expect(page.locator("[data-carousel-status]")).toHaveText("Screenshot 2 of 7");
  await swipe(to, from);
  await expect(page.locator("[data-carousel-status]")).toHaveText("Screenshot 1 of 7");
  await session.detach();
});
test("downloads still work when GitHub metadata is unavailable", async ({ page }) => {
  await page.route(releaseAPI, (route) => route.fulfill({ status: 403, body: "{}" }));
  await page.goto("/");
  await expect(page.locator("[data-release]").first()).toHaveText("Latest on GitHub");
  await expect(page.locator("[data-download]").first()).toHaveAttribute("href", download);
});

test("Cloudflare serves a styled custom 404 for nested paths", async ({ page }) => {
  const response = await page.goto("/missing/page");
  expect(response.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page wandered off." })).toBeVisible();
  expect(await page.locator("img").evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.getByRole("link", { name: "Back to the homepage" })).toHaveAttribute("href", "/");
});

test("Calendar and Notes sections show the new product screenshots", async ({ page }) => {
  await page.goto("/");
  const calendar = page.locator(".calendar-section");
  await calendar.scrollIntoViewIfNeeded();
  await expect(calendar.getByRole("heading")).toHaveText("Your plans,one day at a time.");
  await expect(calendar.getByRole("img")).toHaveCount(2);
  await expect(calendar.locator("img").nth(0)).toHaveAttribute("src", "./assets/screenshots/calendar-month.png");
  await expect(calendar.locator("img").nth(1)).toHaveAttribute("src", "./assets/screenshots/calendar-day.png");
  await expect.poll(() => calendar.locator("img").evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0))).toBe(true);
  const notes = page.locator(".notes-section");
  await notes.scrollIntoViewIfNeeded();
  await expect(notes.getByRole("heading")).toHaveText("A little spacefor your thoughts.");
  await expect(notes.getByRole("img")).toHaveAttribute("src", "./assets/screenshots/notes.png");
  await expect.poll(() => notes.locator("img").evaluate((img) => img.complete && img.naturalWidth === 2718)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("carousel advances every four seconds and wraps while focused or hovered", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-04T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-04T00:01:00Z"));
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "OnTimely screenshots" });
  const status = carousel.getByRole("status");
  await page.clock.runFor(3999);
  await expect(status).toHaveText("Screenshot 1 of 7");
  await page.clock.runFor(1);
  await expect(status).toHaveText("Screenshot 2 of 7");
  await carousel.getByRole("button", { name: "Show screenshot 7: Notes" }).click();
  await page.clock.runFor(4000);
  await expect(status).toHaveText("Screenshot 1 of 7");
  await expect(status).toHaveAttribute("aria-live", "off");
});

test("each arrow press pauses automatic movement for ten seconds before resuming", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-04T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-04T00:01:00Z"));
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "OnTimely screenshots" });
  const status = carousel.getByRole("status");
  const next = carousel.getByRole("button", { name: "Next screenshot" });
  await next.click();
  await expect(status).toHaveText("Screenshot 2 of 7");
  await page.clock.runFor(9999);
  await expect(status).toHaveText("Screenshot 2 of 7");
  await next.click();
  await expect(status).toHaveText("Screenshot 3 of 7");
  await page.clock.runFor(9999);
  await expect(status).toHaveText("Screenshot 3 of 7");
  await page.clock.runFor(1);
  await expect(status).toHaveText("Screenshot 4 of 7");
  await page.clock.runFor(4000);
  await expect(status).toHaveText("Screenshot 5 of 7");
  await carousel.getByRole("button", { name: "Previous screenshot" }).click();
  await expect(status).toHaveText("Screenshot 4 of 7");
  await page.clock.runFor(9999);
  await expect(status).toHaveText("Screenshot 4 of 7");
  await page.clock.runFor(1);
  await expect(status).toHaveText("Screenshot 5 of 7");
  await carousel.press("ArrowLeft");
  await expect(status).toHaveText("Screenshot 4 of 7");
  await page.clock.runFor(9999);
  await expect(status).toHaveText("Screenshot 4 of 7");
  await page.clock.runFor(1);
  await expect(status).toHaveText("Screenshot 5 of 7");
});
