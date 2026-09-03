/* ═══════════════════════════════════════════════════════════════════
   ORAVIA — pitch deck behaviour
   No dependencies. Opens from the filesystem; nothing here needs a server.

   Sections
     1  clinical vocabulary and demo data   (fictional — §34)
     2  deck navigation
     3  tooth history            slide 07
     4  living dental map        slide 08
     5  time machine             slide 09
     6  voice → structured       slide 10
     7  treatment journey        slide 11
     8  continuity queue         slide 12
     9  practice intelligence    slide 13
   ═══════════════════════════════════════════════════════════════════ */

(function () {
"use strict";

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const SVGNS = "http://www.w3.org/2000/svg";

function svg(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/* ── 1 ─ CLINICAL VOCABULARY ────────────────────────────────────────
   §06 requires that colour never carries clinical meaning alone.
   Every state therefore ships a colour, a glyph and an Arabic label,
   and the render helpers below always emit all three.                */

const STATE = {
  healthy:    { ar: "سليمة",          glyph: "·",  fill: "#E8E2D6", ink: "#05121A" },
  restored:   { ar: "ترميم قائم",     glyph: "R",  fill: "#8FA5AF", ink: "#05121A" },
  watch:      { ar: "تحت المراقبة",   glyph: "M",  fill: "#6FA88C", ink: "#05121A" },
  caries:     { ar: "تسوّس",           glyph: "C",  fill: "#D98E4A", ink: "#05121A" },
  deep:       { ar: "تسوّس عميق",      glyph: "C+", fill: "#E2574C", ink: "#05121A" },
  /* Gold is the signature colour and means one thing only:
     this is where the patient currently stands. */
  active:     { ar: "علاج جارٍ",       glyph: "→",  fill: "#D9B36C", ink: "#05121A" },
  crown:      { ar: "تاج",            glyph: "K",  fill: "#B8C6CD", ink: "#05121A" },
  implant:    { ar: "زرعة",           glyph: "I",  fill: "#7FA0B5", ink: "#05121A" },
  missing:    { ar: "مفقودة",         glyph: "×",  fill: "#123243", ink: "#8FA5AF" }
};

/* FDI two-digit notation. Quadrant 1 upper-right, 2 upper-left,
   3 lower-left, 4 lower-right; 1–8 outward from the midline. */
const UPPER = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];

const TOOTH_KIND = n => {
  const p = n % 10;
  if (p <= 2) return { ar: "قاطعة",  w: 15, h: 21 };
  if (p === 3) return { ar: "ناب",   w: 16, h: 23 };
  if (p <= 5) return { ar: "ضاحكة",  w: 18, h: 21 };
  return { ar: "رحى", w: 22, h: 22 };
};
const ARCH_AR = n => (n < 30 ? "علوية" : "سفلية");
const SIDE_AR = n => ([1,4].indexOf(Math.floor(n / 10)) >= 0 ? "يمنى" : "يسرى");

/* Fictional demo patient — §34. */
const PATIENT = { name: "أحمد بن علي", id: "ORA-P-004281" };

const CHART = {
  46: { state: "active",   case: "ORA-C-0042", dx: "تسوّس عميق", now: "علاج جذور — الحصة 3 من 4", next: "حشو الجذر", since: "04 سبتمبر 2026", sessions: 3 },
  16: { state: "caries",   case: "ORA-C-0051", dx: "تسوّس سطحي", now: "مخطّط له",                  next: "ترميم مركّب",  since: "22 أوت 2026",    sessions: 0 },
  36: { state: "restored", dx: "ترميم أملغم قديم", now: "مستقرّ", note: "رُمّم في 2019 لدى ممارس سابق. أُدرج ضمن السجلّ عند أوّل زيارة." },
  47: { state: "restored", dx: "تسوّس مُعالَج",    now: "مستقرّ", note: "ترميم مركّب، ماي 2025." },
  26: { state: "crown",    dx: "تاج خزفي",        now: "مستقرّ", note: "رُكّب في 2022. مراجعة دورية." },
  38: { state: "missing",  dx: "قُلعت",           now: "غائبة",  note: "قُلعت في 2021 — ضرس عقل منطمر." },
  28: { state: "missing",  dx: "قُلعت",           now: "غائبة",  note: "قُلعت في 2021 — ضرس عقل منطمر." },
  24: { state: "watch",    dx: "شقّ مينائي",       now: "مراقبة", note: "بلا أعراض. يُعاد تقييمه عند كلّ استدعاء." },
  31: { state: "watch",    dx: "انحسار لثوي طفيف", now: "مراقبة", note: "قياس دوري للجيب اللثوي." }
};

/* ── 2 ─ DECK NAVIGATION ───────────────────────────────────────── */

const slides = $$(".slide");
const rail   = $("#rail");
let index = 0;

slides.forEach((s, i) => {
  const li  = el("li", "rail__item" + (i === 0 ? " is-on" : ""));
  const dot = el("button", "rail__dot");
  dot.type = "button";
  dot.setAttribute("aria-label", (i + 1) + ". " + s.dataset.title);
  dot.addEventListener("click", () => go(i));
  li.appendChild(dot);
  li.appendChild(el("span", "rail__label", s.dataset.title));
  rail.appendChild(li);
});

const railItems = $$(".rail__item");
$("#counter-all").textContent = String(slides.length).padStart(2, "0");

function go(n) {
  index = Math.max(0, Math.min(slides.length - 1, n));
  slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
  railItems.forEach((r, i) => r.classList.toggle("is-on", i === index));
  $("#counter-now").textContent = String(index + 1).padStart(2, "0");
  $("#prev").disabled = index === 0;
  $("#next").disabled = index === slides.length - 1;
  slides[index].scrollTop = 0;
  try {
    if (location.hash !== "#s" + (index + 1)) {
      history.replaceState(null, "", "#s" + (index + 1));
    }
  } catch (err) { /* file:// in some browsers — navigation must not depend on it */ }
}
const nextSlide = () => go(index + 1);
const prevSlide = () => go(index - 1);

$("#next").addEventListener("click", nextSlide);
$("#prev").addEventListener("click", prevSlide);

/* RTL: the deck reads right to left, so ArrowLeft advances. */
document.addEventListener("keydown", e => {
  if (e.defaultPrevented) return;
  const tag = document.activeElement && document.activeElement.tagName;
  switch (e.key) {
    case "ArrowLeft": case "PageDown": nextSlide(); break;
    case "ArrowRight": case "PageUp":  prevSlide(); break;
    case " ": if (tag !== "BUTTON") { e.preventDefault(); nextSlide(); } break;
    case "Home": go(0); break;
    case "End":  go(slides.length - 1); break;
    case "f": case "F": togglePresent(); break;
    case "Escape": if (document.body.classList.contains("is-presenting")) togglePresent(); break;
    default: return;
  }
});

function togglePresent() {
  const on = document.body.classList.toggle("is-presenting");
  if (on && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (!on && document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

/* Touch: swipe. In RTL a leftward swipe advances. */
let tx = 0, ty = 0;
document.addEventListener("touchstart", e => { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.6) (dx < 0 ? nextSlide : prevSlide)();
}, { passive: true });

const hint = $("#hintbar");
setTimeout(() => hint.classList.add("is-gone"), 5200);

/* ── 3 ─ TOOTH HISTORY  ·  slide 07 ────────────────────────────── */

const HISTORY_46 = [
  { d: "14 مارس 2026",  what: "تشخيص: تسوّس عميق", tag: "فحص · صورة شعاعية ذروية" },
  { d: "04 سبتمبر 2026", what: "فتح وتنظيف اللبّ",  tag: "الحصة 1 · د. سلمى بن عمّار" },
  { d: "08 سبتمبر 2026", what: "تحضير القناة",      tag: "الحصة 2 · حشو مؤقّت" },
  { d: "12 سبتمبر 2026", what: "حساسية خفيفة مبلّغ عنها", tag: "الحصة 2 · ملاحظة سريرية", now: true },
  { d: "الخطوة القادمة", what: "حشو الجذر",         tag: "الحصة 3 · 45 دقيقة", next: true },
  { d: "بعدها",         what: "تحضير التاج",        tag: "الحصة 4", next: true }
];

(function toothHistory() {
  const box = $("#tooth-history");
  const head = el("div", "th__head");
  head.appendChild(el("span", "th__fdi", "46"));
  head.appendChild(el("span", "th__meta", "الرحى الأولى السفلى اليمنى · " + PATIENT.name + " · " + PATIENT.id));
  box.appendChild(head);

  const list = el("div", "th__list");
  HISTORY_46.forEach(r => {
    const row = el("div", "th__row" + (r.now ? " is-now" : "") + (r.next ? " is-next" : ""));
    row.appendChild(el("span", "th__date", r.d));
    const w = el("span", "th__what", r.what);
    w.appendChild(el("span", "th__tag", r.tag));
    row.appendChild(w);
    list.appendChild(row);
  });
  box.appendChild(list);
})();

/* ── 4 ─ LIVING DENTAL MAP  ·  slide 08 ────────────────────────── */

/* Teeth are laid on two elliptical arcs: the maxillary arch peaks at
   the top centre, the mandibular mirrors it. The arch keeps its
   clinical orientation regardless of text direction — it is anatomy,
   not text, and must not mirror with RTL. */
function archPositions(codes, cx, cy, rx, ry, down) {
  /* Sampled by arc length, not by angle. Equal angular steps on an ellipse
     bunch points where the curve is tightest, which would stack the molars
     on top of each other at the back of the arch. */
  const N = 900, pt = [], cum = [0];
  for (let i = 0; i <= N; i++) {
    const a = Math.PI + (i / N) * Math.PI;
    pt.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a) * (down ? -1 : 1), a]);
    if (i > 0) cum.push(cum[i - 1] + Math.hypot(pt[i][0] - pt[i - 1][0], pt[i][1] - pt[i - 1][1]));
  }
  const total = cum[N];
  return codes.map((code, k) => {
    const target = (k / (codes.length - 1)) * total;
    let i = 0; while (i < N && cum[i] < target) i++;
    const p = pt[i];
    /* Outward normal, so the FDI numeral sits outside the arch wherever the
       tooth is — above at the midline, beside it at the back. */
    const dx = p[0] - cx, dy = p[1] - cy, len = Math.hypot(dx, dy) || 1;
    return { code, x: p[0], y: p[1], rot: (p[2] * 180 / Math.PI) + 90, nx: dx / len, ny: dy / len };
  });
}

let selected = 46;

(function odontogram() {
  const root = $("#odontogram");
  const teeth = archPositions(UPPER, 310, 150, 250, 95, false)
        .concat(archPositions(LOWER, 310, 190, 250, 95, true));

  teeth.forEach(t => {
    const st = (CHART[t.code] && CHART[t.code].state) || "healthy";
    const k  = TOOTH_KIND(t.code);
    const g  = svg("g", { class: "tooth", tabindex: "0", role: "button",
                          "data-fdi": t.code,
                          "aria-label": "السن " + t.code + " — " + STATE[st].ar });

    g.appendChild(svg("rect", {
      class: "tooth__shape", x: t.x - k.w / 2, y: t.y - k.h / 2,
      width: k.w, height: k.h, rx: 4, fill: STATE[st].fill,
      transform: "rotate(" + t.rot + " " + t.x + " " + t.y + ")"
    }));

    if (STATE[st].glyph !== "·") {
      const gl = svg("text", { class: "tooth__glyph", x: t.x, y: t.y + 3, style: "fill:" + STATE[st].ink });
      gl.textContent = STATE[st].glyph;
      g.appendChild(gl);
    }

    const num = svg("text", { class: "tooth__num",
                              x: t.x + t.nx * 21, y: t.y + t.ny * 21 + 3.4 });
    num.textContent = t.code;
    g.appendChild(num);

    g.addEventListener("click", () => select(t.code));
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(t.code); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault(); e.stopPropagation();          /* don't move the deck */
        const all = UPPER.concat(LOWER);
        const i = all.indexOf(t.code);
        const nx = all[(i + (e.key === "ArrowLeft" ? 1 : -1) + all.length) % all.length];
        const node = $('.tooth[data-fdi="' + nx + '"]');
        if (node) { node.focus(); select(nx); }
      }
    });
    root.appendChild(g);
  });

  /* Legend — only the states actually present in this chart. */
  const present = ["healthy","restored","watch","caries","deep","active","crown","missing"];
  const lg = $("#legend");
  present.forEach(k => {
    const li = el("li");
    const sw = el("i"); sw.style.background = STATE[k].fill;
    li.appendChild(sw);
    li.appendChild(el("b", null, STATE[k].glyph === "·" ? "" : STATE[k].glyph));
    li.appendChild(document.createTextNode(STATE[k].ar));
    lg.appendChild(li);
  });

  select(46);
})();

