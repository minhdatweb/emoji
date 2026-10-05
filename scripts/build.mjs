// Đọc dữ liệu emoji chuẩn Unicode + tên tiếng Việt (CLDR) → xuất trang tĩnh vào dist/
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const groups = require("unicode-emoji-json/data-by-group.json");
const viBase = JSON.parse(readFileSync("data/vi-annotations.json", "utf8")).annotations.annotations;
const viDerived = JSON.parse(readFileSync("data/vi-derived.json", "utf8")).annotationsDerived.annotations;

const GROUP_VI = {
  // [tên đầy đủ (tiêu đề nhóm), tên ngắn (thanh nhóm, để 9 mục vừa 1 dòng), icon]
  smileys_emotion: ["Mặt cười & Cảm xúc", "Cảm xúc", "😀"],
  people_body: ["Con người & Cơ thể", "Con người", "👋"],
  animals_nature: ["Động vật & Thiên nhiên", "Động vật", "🐻"],
  food_drink: ["Đồ ăn & Đồ uống", "Đồ ăn", "🍜"],
  travel_places: ["Du lịch & Địa điểm", "Du lịch", "✈️"],
  activities: ["Hoạt động", "Hoạt động", "⚽"],
  objects: ["Đồ vật", "Đồ vật", "💡"],
  symbols: ["Biểu tượng", "Biểu tượng", "💛"],
  flags: ["Cờ", "Cờ", "🏁"],
};
const TONES = ["🏻", "🏼", "🏽", "🏾", "🏿"];

const stripVS = (s) => s.replace(/️/g, "");
const lookup = (e) => viBase[e] || viBase[stripVS(e)] || viDerived[e] || viDerived[stripVS(e)];
const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Ghép màu da: chèn modifier sau ký tự đầu, chỉ giữ biến thể có trong CLDR (tức là hợp lệ)
function toneVariants(emoji) {
  const [first, ...rest] = [...stripVS(emoji)];
  const tail = rest.join("");
  const out = TONES.map((t) => first + t + tail);
  return out.every((v) => viDerived[v] || viBase[v]) ? out : null;
}

let total = 0;
let missingVi = 0;
const sections = [];
const nav = [];

for (const g of groups) {
  const meta = GROUP_VI[g.slug];
  if (!meta) continue; // bỏ nhóm "component" (ký tự ghép, không dùng độc lập)
  const [label, short, icon] = meta;
  const items = g.emojis.map((e) => {
    const vi = lookup(e.emoji);
    if (!vi) missingVi++;
    const name = vi?.tts?.[0] || e.name;
    const keys = normalize([name, ...(vi?.default || []), e.name].join(" "));
    const tones = e.skin_tone_support ? toneVariants(e.emoji) : null;
    total++;
    return `<button class="e" data-k="${esc(keys)}"${tones ? ` data-t="${tones.join(",")}"` : ""} title="${esc(name)}" aria-label="${esc(name)}">${e.emoji}</button>`;
  });
  nav.push(`<a href="#${g.slug}" class="chip" data-g="${g.slug}"><span>${icon}</span>${short}</a>`);
  sections.push(
    `<section id="${g.slug}" class="group"><h2>${label} <span class="count">${items.length}</span></h2><div class="grid">${items.join("")}</div></section>`
  );
}

const html = readFileSync("src/index.html", "utf8")
  .replace("{{NAV}}", nav.join(""))
  .replace("{{SECTIONS}}", sections.join("\n"))
  .replaceAll("{{TOTAL}}", total.toLocaleString("vi-VN"));

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
writeFileSync("dist/index.html", html);
for (const f of ["base.css", "style.css", "app.js", "favicon.svg", "logo.svg"]) copyFileSync(`src/${f}`, `dist/${f}`);

console.log(`✓ ${total} emoji, ${nav.length} nhóm → dist/ (thiếu tên tiếng Việt: ${missingVi})`);
