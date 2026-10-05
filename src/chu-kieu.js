{ // khối riêng: tránh trùng tên biến với app.js
// Tạo chữ kiểu: đổi chữ thường sang các bộ chữ Unicode (𝐁𝐨𝐥𝐝, 𝓢𝓬𝓻𝓲𝓹𝓽, 𝕯𝖔𝖚𝖇𝖑𝖊…).
// Tiếng Việt: tách dấu (NFD) → đổi chữ gốc → giữ dấu phía sau. Hiển thị dấu tuỳ font của máy.

// Bộ chữ dựa trên khối Mathematical Alphanumeric: [mã A hoa, mã a thường, mã số 0, ngoại lệ]
const MATH = [
  ["Đậm", 0x1d400, 0x1d41a, 0x1d7ce],
  ["Nghiêng", 0x1d434, 0x1d44e, null, { h: "ℎ" }],
  ["Đậm nghiêng", 0x1d468, 0x1d482, 0x1d7ce],
  ["Viết tay", 0x1d49c, 0x1d4b6, null, { B: "ℬ", E: "ℰ", F: "ℱ", H: "ℋ", I: "ℐ", L: "ℒ", M: "ℳ", R: "ℛ", e: "ℯ", g: "ℊ", o: "ℴ" }],
  ["Viết tay đậm", 0x1d4d0, 0x1d4ea, 0x1d7ce],
  ["Gothic", 0x1d504, 0x1d51e, null, { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ", Z: "ℨ" }],
  ["Gothic đậm", 0x1d56c, 0x1d586, 0x1d7ce],
  ["Nét đôi", 0x1d538, 0x1d552, 0x1d7d8, { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" }],
  ["Không chân", 0x1d5a0, 0x1d5ba, 0x1d7e2],
  ["Không chân đậm", 0x1d5d4, 0x1d5ee, 0x1d7ec],
  ["Không chân nghiêng", 0x1d608, 0x1d622, null],
  ["Không chân đậm nghiêng", 0x1d63c, 0x1d656, 0x1d7ec],
  ["Máy đánh chữ", 0x1d670, 0x1d68a, 0x1d7f6],
];

const range = (A, a, zero, ex = {}) => (c) => {
  if (ex[c]) return ex[c];
  const code = c.charCodeAt(0);
  if (c >= "A" && c <= "Z") return String.fromCodePoint(A + code - 65);
  if (c >= "a" && c <= "z") return String.fromCodePoint(a + code - 97);
  if (zero && c >= "0" && c <= "9") return String.fromCodePoint(zero + code - 48);
  return c;
};
const table = (from, to) => {
  const t = [...to];
  return (c) => {
    const i = from.indexOf(c);
    return i < 0 ? c : t[i];
  };
};
const ABC = "abcdefghijklmnopqrstuvwxyz";

const STYLES = [
  ...MATH.map(([name, A, a, zero, ex]) => ({ name, map: range(A, a, zero, ex) })),
  { name: "Khoanh tròn", map: range(0x24b6, 0x24d0, null, { 0: "⓪", ...Object.fromEntries([..."123456789"].map((d, i) => [d, String.fromCodePoint(0x2460 + i)])) }) },
  { name: "Tròn đen", map: (c) => range(0x1f150, 0x1f150)(c.toUpperCase()) },
  { name: "Ô vuông", map: (c) => range(0x1f130, 0x1f130)(c.toUpperCase()) },
  { name: "Ô vuông đen", map: (c) => range(0x1f170, 0x1f170)(c.toUpperCase()) },
  { name: "Chữ rộng", map: range(0xff21, 0xff41, 0xff10) },
  { name: "Chữ hoa nhỏ", map: (c) => table(ABC, "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ")(c.toLowerCase()) },
  { name: "Chữ nhỏ trên", map: table(ABC + ABC.toUpperCase(), "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᵠʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵠᴿˢᵀᵁⱽᵂˣʸᶻ") },
  { name: "Lộn ngược", map: table(ABC + ABC.toUpperCase(), "ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz∀ꓭƆꓷƎℲ⅁HIſꓘ˥WNOԀΌꓤS⊥∩ΛMX⅄Z"), reverse: true },
  { name: "Gạch ngang", mark: "̶" },
  { name: "Gạch dưới", mark: "̲" },
  { name: "Gạch chéo", mark: "̸" },
  { name: "Gạch dưới kép", mark: "̳" },
];

// Khung trang trí đặt quanh chữ
const FRAMES = [
  ["Khung game", "꧁", "꧂"], ["Sao", "★彡 ", " 彡★"], ["Ngoặc vuông", "【", "】"], ["Ngoặc góc", "『", "』"],
  ["Lấp lánh", "✧･ﾟ: ", " :ﾟ･✧"], ["Tim", "♡ ", " ♡"], ["Hoa", "✿ ", " ✿"], ["Mũi tên", "➳ ", ""],
  ["Sóng", "~ ", " ~"], ["Đường kẻ", "━━ ", " ━━"], ["Ngầu", "▄︻デ ", " ═━一"], ["Vương miện", "♛ ", " ♛"],
];

function convert(style, text) {
  if (style.mark) return [...text].map((c) => (c === " " ? c : c + style.mark)).join("");
  // Tách dấu tiếng Việt: "ạ" → "a" + dấu chấm dưới; đ/Đ không có bản kiểu nên giữ nguyên
  let out = [...text.normalize("NFD")].map((c) => (/[̀-ͯ]/.test(c) ? c : style.map(c))).join("");
  if (style.reverse) out = (out.match(/.[̀-ͯ]*/gsu) || []).reverse().join(""); // đảo theo cụm chữ + dấu
  return out;
}

const input = document.querySelector("#gen-input");
const list = document.querySelector("#gen-list");
const framesBox = document.querySelector("#gen-frames");
const frameSel = { i: -1 };

const row = (name, value) =>
  `<button class="e gen-row" data-copy="${value.replace(/"/g, "&quot;")}" title="${name}"><span class="gen-name">${name}</span><span class="gen-out">${value.replace(/</g, "&lt;")}</span></button>`;

function render() {
  const text = input.value || input.placeholder;
  const [, l, r] = FRAMES[frameSel.i] || [null, "", ""];
  list.innerHTML = STYLES.map((s) => row(s.name, l + convert(s, text) + r)).join("");
  try { localStorage.setItem("chu-kieu-text", JSON.stringify(input.value)); } catch {}
}

framesBox.innerHTML =
  `<button class="chip on" data-i="-1">Không khung</button>` +
  FRAMES.map(([name, l, r], i) => `<button class="chip" data-i="${i}" title="${name}">${l}…${r}</button>`).join("");
framesBox.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-i]");
  if (!b) return;
  frameSel.i = +b.dataset.i;
  framesBox.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === b));
  render();
});

try { input.value = JSON.parse(localStorage.getItem("chu-kieu-text")) || ""; } catch {}
input.addEventListener("input", render);
render();
}
