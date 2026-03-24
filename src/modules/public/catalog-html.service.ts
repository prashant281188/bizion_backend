import { publicService } from "./public.service";

/* ─────────────────────────────────────────────
   TYPES (mirror getCatalog output)
───────────────────────────────────────────── */
type Variant = {
  id: string;
  sku: string | null;
  packing: number | null;
  mrp: string | null;
  saleRate: string | null;
  options: Record<string, string>;
};

type Product = {
  id: string;
  model: string;
  metal: string | null;
  shortDescription: string | null;
  sizeType: string | null;
  variants: Variant[];
  image: { url: string } | null;
};

type Category = {
  id: string;
  categoryName: string;
  products: Product[];
};

type Brand = {
  id: string;
  brandName: string;
  brandLogo: string | null;
  categories: Category[];
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtMrp(mrp: string | null): string {
  if (!mrp) return "—";
  const n = parseFloat(mrp);
  if (isNaN(n)) return "—";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/* Build a Size × Finish matrix HTML table, or fallback to a flat table */
function variantTable(variants: Variant[]): string {
  if (!variants.length) return `<p class="no-variants">No variants</p>`;

  const sizes    = [...new Set(variants.map(v => v.options["Size"]).filter(Boolean))];
  const finishes = [...new Set(variants.map(v => v.options["Finish"]).filter(Boolean))];

  /* ── Full Size × Finish matrix ── */
  if (sizes.length && finishes.length) {
    const map: Record<string, string | null> = {};
    for (const v of variants) {
      const s = v.options["Size"], f = v.options["Finish"];
      if (s && f) map[`${s}|${f}`] = v.mrp;
    }
    const thead = `<tr><th class="corner">Size / Finish</th>${finishes.map(f => `<th>${esc(f)}</th>`).join("")}</tr>`;
    const tbody = sizes.map(s =>
      `<tr><td class="row-label">${esc(s)}</td>${finishes.map(f => `<td class="price">${fmtMrp(map[`${s}|${f}`] ?? null)}</td>`).join("")}</tr>`
    ).join("");
    return `<table class="vtable"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  }

  /* ── Size only ── */
  if (sizes.length) {
    const rows = variants.filter(v => v.options["Size"]).map(v =>
      `<tr><td class="row-label">${esc(v.options["Size"])}</td><td class="price">${fmtMrp(v.mrp)}</td>${v.sku ? `<td class="sku">${esc(v.sku)}</td>` : ""}</tr>`
    ).join("");
    return `<table class="vtable"><thead><tr><th>Size</th><th>MRP</th>${variants[0]?.sku ? "<th>SKU</th>" : ""}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ── Finish only ── */
  if (finishes.length) {
    const rows = variants.filter(v => v.options["Finish"]).map(v =>
      `<tr><td class="row-label">${esc(v.options["Finish"])}</td><td class="price">${fmtMrp(v.mrp)}</td>${v.sku ? `<td class="sku">${esc(v.sku)}</td>` : ""}</tr>`
    ).join("");
    return `<table class="vtable"><thead><tr><th>Finish</th><th>MRP</th>${variants[0]?.sku ? "<th>SKU</th>" : ""}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ── Other / no named options ── */
  const optionNames = [...new Set(variants.flatMap(v => Object.keys(v.options)))];
  if (optionNames.length) {
    const thead = `<tr>${optionNames.map(n => `<th>${esc(n)}</th>`).join("")}<th>MRP</th></tr>`;
    const tbody = variants.map(v =>
      `<tr>${optionNames.map(n => `<td class="row-label">${esc(v.options[n] ?? "")}</td>`).join("")}<td class="price">${fmtMrp(v.mrp)}</td></tr>`
    ).join("");
    return `<table class="vtable"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  }

  /* ── No options at all ── */
  const rows = variants.map(v =>
    `<tr><td class="row-label">${esc(v.sku ?? "—")}</td><td class="price">${fmtMrp(v.mrp)}</td><td>${v.packing ?? "—"}</td></tr>`
  ).join("");
  return `<table class="vtable"><thead><tr><th>SKU</th><th>MRP</th><th>Packing</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/* ─────────────────────────────────────────────
   HTML BUILDER
───────────────────────────────────────────── */

function buildHtml(catalog: Brand[]): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const totalBrands = catalog.length;
  const totalCats   = catalog.reduce((a, b) => a + b.categories.length, 0);
  const totalProds  = catalog.reduce((a, b) => a + b.categories.reduce((x, y) => x + y.products.length, 0), 0);

  const brandSections = catalog.map(brand => {
    const catSections = brand.categories.map(cat => {
      const cards = cat.products.map(p => `
        <div class="product-card">
          <div class="product-head">
            <div class="product-meta">
              <span class="product-model">${esc(p.model)}</span>
              ${p.metal ? `<span class="metal-tag">${esc(p.metal)}</span>` : ""}
              ${p.shortDescription ? `<p class="product-desc">${esc(p.shortDescription)}</p>` : ""}
            </div>
            ${p.image?.url ? `<img class="product-img" src="${esc(p.image.url)}" alt="${esc(p.model)}" loading="lazy" onerror="this.style.display='none'" />` : ""}
          </div>
          <div class="table-wrap">
            ${variantTable(p.variants)}
          </div>
        </div>
      `).join("");

      return `
        <div class="cat-section">
          <div class="cat-header">
            <span class="cat-name">${esc(cat.categoryName)}</span>
            <span class="cat-badge">${cat.products.length} item${cat.products.length !== 1 ? "s" : ""}</span>
          </div>
          <div class="products-grid">
            ${cards}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="brand-section">
        <div class="brand-header">
          ${brand.brandLogo ? `<img class="brand-logo" src="${esc(brand.brandLogo)}" alt="${esc(brand.brandName)}" onerror="this.style.display='none'" />` : ""}
          <span class="brand-name">${esc(brand.brandName)}</span>
        </div>
        ${catSections}
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Product Catalog – ${date}</title>
<style>
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* ── Fonts ── */
body {
  font-family: "Segoe UI", Arial, sans-serif;
  font-size: 11px;
  color: #1e293b;
  background: #fff;
  line-height: 1.45;
}

/* ── Print page setup ── */
@page {
  size: A4 portrait;
  margin: 12mm 10mm;
}
@page :first { margin: 0; }

/* ── Print button (screen only) ── */
.print-btn {
  position: fixed;
  bottom: 24px; right: 24px;
  background: #f59e0b;
  color: #0f172a;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(245,158,11,0.4);
  z-index: 9999;
}
.print-btn:hover { background: #d97706; }
@media print { .print-btn { display: none; } }

/* ══════════════════════════════════════════
   COVER PAGE
══════════════════════════════════════════ */
.cover {
  page-break-after: always;
  width: 210mm;
  height: 297mm;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 55%, #0c1220 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 60px 50px 40px;
  position: relative;
  overflow: hidden;
}

/* decorative circles */
.cover::before {
  content: "";
  position: absolute;
  top: -100px; right: -80px;
  width: 420px; height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%);
}
.cover::after {
  content: "";
  position: absolute;
  bottom: -120px; left: -80px;
  width: 380px; height: 380px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,179,237,0.1) 0%, transparent 70%);
}

.cover-eyebrow {
  font-size: 10px;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: #f59e0b;
  margin-bottom: 22px;
}
.cover-title {
  font-size: 58px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -2px;
  margin-bottom: 14px;
}
.cover-title span { color: #f59e0b; }
.cover-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.55);
  max-width: 340px;
  line-height: 1.6;
  margin-bottom: 48px;
}

.cover-stats {
  display: flex;
  gap: 36px;
  padding: 24px 0;
  border-top: 1px solid rgba(255,255,255,0.12);
  margin-top: auto;
}
.stat-val {
  font-size: 32px;
  font-weight: 800;
  color: #f59e0b;
  display: block;
  line-height: 1;
}
.stat-lbl {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
  display: block;
}

.cover-foot {
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cover-date { font-size: 11px; color: rgba(255,255,255,0.35); }
.cover-pill {
  background: #f59e0b;
  color: #0f172a;
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 20px;
}

/* ══════════════════════════════════════════
   BRAND HEADER
══════════════════════════════════════════ */
.brand-section { page-break-before: always; }
.brand-header {
  background: linear-gradient(90deg, #0f172a 0%, #1a3050 100%);
  color: #fff;
  padding: 26px 32px;
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 0;
}
.brand-logo {
  height: 44px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  background: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  flex-shrink: 0;
}
.brand-name {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
  text-transform: uppercase;
}

/* ══════════════════════════════════════════
   CATEGORY HEADER
══════════════════════════════════════════ */
.cat-section { margin-bottom: 20px; }
.cat-header {
  background: #f59e0b;
  color: #0f172a;
  padding: 9px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cat-name {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.cat-badge {
  font-size: 9px;
  font-weight: 700;
  background: rgba(0,0,0,0.13);
  padding: 2px 10px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

/* ══════════════════════════════════════════
   PRODUCTS GRID
══════════════════════════════════════════ */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding: 16px 32px;
}

/* ══════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════ */
.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  page-break-inside: avoid;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
}

.product-head {
  padding: 12px 14px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.product-meta { flex: 1; min-width: 0; }
.product-model {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.metal-tag {
  display: inline-block;
  background: #0f172a;
  color: #f59e0b;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  margin-bottom: 5px;
}
.product-desc {
  font-size: 9.5px;
  color: #64748b;
  margin-top: 3px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════
   VARIANT TABLE
══════════════════════════════════════════ */
.table-wrap { padding: 10px 14px 12px; overflow-x: auto; }

.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5px;
}
.vtable thead tr th {
  background: #0f172a;
  color: #fff;
  padding: 5px 8px;
  font-weight: 600;
  font-size: 9px;
  letter-spacing: 0.4px;
  text-align: center;
  white-space: nowrap;
}
.vtable thead tr th.corner { text-align: left; border-radius: 5px 0 0 0; }
.vtable thead tr th:first-child:not(.corner) { text-align: left; border-radius: 5px 0 0 0; }
.vtable thead tr th:last-child { border-radius: 0 5px 0 0; }

.vtable tbody tr:nth-child(odd)  td { background: #fff; }
.vtable tbody tr:nth-child(even) td { background: #f8fafc; }

.row-label {
  padding: 5px 8px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  min-width: 60px;
}
.price {
  padding: 5px 8px;
  text-align: center;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
}
.sku {
  padding: 5px 8px;
  font-size: 8.5px;
  color: #64748b;
}

.no-variants {
  font-size: 9.5px;
  color: #94a3b8;
  text-align: center;
  padding: 10px;
}

/* ══════════════════════════════════════════
   PRINT TWEAKS
══════════════════════════════════════════ */
@media print {
  body { font-size: 10px; }
  .brand-section { page-break-before: always; }
  .product-card { page-break-inside: avoid; }
  .products-grid { gap: 10px; padding: 12px 24px; }
}
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>

<!-- ══ COVER PAGE ══ -->
<div class="cover">
  <p class="cover-eyebrow">Official Price List</p>
  <h1 class="cover-title">Product<br/><span>Catalog</span></h1>
  <p class="cover-sub">Complete product range with MRP — Size &amp; Finish matrix by brand and category.</p>

  <div class="cover-stats">
    <div>
      <span class="stat-val">${totalBrands}</span>
      <span class="stat-lbl">Brand${totalBrands !== 1 ? "s" : ""}</span>
    </div>
    <div>
      <span class="stat-val">${totalCats}</span>
      <span class="stat-lbl">Categor${totalCats !== 1 ? "ies" : "y"}</span>
    </div>
    <div>
      <span class="stat-val">${totalProds}</span>
      <span class="stat-lbl">Product${totalProds !== 1 ? "s" : ""}</span>
    </div>
  </div>

  <div class="cover-foot">
    <span class="cover-date">Generated on ${date}</span>
    <span class="cover-pill">MRP Inclusive</span>
  </div>
</div>

<!-- ══ BRAND SECTIONS ══ -->
${brandSections}

</body>
</html>`;
}

/* ─────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────── */

export async function generateCatalogHtml(
  options: { brandId?: string; categoryId?: string } = {}
): Promise<string> {
  const catalog = await publicService.getCatalog(options) as Brand[];
  return buildHtml(catalog);
}
