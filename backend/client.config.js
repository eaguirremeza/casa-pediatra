// ─────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DEL CLIENTE
//  Este es el ÚNICO archivo que debes editar al crear un dashboard nuevo.
//  Todo lo demás se adapta automáticamente.
// ─────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {

  // ── IDENTIDAD ──────────────────────────────────────────────────
  id:          "7805",                  // ID en Dashbo
  name:        "Casa Pediatra",         // Nombre que aparece en el dashboard
  agency:      "Tu Agencia Digital",    // Tu nombre como agencia
  logoUrl:     "/logo.png",             // Logo del cliente (en /public/)
  faviconUrl:  "/favicon.ico",

  // ── MARCA / COLORES ────────────────────────────────────────────
  colors: {
    primary:   "#22d3ee",   // color principal (headers, selección)
    secondary: "#3b82f6",   // color secundario (botones)
    meta:      "#4f8ef7",   // color Meta Ads
    google:    "#f97316",   // color Google Ads
  },

  // ── CANALES ACTIVOS ────────────────────────────────────────────
  // Solo mostrar los canales que usa este cliente
  channels: {
    meta:   true,
    google: true,
    tiktok: false,
  },

  // ── MÉTRICAS VISIBLES ─────────────────────────────────────────
  // Personalizar qué KPIs aparecen en el resumen
  kpis: ["cost", "clicks", "impressions", "cpc", "ctr", "conversions", "cpa"],

  // ── DATOS HISTÓRICOS (seed inicial) ───────────────────────────
  // Se sobreescribe automáticamente con datos reales de Dashbo
  historicalSeed: {
    "2026-01": {
      fb: { cost:386236, clicks:12871, imp:549977, conv:3980 },
      gg: { cost:516416, clicks:2611,  imp:28100,  conv:1155 }
    },
    "2026-02": {
      fb: { cost:565950, clicks:8165,  imp:405452, conv:1535 },
      gg: { cost:138282, clicks:826,   imp:5521,   conv:870  }
    },
    "2026-03": {
      fb: { cost:541966, clicks:7194,  imp:377916, conv:1927 },
      gg: { cost:256318, clicks:1522,  imp:10149,  conv:869  }
    },
    "2026-04": {
      fb: { cost:682805, clicks:8348,  imp:551453, conv:3489 },
      gg: { cost:425241, clicks:2283,  imp:22822,  conv:1000 }
    },
    "2026-05": {
      fb: { cost:30535, clicks:278, imp:16656, conv:85  },
      gg: { cost:73332, clicks:679, imp:21402, conv:180 }
    }
  },

  // ── ZONA HORARIA ───────────────────────────────────────────────
  timezone: "America/Santiago",

  // ── CRON — hora de actualización diaria ───────────────────────
  // "0 10 * * *" = 10:00 UTC = 07:00 Chile
  cronSchedule: "0 10 * * *",

};

module.exports = CLIENT_CONFIG;
if (typeof module !== "undefined") module.exports = CLIENT_CONFIG;
