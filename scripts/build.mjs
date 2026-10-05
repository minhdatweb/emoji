// Xuất trang tĩnh vào dist/: mỗi trang = 1 bộ dữ liệu chia nhóm, dùng chung khung src/index.html
//   /        Emoji: dữ liệu chuẩn Unicode + tên tiếng Việt (CLDR)
//   /ki-tu/     Kí tự đặc biệt: data/ki-tu.mjs
//   /chu-kieu/  Tạo chữ kiểu: chạy trên trình duyệt (src/chu-kieu.js)
//   /kaomoji/   Kaomoji: data/kaomoji.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import kiTu from "../data/ki-tu.mjs";
import kaomoji from "../data/kaomoji.mjs";

const require = createRequire(import.meta.url);
const SITE = "https://emoji.minhdat.me";

const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Các trang (thứ tự = thứ tự tab trên header)
const PAGES = [
  { path: "/", tab: "Emoji", build: buildEmoji },
  { path: "/ki-tu/", tab: "Kí tự", build: buildKiTu },
  { path: "/chu-kieu/", tab: "Chữ kiểu", build: buildChuKieu },
  { path: "/kaomoji/", tab: "Kaomoji", build: buildKaomoji },
];

// ---------- Emoji ----------
function buildEmoji() {
  const groups = require("unicode-emoji-json/data-by-group.json");
  const viBase = JSON.parse(readFileSync("data/vi-annotations.json", "utf8")).annotations.annotations;
  const viDerived = JSON.parse(readFileSync("data/vi-derived.json", "utf8")).annotationsDerived.annotations;
  const GROUP_VI = {
    // [tên đầy đủ (tiêu đề nhóm), tên ngắn (thanh nhóm, để các mục vừa 1 dòng), icon]
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

  // Ghép màu da: chèn modifier sau ký tự đầu, chỉ giữ biến thể có trong CLDR (tức là hợp lệ)
  function toneVariants(emoji) {
    const [first, ...rest] = [...stripVS(emoji)];
    const out = TONES.map((t) => first + t + rest.join(""));
    return out.every((v) => viDerived[v] || viBase[v]) ? out : null;
  }

  let missingVi = 0;
  const out = groups
    .filter((g) => GROUP_VI[g.slug]) // bỏ nhóm "component" (ký tự ghép, không dùng độc lập)
    .map((g) => ({
      slug: g.slug,
      meta: GROUP_VI[g.slug],
      items: g.emojis.map((e) => {
        const vi = lookup(e.emoji);
        if (!vi) missingVi++;
        const name = vi?.tts?.[0] || e.name;
        return {
          char: e.emoji,
          name,
          keys: [name, ...(vi?.default || []), e.name].join(" "),
          tones: e.skin_tone_support ? toneVariants(e.emoji) : null,
        };
      }),
    }));
  if (missingVi) console.warn(`  ! ${missingVi} emoji thiếu tên tiếng Việt`);

  const total = out.reduce((n, g) => n + g.items.length, 0).toLocaleString("vi-VN");
  return {
    groups: out,
    tones: true,
    title: `Kho Emoji — Bấm là copy ${total} emoji`,
    desc: `Kho ${total} emoji chuẩn Unicode, tên tiếng Việt, tìm nhanh, bấm một lần là copy. Đủ 9 nhóm: cảm xúc, con người, động vật, đồ ăn, du lịch, hoạt động, đồ vật, biểu tượng, cờ.`,
    placeholder: "Tìm emoji…",
  };
}

// Dữ liệu dạng [slug, meta, từ khoá nhóm, "kí tự<sep>tên\n…"] → nhóm
function parseList(data, sep, fix = (c) => c) {
  return data.map(([slug, meta, groupKeys, list]) => ({
    slug,
    meta,
    items: list
      .trim()
      .split("\n")
      .map((line) => {
        const i = line.indexOf(sep);
        const char = i < 0 ? line : line.slice(0, i);
        const name = i < 0 ? meta[0] : line.slice(i + 1).trim();
        return { char: fix(char), name, keys: `${name} ${meta[0]} ${groupKeys}` };
      }),
  }));
}

// ---------- Kí tự đặc biệt ----------
function buildKiTu() {
  // Kí tự vừa là chữ vừa là emoji (↗ ✡ ❤ ☀…): thêm U+FE0E để luôn hiện dạng chữ đơn sắc, cả khi dán sang nơi khác
  const emojiKeys = new Set(Object.keys(require("unicode-emoji-json/data-by-emoji.json")));
  const asText = (c) => ([...c].length === 1 && emojiKeys.has(c + "️") ? c + "︎" : c);
  const groups = parseList(kiTu, " ", asText);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return {
    groups,
    tones: false,
    title: `Kí tự đặc biệt — Bấm là copy ${total}+ kí tự`,
    desc: `Kí tự đặc biệt đẹp để đặt tên Facebook, TikTok, game: ngôi sao ★, trái tim ♡, mũi tên ➜, khung tên ꧁꧂, số ①, đường kẻ. Bấm một lần là copy.`,
    placeholder: "Tìm kí tự…",
  };
}

// ---------- Kaomoji ----------
function buildKaomoji() {
  const groups = parseList(kaomoji, "\t");
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return {
    groups,
    title: `Kaomoji — ${total}+ mặt cười kí tự (◕‿◕) bấm là copy`,
    desc: "Kaomoji mặt cười bằng kí tự Nhật: vui (＾▽＾), yêu (♡˙︶˙♡), buồn (╥﹏╥), lật bàn (╯°□°）╯︵ ┻━┻, nhún vai ¯\\_(ツ)_/¯. Bấm một lần là copy.",
    placeholder: "Tìm kaomoji, vd: vui, ôm, lật bàn…",
  };
}

// ---------- Chữ kiểu (tạo trên trình duyệt) ----------
function buildChuKieu() {
  return {
    groups: [],
    main: `<section class="gen">
    <label class="gen-input-box">
      <input id="gen-input" type="text" placeholder="Minh Đạt" autocomplete="off" aria-label="Nhập chữ cần đổi kiểu">
    </label>
    <div id="gen-frames" class="gen-frames" aria-label="Khung trang trí"></div>
    <div id="gen-list" class="gen-list"></div>
    <p class="gen-note">Chữ có dấu tiếng Việt hiển thị tuỳ máy và ứng dụng: một số kiểu có thể lệch dấu. Chữ đ/Đ không có bản kiểu nên giữ nguyên.</p>
  </section>`,
    script: "/chu-kieu.js",
    title: "Chữ kiểu — Tạo tên kí tự đặc biệt đẹp cho Facebook, TikTok, game",
    desc: "Gõ tên, chọn kiểu chữ đậm, viết tay, gothic, nét đôi, khoanh tròn, khung ꧁ ꧂ để đặt tên Facebook, TikTok, Free Fire, Liên Quân. Bấm là copy.",
    placeholder: "",
  };
}

// ---------- Ghép trang ----------
const template = readFileSync("src/index.html", "utf8");
const tonesHtml = template.match(/<!--TONES-->([\s\S]*?)<!--\/TONES-->/)[0];

function render(page, data) {
  const nav = [];
  const sections = data.groups.map(({ slug, meta: [label, short, icon], items }) => {
    nav.push(`<a href="#${slug}" class="chip" data-g="${slug}"><span>${icon}</span>${short}</a>`);
    const buttons = items.map(
      (it) =>
        `<button class="e" data-k="${esc(normalize(it.keys))}"${it.tones ? ` data-t="${it.tones.join(",")}"` : ""} title="${esc(it.name)}" aria-label="${esc(it.name)}">${esc(it.char)}</button>`
    );
    return `<section id="${slug}" class="group"><h2>${label} <span class="count">${items.length}</span></h2><div class="grid">${buttons.join("")}</div></section>`;
  });
  const tabs = PAGES.map(
    (p) => `<a href="${p.path}"${p === page ? ' class="on" aria-current="page"' : ""}>${p.tab}</a>`
  ).join("");

  return template
    .replace(tonesHtml, data.tones ? tonesHtml : "")
    .replace("{{SCRIPT}}", data.script ? `<script src="${data.script}"></script>` : "")
    .replaceAll("{{TITLE}}", esc(data.title))
    .replaceAll("{{DESC}}", esc(data.desc))
    .replaceAll("{{CANONICAL}}", SITE + page.path)
    .replace("{{PLACEHOLDER}}", data.placeholder)
    .replace("{{PAGE}}", page.path === "/" ? "emoji" : page.path.replaceAll("/", ""))
    .replace("{{TABS}}", tabs)
    .replace("{{NAV}}", nav.join(""))
    .replace("{{SECTIONS}}", data.main || sections.join("\n"));
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const page of PAGES) {
  const data = page.build();
  const dir = "dist" + page.path;
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + "index.html", render(page, data));
  const count = data.groups.reduce((n, g) => n + g.items.length, 0);
  console.log(`✓ ${page.path.padEnd(11)} ${data.main ? "trang tạo chữ" : `${count} mục, ${data.groups.length} nhóm`}`);
}
for (const f of ["base.css", "style.css", "app.js", "chu-kieu.js", "favicon.svg", "logo.svg", "og-image.png"]) copyFileSync(`src/${f}`, `dist/${f}`);
