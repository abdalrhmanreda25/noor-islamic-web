// Builds the mushaf reader's data from the Flutter app's qcf_quran_plus package:
//
//  * data/quran-pages/<page>.json   rows ready to render (banner / basmala /
//                                   glyph lines with surah:ayah per slice)
//  * data/quran-pages/index.json    page meta + surah / juz / quarter starts
//  * data/quran-pages/ayah-pages.json  page of every ayah, per surah
//  * public/fonts/qcf/p<NNN>.woff2  one QCF4 tajweed font per page (.ttf when
//                                   python fontTools+brotli are unavailable)
//  * public/fonts/qcf/bsml.*, surah-banner.png
//
// The page fonts for 1-580 are downloaded from the app's GitHub release (sha256
// checked against the app's manifest); 581-604 ship inside the package.
// Downloads are cached in node_modules/.cache/qcf-fonts.
//
// Usage: node scripts/convert-quran-pages.mjs [path-to-flutter-repo]
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const PKG = path.join(SRC, "qcf_quran_plus-0.0.8");
const OUT = path.resolve("data/quran-pages");
const FONTS = path.resolve("public/fonts/qcf");
const CACHE = path.resolve("node_modules/.cache/qcf-fonts");
const BASE = "https://github.com/Eslam-Aped-Ali/quran_model/releases/download/assets-v1/";
const PAGES = 604;
const ROWS = 15;
const pad3 = (n) => String(n).padStart(3, "0");

// Dart const list literals (with /// comments) are valid JS expressions.
const dart = (file) => {
  const s = fs.readFileSync(path.join(PKG, "lib/src/data", file), "utf8");
  return new Function(`return ${s.slice(s.indexOf("=") + 1).trim().replace(/;\s*$/, "")}`)();
};

// ───────────────────────── fonts ─────────────────────────

function manifestChunks() {
  const s = fs.readFileSync(path.join(SRC, "lib/core/remote_assets/remote_assets_manifest.g.dart"), "utf8");
  const re = /file: '(qcf-tajweed-[^']+)',\s*bytes: (\d+),\s*sha256: '([0-9a-f]+)',\s*firstPage: (\d+),\s*lastPage: (\d+)/g;
  return [...s.matchAll(re)].map((m) => ({ file: m[1], bytes: +m[2], sha256: m[3], first: +m[4], last: +m[5] }));
}

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