function select(code) {
  selected = code;
  $$(".tooth").forEach(t => t.classList.toggle("is-sel", +t.dataset.fdi === code));

  const rec = CHART[code];
  const st  = (rec && rec.state) || "healthy";
  const k   = TOOTH_KIND(code);
  const p   = $("#tooth-panel");
  p.textContent = "";

  p.appendChild(el("p", "tp__fdi", String(code)));
  p.appendChild(el("p", "tp__name", k.ar + " " + ARCH_AR(code) + " " + SIDE_AR(code) + " · FDI " + code));

  /* colour + glyph + text, always all three */
  const pill = el("span", "tp__state");
  pill.style.borderColor = STATE[st].fill;
  pill.style.color = STATE[st].fill;
  const dot = el("i"); dot.style.background = STATE[st].fill;
  pill.appendChild(dot);
  pill.appendChild(el("b", null, STATE[st].glyph));
  pill.appendChild(document.createTextNode(STATE[st].ar));
  p.appendChild(pill);

  const rows = el("div", "tp__rows");
  const add = (kk, vv, cls) => {
    const r = el("div", "tp__row");
    r.appendChild(el("span", "tp__k", kk));
    r.appendChild(el("span", "tp__v" + (cls ? " " + cls : ""), vv));
    rows.appendChild(r);
  };

  if (!rec) {
    p.appendChild(el("p", "tp__empty", "لا يوجد سجلّ سريري على هذه السن. غياب الحدث معلومة أيضًا: السن دخلت النظام سليمة، والتاريخ يبدأ من هنا."));
    return;
  }
  add("التشخيص", rec.dx);
  add("الحالة الآن", rec.now);
  if (rec.next)     add("الخطوة القادمة", rec.next, "tp__v--next");
  if (rec.case)     add("الحالة العلاجية", rec.case);
  if (rec.since)    add("بدأت في", rec.since);
  if (rec.sessions) add("الحصص", rec.sessions + " مسجّلة");
  if (rec.note)     add("ملاحظة", rec.note);
  p.appendChild(rows);
}

