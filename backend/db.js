const fs   = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "data", "cache.json");

const INITIAL = {
  lastUpdated: "2026-05-09",
  monthly: {
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
  daily: []
};

function readCache() {
  try {
    if (!fs.existsSync(FILE)) return INITIAL;
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return INITIAL;
  }
}

function writeCache(data) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = { readCache, writeCache, INITIAL };
