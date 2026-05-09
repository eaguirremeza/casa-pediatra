const { writeCache, readCache } = require("./db");

const CLIENT_ID = "7805";
const FIELDS    = ["Canal","Fecha","Costo","Clicks","Impresiones","CTR","CPC","Eventos_Seleccionados"];

async function queryDashbo(startDate, endDate) {
  const url = `https://api.dashbo.io/v1/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.DASHBO_API_KEY}`
    },
    body: JSON.stringify({
      client_id:  CLIENT_ID,
      date_range: { startDate, endDate },
      fields:     FIELDS
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dashbo ${res.status}: ${txt}`);
  }

  const json = await res.json();
  return Array.isArray(json) ? json : (json.rows || []);
}

async function fetchAndStore() {
  const today      = new Date();
  const monthStart = fmtDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const todayStr   = fmtDate(today);

  console.log(`[dashbo] Consultando ${monthStart} → ${todayStr}`);
  const rows = await queryDashbo(monthStart, todayStr);

  const newRows = rows
    .map(r => ({
      date:   r.Fecha         || r.fecha,
      canal:  r.Canal         || r.canal,
      cost:   Number(r.Costo  || r.costo  || 0),
      clicks: Number(r.Clicks || r.clicks || 0),
      imp:    Number(r.Impresiones || r.impresiones || 0),
      conv:   Number(r.Eventos_Seleccionados || 0),
      cpc:    Number(r.CPC || r.cpc || 0),
      ctr:    Number(r.CTR || r.ctr || 0)
    }))
    .filter(r => r.date && (r.canal === "FACEBOOK" || r.canal === "GOOGLE"));

  const cache  = readCache();
  const ym     = monthStart.slice(0, 7);
  const oldRows = (cache.daily || []).filter(r => !r.date.startsWith(ym));
  const daily   = [...oldRows, ...newRows].sort((a, b) => a.date.localeCompare(b.date));

  const monthly      = buildMonthly(daily);
  const finalMonthly = { ...cache.monthly, ...monthly };

  writeCache({ daily, monthly: finalMonthly, lastUpdated: todayStr });
  console.log(`[dashbo] ✓ ${newRows.length} filas guardadas`);
  return { daily, monthly: finalMonthly };
}

function buildMonthly(daily) {
  const map = {};
  daily.forEach(r => {
    const ym = r.date.slice(0, 7);
    if (!map[ym]) map[ym] = {
      fb: { cost:0, clicks:0, imp:0, conv:0 },
      gg: { cost:0, clicks:0, imp:0, conv:0 }
    };
    const dst = r.canal === "FACEBOOK" ? map[ym].fb : map[ym].gg;
    dst.cost   += r.cost;
    dst.clicks += r.clicks;
    dst.imp    += r.imp;
    dst.conv   += r.conv;
  });
  return map;
}

const pad     = n => String(n).padStart(2, "0");
const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

module.exports = { fetchAndStore, queryDashbo };