/* ── 5 ─ TIME MACHINE  ·  slide 09 ─────────────────────────────── */

const TM = {
  2024: { states: { 36: "restored", 47: "watch" },
          cap: "السن <b>46</b> سليمة. ترميم قديم على 36 أُدرج في السجلّ عند أوّل زيارة." },
  2025: { states: { 36: "restored", 47: "caries", 46: "caries" },
          cap: "تسوّس يظهر على <b>46</b> و47. من هنا تبدأ الساعة السريرية — لا الرزنامة." },
  2026: { states: { 36: "restored", 47: "restored", 46: "active", 31: "watch" },
          cap: "<b>46</b> في علاج جذور، الحصة 3 من 4. 47 رُمّمت. الذهبي يعني: هنا يقف المريض الآن." },
  2027: { states: { 36: "restored", 47: "restored", 46: "crown", 31: "watch" },
          cap: "<b>46</b> تُوّجت والحالة أُغلقت. القصّة كاملة محفوظة على السن نفسها، لا على ذاكرة أحد." }
};
const TM_YEARS = [2024, 2025, 2026, 2027];

(function timeMachine() {
  const bar = $("#tm-years");
  TM_YEARS.forEach(y => {
    const b = el("button", "tm__year", String(y));
    b.type = "button";
    b.dataset.year = y;
    b.setAttribute("aria-pressed", y === 2026 ? "true" : "false");
    b.addEventListener("click", () => paintYear(y));
    bar.appendChild(b);
  });
  paintYear(2026);
})();

