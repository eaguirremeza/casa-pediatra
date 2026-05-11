const express = require("express");
const cors    = require("cors");
const cron    = require("node-cron");
const { fetchAndStore } = require("./dashbo");
const { readCache }     = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ── ENDPOINTS ─────────────────────────────────────────────────────

// GET /api/monthly — tabla histórica completa
app.get("/api/monthly", (req, res) => {
  try {
    const cache = readCache();
    res.json({ monthly: cache.monthly, lastUpdated: cache.lastUpdated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/data?start=2026-05-01&end=2026-05-09 — rango personalizado
app.get("/api/data", (req, res) => {
  try {
    const { start, end } = req.query;
    const cache = readCache();

    if (!start || !end) {
      return res.json({ monthly: cache.monthly, lastUpdated: cache.lastUpdated });
    }

    const result = aggregateRange(cache.daily || [], start, end);
    res.json({ ...result, lastUpdated: cache.lastUpdated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/refresh — actualización manual protegida con clave
app.post("/api/refresh", async (req, res) => {
  if (req.body.key !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }
  try {
    const result = await fetchAndStore();
    res.json({ ok: true, rows: result.daily.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /health — verificar que el servidor está activo
app.get("/health", (req, res) => {
  const cache = readCache();
  res.json({ status: "ok", lastUpdated: cache.lastUpdated, ts: new Date() });
});

// ── CRON — todos los días a las 10:00 UTC (07:00 Chile) ──────────
cron.schedule("0 10 * * *", async () => {
  console.log("[cron] Actualizando datos diarios...");
  try {
    await fetchAndStore();
    console.log("[cron] ✓ Listo");
  } catch (e) {
    console.error("[cron] Error:", e.message);
  }
});

// ── HELPER — agrega filas diarias por rango de fechas ────────────
function aggregateRange(daily, start, end) {
  const rows = daily.filter(r => r.date >= start && r.date <= end);
  const fb = { cost:0, clicks:0, imp:0, conv:0 };
  const gg = { cost:0, clicks:0, imp:0, conv:0 };

  if (rows.length > 0) {
    rows.forEach(r => {
      const dst = r.canal === "FACEBOOK" ? fb : gg;
      dst.cost   += r.cost;
      dst.clicks += r.clicks;
      dst.imp    += r.imp;
      dst.conv   += r.conv;
    });
  } else {
    const { INITIAL } = require("./db");
    const startD = new Date(start), endD = new Date(end);
    for (let cur = new Date(startD.getFullYear(), startD.getMonth(), 1);
         cur <= endD;
         cur.setMonth(cur.getMonth() + 1)) {
      const ym = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}`;
      const d = INITIAL.monthly[ym];
      if (!d) continue;
      const mEnd = new Date(cur.getFullYear(), cur.getMonth()+1, 0);
      const rangeStart = startD > cur ? startD : cur;
      const rangeEnd   = endD < mEnd ? endD : mEnd;
      const ratio = ((rangeEnd - rangeStart) / 86400000 + 1) / mEnd.getDate();
      ["fb","gg"].forEach(ch => {
        const src = d[ch], dst = ch==="fb" ? fb : gg;
        dst.cost   += src.cost   * ratio;
        dst.clicks += src.clicks * ratio;
        dst.imp    += src.imp    * ratio;
      dst.conv   += src.conv   * ratio;
    });
  }

  return { fb, gg, tot: {
    cost:   fb.cost   + gg.cost,
    clicks: fb.clicks + gg.clicks,
    imp:    fb.imp    + gg.imp,
    conv:   fb.conv   + gg.conv
  }};
}  

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✓ Backend corriendo en puerto ${PORT}`));
