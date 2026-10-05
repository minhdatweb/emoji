// Tìm kiếm, chọn màu da, bấm để copy / chế độ soạn, giao diện tối, lưu "dùng gần đây"
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").trim();

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const buttons = $$(".group:not(#recent) .e");
const groups = $$(".group:not(#recent)");
const recentBox = $("#recent");
const toast = $("#toast");

// ---- Màu da ----
const TONES = ["🏻", "🏼", "🏽", "🏾", "🏿"];
function applyTone(tone) {
  $$(".tones button").forEach((b) => b.classList.toggle("on", b.dataset.tone === tone));
  for (const b of $$(".e[data-t]")) {
    b.dataset.base ??= b.textContent;
    b.textContent = tone ? b.dataset.t.split(",")[TONES.indexOf(tone)] : b.dataset.base;
  }
  store.set("emoji-tone", tone);
}
$(".tones").addEventListener("click", (ev) => {
  const b = ev.target.closest("button");
  if (b) applyTone(b.dataset.tone);
});

// ---- Tìm kiếm ----
const input = $("#q");
function search() {
  const words = normalize(input.value).split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const b of buttons) {
    const ok = words.every((w) => b.dataset.k.includes(w));
    b.hidden = !ok;
    if (ok) shown++;
  }
  for (const g of groups) g.hidden = !$$(".e", g).some((b) => !b.hidden);
  recentBox.hidden = words.length > 0 || !$(".grid", recentBox).children.length;
  $("#empty").hidden = shown > 0;
}
input.addEventListener("input", search);
document.addEventListener("keydown", (ev) => {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
  if (ev.key === "/" && !typing) { ev.preventDefault(); input.focus(); }
  if (ev.key === "Escape" && document.activeElement === input) { input.value = ""; search(); }
});

// ---- Copy + gần đây ----
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(t); t.select(); document.execCommand("copy"); t.remove();
  }
}

function renderRecent() {
  const list = store.get("emoji-recent", []);
  $(".grid", recentBox).innerHTML = list
    .map(([e, name]) => `<button class="e" title="${name}" aria-label="${name}">${e}</button>`)
    .join("");
  recentBox.hidden = !list.length || !!input.value.trim();
}

document.addEventListener("click", async (ev) => {
  const b = ev.target.closest(".e");
  if (!b) return;
  const emoji = b.textContent;
  if (writeOn) insertAtCaret(emoji);
  else {
    await copy(emoji);
    showToast(`Đã copy ${emoji}  ${b.title}`);
  }
  const list = store.get("emoji-recent", []).filter(([e]) => e !== emoji);
  store.set("emoji-recent", [[emoji, b.title], ...list].slice(0, 24));
  renderRecent();
});

// ---- Chế độ soạn: bấm emoji → chèn vào khung soạn ở đáy, copy cả câu ----
const writeBar = $("#write");
const writeText = $("#write-text");
let writeOn = false;
function setWrite(on) {
  writeOn = on;
  writeBar.hidden = !on;
  document.body.classList.toggle("writing", on);
  $("#btn-write").setAttribute("aria-pressed", on);
  store.set("emoji-write", on);
}
function insertAtCaret(text) {
  const { selectionStart: a, selectionEnd: z, value } = writeText;
  writeText.value = value.slice(0, a) + text + value.slice(z);
  writeText.selectionStart = writeText.selectionEnd = a + text.length;
  store.set("emoji-draft", writeText.value);
}
$("#btn-write").addEventListener("click", () => setWrite(!writeOn));
writeText.addEventListener("input", () => store.set("emoji-draft", writeText.value));
$("#write-copy").addEventListener("click", async () => {
  if (!writeText.value) return;
  await copy(writeText.value);
  showToast("Đã copy cả đoạn");
});
$("#write-clear").addEventListener("click", () => {
  writeText.value = "";
  store.set("emoji-draft", "");
  writeText.focus();
});
writeText.value = store.get("emoji-draft", "");
setWrite(store.get("emoji-write", false));

// ---- Giao diện sáng/tối (lần đầu theo máy; data-theme gán sớm ở <head> để không nháy) ----
$("#btn-theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  store.set("emoji-theme", root.dataset.theme);
});

// ---- Đánh dấu nhóm đang xem trên thanh điều hướng ----
const chips = new Map($$(".chip").map((c) => [c.dataset.g, c]));
const io = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      chips.forEach((c) => c.classList.remove("on"));
      chips.get(en.target.id)?.classList.add("on");
    }
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
groups.forEach((g) => io.observe(g));

applyTone(store.get("emoji-tone", ""));
renderRecent();

// Chiều cao header dính → để bấm nhóm không bị header che tiêu đề
const setHeaderH = () => document.documentElement.style.setProperty("--header-h", $(".site-header").offsetHeight + "px");
setHeaderH();
addEventListener("resize", setHeaderH);