function paintYear(year) {
  $$(".tm__year").forEach(b => {
    const on = +b.dataset.year === year;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });

  const root = $("#tm-chart");
  root.textContent = "";
  const states = TM[year].states;

  /* A linear strip of the mandibular arch, not a second arch: across
     four years the comparison is easier to read side by side. */
  const pad = 20, gap = 37.5;
  LOWER.forEach((code, i) => {
    const x = pad + i * gap + gap / 2;
    const st = states[code] || "healthy";
    const k  = TOOTH_KIND(code);
    const g  = svg("g");
    g.appendChild(svg("rect", {
      x: x - k.w / 2, y: 62, width: k.w, height: k.h + 6, rx: 4,
      fill: STATE[st].fill, stroke: "#05121A", "stroke-width": 1.2
    }));
    if (STATE[st].glyph !== "·") {
      const gl = svg("text", { class: "tooth__glyph", x: x, y: 78, style: "fill:" + STATE[st].ink });
      gl.textContent = STATE[st].glyph;
      g.appendChild(gl);
    }
    const num = svg("text", { class: "tooth__num", x: x, y: 106 });
    num.textContent = code;
    g.appendChild(num);

    if (code === 46) {
      const lab = svg("text", { class: "tooth__num", x: x, y: 48, style: "fill:#D9B36C" });
      lab.textContent = STATE[st].ar;
      g.appendChild(lab);
      g.appendChild(svg("line", { x1: x, y1: 52, x2: x, y2: 60, stroke: "#D9B36C", "stroke-width": 1 }));
    }
    root.appendChild(g);
  });

  const yr = svg("text", { x: 20, y: 24, fill: "#8FA5AF", "font-size": "13", "font-family": "IBM Plex Sans, sans-serif" });
  yr.textContent = year;
  root.appendChild(yr);

  $("#tm-caption").innerHTML = TM[year].cap;
}