async function download(chunk) {
  const file = path.join(CACHE, chunk.file);
  if (fs.existsSync(file) && sha256(file) === chunk.sha256) return file;
  const res = await fetch(BASE + chunk.file);
  if (!res.ok) throw new Error(`${chunk.file}: HTTP ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const sum = sha256(file);
  if (sum !== chunk.sha256) throw new Error(`${chunk.file}: sha256 ${sum} != ${chunk.sha256}`);
  return file;
}

/** Extracts every page's ttf into CACHE/ttf/QCF4_tajweed_<NNN>.ttf. */
async function extractPageFonts() {
  const ttfDir = path.join(CACHE, "ttf");
  fs.mkdirSync(ttfDir, { recursive: true });
  const have = (p) => fs.existsSync(path.join(ttfDir, `QCF4_tajweed_${pad3(p)}.ttf`));
  const chunks = manifestChunks();
  if (chunks.length * 20 !== 580) throw new Error(`manifest has ${chunks.length} font chunks, expected 29`);
  let i = 0;
  const work = async () => {
    while (i < chunks.length) {
      const c = chunks[i++];
      let all = true;
      for (let p = c.first; p <= c.last; p++) all &&= have(p);
      if (all) continue;
      const zip = await download(c);
      execFileSync("unzip", ["-o", "-q", "-j", zip, "*.ttf", "-d", ttfDir]);
      console.log(`  fonts ${c.first}-${c.last}`);
    }
  };
  await Promise.all([work(), work(), work(), work()]);
  for (let p = 581; p <= PAGES; p++) {
    if (have(p)) continue;
    const zip = path.join(PKG, `assets/fonts/qcf_tajweed/QCF4_tajweed_${p}.zip`);
    execFileSync("unzip", ["-o", "-q", "-j", zip, "*.ttf", "-d", ttfDir]);
  }
  for (let p = 1; p <= PAGES; p++) if (!have(p)) throw new Error(`missing font for page ${p}`);
  return ttfDir;
}

/** ttf -> woff2 with python fontTools when available (3x smaller), else copies the ttf. */
function publishFonts(ttfDir) {
  fs.mkdirSync(FONTS, { recursive: true });
  const jobs = [];
  for (let p = 1; p <= PAGES; p++) jobs.push([path.join(ttfDir, `QCF4_tajweed_${pad3(p)}.ttf`), `p${pad3(p)}`]);
  jobs.push([path.join(PKG, "assets/fonts/QCF4_BSML/QCF4_BSML.ttf"), "bsml"]);
  const woff2 =
    spawnSync("python3", ["-c", "import fontTools.ttLib, brotli"], { stdio: "ignore" }).status === 0;
  const ext = woff2 ? "woff2" : "ttf";
  const todo = jobs.filter(([, name]) => !fs.existsSync(path.join(FONTS, `${name}.${ext}`)));
  if (todo.length && woff2) {
    console.log(`  woff2: converting ${todo.length} fonts`);
    // Pool needs an importable __main__ on macOS (spawn), so run from a file.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qcf-woff2-"));
    fs.writeFileSync(path.join(dir, "jobs.json"), JSON.stringify(todo.map(([src, name]) => [src, path.join(FONTS, `${name}.woff2`)])));
    fs.writeFileSync(
      path.join(dir, "woff2.py"),
      `import json, sys
from multiprocessing import Pool
from fontTools.ttLib import TTFont

def conv(job):
    f = TTFont(job[0])
    f.flavor = "woff2"
    f.save(job[1])

if __name__ == "__main__":
    with Pool() as p:
        p.map(conv, json.load(open(sys.argv[1])))
`,
    );
    execFileSync("python3", [path.join(dir, "woff2.py"), path.join(dir, "jobs.json")], { stdio: "inherit" });
    fs.rmSync(dir, { recursive: true });
  } else {
    for (const [src, name] of todo) fs.copyFileSync(src, path.join(FONTS, `${name}.ttf`));
  }
  fs.copyFileSync(path.join(PKG, "assets/surah_banner.png"), path.join(FONTS, "surah-banner.png"));
  return ext;
}

/** Advance width (em) per code point, read from the ttf's cmap (format 4) + hmtx. */
function advances(file) {
  const b = fs.readFileSync(file);
  const tables = {};
  for (let i = 0, n = b.readUInt16BE(4); i < n; i++) {
    const o = 12 + i * 16;
    tables[b.toString("latin1", o, o + 4)] = b.readUInt32BE(o + 8);
  }
  const upm = b.readUInt16BE(tables.head + 18);
  const nh = b.readUInt16BE(tables.hhea + 34);
  const adv = (g) => b.readUInt16BE(tables.hmtx + 4 * Math.min(g, nh - 1)) / upm;
  const cmap = tables.cmap;
  let sub = -1;
  for (let i = 0, n = b.readUInt16BE(cmap + 2); i < n; i++) {
    const o = cmap + 4 + i * 8;
    const [pid, eid] = [b.readUInt16BE(o), b.readUInt16BE(o + 2)];
    const off = cmap + b.readUInt32BE(o + 4);
    if (pid === 3 && eid === 1 && b.readUInt16BE(off) === 4) sub = off;
  }
  if (sub < 0) throw new Error(`${file}: no format-4 cmap`);
  const segX2 = b.readUInt16BE(sub + 6);
  const ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
  const map = new Map();
  for (let s = 0; s < segX2; s += 2) {
    const end = b.readUInt16BE(ends + s), start = b.readUInt16BE(starts + s);
    const delta = b.readInt16BE(deltas + s), ro = b.readUInt16BE(ranges + s);
    for (let c = start; c <= end && c !== 0xffff; c++) {
      let g;
      if (ro === 0) g = (c + delta) & 0xffff;
      else {
        g = b.readUInt16BE(ranges + s + ro + 2 * (c - start));
        if (g) g = (g + delta) & 0xffff;
      }
      map.set(c, adv(g));
    }
  }
  return map;
}

// ───────────────────────── layout ─────────────────────────
// Port of qcf_quran_plus GetPage + the app's MushafPageLayout (quran_listen):
// lines are split on "\n" and every line is put on its printed line number, the
// gap before a surah's first line holding its banner (and basmala).

const quran = dart("quran_data.dart").sort((a, b) => a.id - b.id);
const juzs = dart("juzs.dart");
const quarters = dart("quarters.dart");
const surahsMeta = JSON.parse(fs.readFileSync("data/quran/surahs.json", "utf8"));

const withSpace = (t = "") => (!t ? t : t.endsWith("\n") ? `${t.slice(0, -1)} \n` : `${t} `);
const key = (s, a) => s * 1000 + a;

const ayahs = quran.map((r) => ({
  id: r.id,
  juz: r.jozz,
  surah: r.sora,
  ayah: r.aya_no,
  page: r.page,
  lineStart: r.line_start,
  text: withSpace(r.aya_no === 1 ? r.aya_text.replaceAll("۞", "") : r.aya_text),
  qcf: withSpace(r.qcfData),
  centered: !!r.centered,
  number: [...r.qcfData.trim()].at(-1),
}));
const pageOf = new Map(ayahs.map((a) => [key(a.surah, a.ayah), a.page]));

function pageLines(pageAyahs) {
  const lines = [];
  let cur = [];
  for (const a of pageAyahs) {
    if (a.ayah === 1 && cur.length && cur.some((x) => x.text.trim())) {
      lines.push(cur);
      cur = [];
    }
    if (a.text.includes("\n")) {
      const parts = a.text.split("\n");
      const qcfParts = a.qcf.split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (!parts[i].trim()) continue;
        cur.push({ ...a, text: parts[i].trim(), qcf: (qcfParts[i] ?? parts[i]).trim(), centered: a.centered && i === parts.length - 2 });
        if (i < parts.length - 1) {
          lines.push(cur);
          cur = [];
        }
      }
    } else cur.push(a);
  }
  if (cur.length && cur.some((x) => x.text.trim())) lines.push(cur);
  return lines;
}

function buildPage(page, pageAyahs, adv, lineWidth) {
  const seen = new Map();
  const raw = pageLines(pageAyahs).map((line) => {
    const first = line[0];
    const before = seen.get(key(first.surah, first.ayah)) ?? 0;
    for (const a of line) seen.set(key(a.surah, a.ayah), (seen.get(key(a.surah, a.ayah)) ?? 0) + 1);
    const slices = line.map((a) => [a.surah, a.ayah, a.qcf.trimEnd()]);
    let width = 0;
    for (const [, , g] of slices) for (const c of g) width += adv.get(c.codePointAt(0)) ?? 0;
    return {
      slot: first.lineStart + before,
      opens: first.ayah === 1 && before === 0,
      surah: first.surah,
      justify: !line.at(-1).centered && page > 2,
      width,
      slices,
    };
  });

  // Font scale that brings a line to the mushaf line width: justified lines are
  // scaled to it exactly (within a sane band), short lines only ever shrink.
  const line = (r) => {
    const fit = r.width ? lineWidth / r.width : 1;
    const scale = r.justify && fit < 1.25 ? fit : Math.min(1, fit);
    return { t: "l", ...(r.justify ? {} : { c: 1 }), z: +scale.toFixed(4), s: r.slices };
  };

  let rows = [];
  let bySlot = raw.length > 0;
  let prev = 0;
  for (const r of raw) {
    if (r.slot <= prev || r.slot > ROWS) bySlot = false;
    prev = r.slot;
  }
  if (bySlot) {
    for (const r of raw) {
      const gap = r.slot - rows.length - 1;
      const banners = r.opens ? Math.min(gap, 2) : 0;
      for (let b = 0; b < gap - banners; b++) rows.push({ t: "x" });
      if (banners >= 1) rows.push({ t: "h", s: r.surah });
      if (banners === 2) rows.push({ t: "b", s: r.surah });
      rows.push(line(r));
    }
  } else {
    for (const r of raw) {
      if (r.opens) {
        rows.push({ t: "h", s: r.surah });
        if (r.surah !== 1 && r.surah !== 9) rows.push({ t: "b", s: r.surah });
      }
      rows.push(line(r));
    }
  }
  if (page > 2) while (rows.length < ROWS) rows.push({ t: "x" });
  return { rows, bySlot };
}

// ───────────────────────── main ─────────────────────────

console.log("Fonts…");
const ttfDir = await extractPageFonts();
const fontExt = publishFonts(ttfDir);

console.log("Pages…");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const byPage = Array.from({ length: PAGES }, () => []);
for (const a of ayahs) byPage[a.page - 1].push(a);

// Quarter (rub' al-hizb) starts, 240 of them, as global ayah ids.
const quarterStarts = quarters.map((q, i) => ({
  n: i + 1,
  surah: q.surah,
  ayah: q.ayah,
  page: pageOf.get(key(q.surah, q.ayah)),
  id: ayahs.find((a) => a.surah === q.surah && a.ayah === q.ayah).id,
}));
const quarterOf = (id) => quarterStarts.findLast((q) => q.id <= id).n;

// Mushaf line width (em): median natural width of the full lines.
const advCache = new Map();
const advOf = (p) => {
  if (!advCache.has(p)) advCache.set(p, advances(path.join(ttfDir, `QCF4_tajweed_${pad3(p)}.ttf`)));
  return advCache.get(p);
};
const widths = [];
for (let p = 3; p <= PAGES; p++) {
  for (const r of buildPage(p, byPage[p - 1], advOf(p), 1).rows)
    if (r.t === "l" && !r.c) widths.push(1 / r.z);
}
widths.sort((a, b) => a - b);
const lineWidth = +widths[widths.length >> 1].toFixed(3);
console.log(`  line width ${lineWidth}em (p5 ${widths[Math.floor(widths.length * 0.05)].toFixed(2)}, p95 ${widths[Math.floor(widths.length * 0.95)].toFixed(2)})`);

const pagesMeta = [];
let fallback = 0;
for (let p = 1; p <= PAGES; p++) {
  const list = byPage[p - 1];
  const { rows, bySlot } = buildPage(p, list, advOf(p), lineWidth);
  if (!bySlot) fallback++;
  const q = quarterOf(list[0].id);
  const meta = {
    juz: list[0].juz,
    hizb: Math.ceil(q / 4),
    quarter: q,
    surahs: [...new Set(list.map((a) => a.surah))],
    first: [list[0].surah, list[0].ayah],
    last: [list.at(-1).surah, list.at(-1).ayah],
  };
  pagesMeta.push(meta);
  fs.writeFileSync(path.join(OUT, `${p}.json`), JSON.stringify({ page: p, ...meta, rows }));
}

const surahStart = Array.from({ length: 114 }, (_, i) => pageOf.get(key(i + 1, 1)));
fs.writeFileSync(
  path.join(OUT, "index.json"),
  JSON.stringify({
    fontExt,
    lineWidth,
    pages: pagesMeta.map((m) => ({ juz: m.juz, hizb: m.hizb, quarter: m.quarter, surah: m.surahs[0] })),
    surahs: surahsMeta.map((s, i) => ({ n: s.number, page: surahStart[i] })),
    juz: juzs.map((j) => {
      const s = j.surahs[0];
      const a = j.verses[s][0];
      return { n: j.id, surah: s, ayah: a, page: pageOf.get(key(s, a)) };
    }),
    quarters: quarterStarts.map(({ n, surah, ayah, page }) => ({ n, surah, ayah, page })),
  }),
);

const ayahPages = Array.from({ length: 114 }, () => []);
for (const a of ayahs) ayahPages[a.surah - 1][a.ayah - 1] = a.page;
fs.writeFileSync(path.join(OUT, "ayah-pages.json"), JSON.stringify(ayahPages));

console.log(`Done: ${PAGES} pages (${fallback} without usable line numbers), fonts as .${fontExt}`);
