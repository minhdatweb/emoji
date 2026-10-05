// Chụp tools/og-image.html thành src/og-image.png (ảnh xem trước khi gửi link) bằng Chrome/Edge chạy ẩn
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const browsers = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
const browser = browsers.find(existsSync);
if (!browser) throw new Error("Không tìm thấy Chrome hoặc Edge");

execFileSync(browser, [
  "--headless=new",
  "--hide-scrollbars",
  "--window-size=1200,630",
  `--screenshot=${resolve("src/og-image.png")}`,
  pathToFileURL(resolve("tools/og-image.html")).href,
], { stdio: "inherit" });