/* ── 6 ─ VOICE → STRUCTURED RECORD  ·  slide 10 ────────────────── */

/* Authentic chairside code-switching: Tunisian Arabic carrying French
   dental terminology. §11 — the architecture must not assume English. */
const UTTERANCE = 'الـ 46 كمّلنا فيها <span class="lat">canal preparation</span>، حطّينا <span class="lat">obturation provisoire</span>، المريض عندو <span class="lat">sensibilité légère</span>، الحصّة الجاية نعملو <span class="lat">l\'obturation</span>.';

const SLOTS = [
  { k: "السن",              v: '46 <span class="lat">(FDI)</span> — الرحى الأولى السفلى اليمنى' },
  { k: "الإجراء",           v: 'تحضير القناة <span class="lat">· canal preparation</span>' },
  { k: "الحالة",            v: "مكتمل" },
  { k: "ترميم مؤقّت",       v: 'نعم <span class="lat">· obturation provisoire</span>' },
  { k: "عَرَض مبلَّغ عنه",   v: 'حساسية خفيفة <span class="lat">· sensibilité légère</span>' },
  { k: "الخطوة القادمة",    v: 'حشو الجذر <span class="lat">· obturation</span>', next: true },
  { k: "مستوى الثقة",       v: "مرتفع — مفردات مغلقة (~500 مصطلح)، بنية خانات ثابتة" }
];

(function voice() {
  const btn   = $("#voice-run");
  const out   = $("#utterance");
  const slots = $("#slots");
  const gate  = $("#gate");
  const done  = $("#gate-done");
  let timers  = [];

  function reset() {
    timers.forEach(clearTimeout); timers = [];
    out.innerHTML = ""; slots.textContent = "";
    gate.hidden = true; done.hidden = true;
    btn.disabled = false; btn.textContent = "شغّل المثال";
  }

  function run() {
    reset();
    btn.disabled = true; btn.textContent = "جارٍ الاستماع…";

    /* Type the utterance out. Tokenised on markup boundaries so the
       Latin spans stay intact while typing. */
    const parts = UTTERANCE.match(/<span class="lat">.*?<\/span>|./g) || [];
    let i = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduced ? 0 : 34;

    function type() {
      if (i >= parts.length) {
        out.innerHTML = UTTERANCE;
        btn.textContent = "أعد التشغيل"; btn.disabled = false;
        revealSlots();
        return;
      }
      out.innerHTML = parts.slice(0, ++i).join("") + '<span class="caret"></span>';
      timers.push(setTimeout(type, step));
    }
    if (reduced) { out.innerHTML = UTTERANCE; btn.textContent = "أعد التشغيل"; btn.disabled = false; revealSlots(); }
    else type();
  }

  function revealSlots() {
    SLOTS.forEach((s, n) => {
      timers.push(setTimeout(() => {
        const d = el("div", "slot" + (s.next ? " slot--next" : ""));
        d.appendChild(el("dt", null, s.k));
        const dd = el("dd"); dd.innerHTML = s.v;
        d.appendChild(dd);
        slots.appendChild(d);
        if (n === SLOTS.length - 1) gate.hidden = false;
      }, n * 190));
    });
  }

  btn.addEventListener("click", run);

  $("#gate-edit").addEventListener("click", () => {
    const dd = $$(".slot dd")[4];
    if (dd) {
      dd.innerHTML = 'حساسية خفيفة عند البرودة <span class="lat">· sensibilité au froid</span>';
      dd.style.color = "#D9B36C";
    }
    $("#gate-edit").textContent = "عُدّل بواسطة الطبيب";
    $("#gate-edit").disabled = true;
  });

  $("#gate-approve").addEventListener("click", () => {
    gate.hidden = true; done.hidden = false;
  });
})();

/* ── 7 ─ TREATMENT JOURNEY  ·  slide 11 ────────────────────────── */

const STAGES = [
  { n: "التشخيص",              d: "14 مارس",    s: "done" },
  { n: "خطّة العلاج والقبول",   d: "14 مارس",    s: "done" },
  { n: "الحصة 1 — فتح وتنظيف", d: "04 سبتمبر", s: "done" },
  { n: "الحصة 2 — تحضير القناة", d: "08 سبتمبر", s: "done" },
  { n: "الحصة 3 — حشو الجذر",   d: "مستحقّة",    s: "now"  },
  { n: "الحصة 4 — تحضير التاج", d: "—",         s: "todo" },
  { n: "تركيب التاج",          d: "—",         s: "todo" }
];

(function caseCard() {
  const box = $("#case-card");
  const done = STAGES.filter(s => s.s === "done").length;
  const pct  = Math.round((done / STAGES.length) * 100);

  const top = el("div", "case__top");
  const left = el("div");
  left.appendChild(el("p", "case__id", "ORA-C-0042 · السن 46"));
  left.appendChild(el("p", "case__pt", PATIENT.name));
  top.appendChild(left);
  top.appendChild(el("p", "case__pct", pct + "%"));
  box.appendChild(top);

  const bar = el("div", "case__bar");
  const fill = el("i"); fill.style.inlineSize = pct + "%";
  bar.appendChild(fill);
  box.appendChild(bar);

  const list = el("div", "stages");
  STAGES.forEach(s => {
    const r = el("div", "stage stage--" + s.s);
    r.appendChild(el("span", "stage__i", s.s === "done" ? "✓" : s.s === "now" ? "→" : ""));
    r.appendChild(el("span", "stage__n", s.n));
    r.appendChild(el("span", "stage__d", s.d));
    list.appendChild(r);
  });
  box.appendChild(list);
  box.appendChild(el("p", "case__due", "المرحلة الجارية تجاوزت مهلتها السريرية بـ 6 أيام — المهلة المعتادة بين تحضير القناة والحشو 14 يومًا."));
})();

/* ── 8 ─ CONTINUITY QUEUE  ·  slide 12 ─────────────────────────── */

const TASKS = [
  { lvl: "عاجل",   c: "#E2574C", who: "أحمد بن علي",     id: "ORA-P-004281",
    why: "الحالة 0042 تجاوزت المهلة السريرية بـ 6 أيام — القناة مفتوحة منذ 20 يومًا", act: "الطبيب · اليوم" },
  { lvl: "متابعة", c: "#D98E4A", who: "ليلى الطرابلسي",  id: "ORA-P-003914",
    why: "اكتملت الحصة 2 ولم تُحجز الحصة 3 منذ 18 يومًا", act: "السكرتارية · اليوم" },
  { lvl: "متابعة", c: "#D98E4A", who: "محمد القاسمي",    id: "ORA-P-004102",
    why: "موعد فائت دون إعادة برمجة", act: "السكرتارية · خلال 48 ساعة" },
  { lvl: "قرار معلّق", c: "#8FA5AF", who: "سنية بن رمضان", id: "ORA-P-002877",
    why: "قبلت خطّة العلاج ولم تبدأ منذ 41 يومًا", act: "السكرتارية · هذا الأسبوع" },
  { lvl: "استدعاء", c: "#6FA88C", who: "فوزي العياري",   id: "ORA-P-001456",
    why: "استدعاء دوري مستحقّ منذ 3 أشهر", act: "قائمة الاستدعاء" }
];

(function queue() {
  const box = $("#queue");
  TASKS.forEach(t => {
    const row = el("div", "task");
    const pip = el("span", "task__pip"); pip.style.background = t.c;
    row.appendChild(pip);

    const who = el("p", "task__who", t.who);
    who.appendChild(el("span", "task__id", t.id));
    row.appendChild(who);

    row.appendChild(el("p", "task__why", t.why));

    const act = el("p", "task__act");
    const lvl = el("span", "task__lvl", t.lvl);
    lvl.style.borderColor = t.c; lvl.style.color = t.c;
    act.appendChild(lvl);
    act.appendChild(document.createTextNode(t.act));
    row.appendChild(act);

    box.appendChild(row);
  });
})();

/* ── 9 ─ PRACTICE INTELLIGENCE  ·  slide 13 ────────────────────── */

const SERIES  = [54, 57, 61, 64, 68, 71];
const METRICS = [
  { k: "علاجات متوقّفة",         v: "12",         d: "−7 عن الشهر الفارط",  cls: "up"   },
  { k: "معدّل عدم الحضور",       v: "9%",         d: "−3 نقاط",             cls: "up"   },
  { k: "متوسّط الحصص لكلّ حالة",  v: "3.4",        d: "مستقرّ",               cls: "flat" },
  { k: "الامتثال للاستدعاء",     v: "62%",        d: "+11 نقطة",            cls: "up"   },
  { k: "قيمة العلاجات المعلّقة",  v: "18,400 د.ت", d: "قابلة للاسترجاع",      cls: "flat" },
  { k: "مرضى أُعيد تنشيطهم",     v: "23",         d: "هذا الفصل",           cls: "up"   }
];

(function dashboard() {
  const grid = $("#dash-grid");
  METRICS.forEach(m => {
    const li = el("li", "metric");
    li.appendChild(el("p", "metric__k", m.k));
    li.appendChild(el("p", "metric__v", m.v));
    li.appendChild(el("p", "metric__d " + m.cls, m.d));
    grid.appendChild(li);
  });

  /* Sparkline */
  const root = $("#kpi-chart");
  const W = 340, H = 120, pad = 8;
  const min = 48, max = 78;
  const pts = SERIES.map((v, i) => [
    pad + (i / (SERIES.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / (max - min)) * (H - pad * 2)
  ]);
  const line = pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

  root.appendChild(svg("polyline", {
    points: line, fill: "none", stroke: "#D9B36C", "stroke-width": "1.8",
    "stroke-linejoin": "round", "stroke-linecap": "round"
  }));
  root.appendChild(svg("polygon", {
    points: line + " " + pts[pts.length - 1][0].toFixed(1) + "," + (H - pad) + " " + pad + "," + (H - pad),
    fill: "rgba(217,179,108,.10)"
  }));
  pts.forEach((p, i) => root.appendChild(svg("circle", {
    cx: p[0], cy: p[1], r: i === pts.length - 1 ? 3.6 : 2,
    fill: i === pts.length - 1 ? "#D9B36C" : "#5C7684"
  })));

  /* Count up once, when the slide is first reached. */
  const kpi = $("#kpi");
  let counted = false;
  const target = SERIES[SERIES.length - 1];
  function count() {
    if (counted) return; counted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { kpi.textContent = target; return; }
    let v = 0;
    const t = setInterval(() => {
      v += 2;
      if (v >= target) { v = target; clearInterval(t); }
      kpi.textContent = v;
    }, 22);
  }
  const dashSlide = $(".dash").closest(".slide");
  new MutationObserver(() => { if (dashSlide.classList.contains("is-active")) count(); })
    .observe(dashSlide, { attributes: true, attributeFilter: ["class"] });
})();

/* ── Boot ──────────────────────────────────────────────────────── */
const fromHash = parseInt((location.hash || "").replace("#s", ""), 10);
go(isNaN(fromHash) ? 0 : fromHash - 1);

})();
