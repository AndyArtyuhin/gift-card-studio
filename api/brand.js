module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const domain = req.query.domain;
  if (!domain) { res.status(400).json({ error: 'Missing domain' }); return; }

  const API_KEY = 'CbnrTXDAqIGm0nWoDqGuSweQi-OMAOZzZV3OIdSWJKN4EQWyjSXAuCKg5kxYV23qcJZQoWHwyD0o98TtrV06jQ';

  try {
    const resp = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`, {
      headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
    });
    if (!resp.ok) { res.status(resp.status).json({ error: 'Brandfetch: ' + resp.status }); return; }
    const data = await resp.json();

    const rawLogos = [];
    for (const logo of (data.logos || [])) {
      for (const fmt of (logo.formats || [])) {
        if (!fmt.src) continue;
        rawLogos.push({
          type:   logo.type  || 'logo',
          theme:  logo.theme || 'light',
          url:    fmt.src,
          format: fmt.format || 'png',
          width:  fmt.width  || 0,
          height: fmt.height || 0,
        });
      }
    }

    const order = { logo: 0, symbol: 1, icon: 2 };
    rawLogos.sort((a, b) => {
      const td = (order[a.type] ?? 3) - (order[b.type] ?? 3);
      return td !== 0 ? td : (b.width - a.width);
    });

    // Download each logo and return as base64 data URL (bypasses CORS)
    const logos = await Promise.all(rawLogos.map(async (l) => {
      try {
        const imgResp = await fetch(l.url, {
          headers: { 'Authorization': 'Bearer ' + API_KEY }
        });
        if (!imgResp.ok) return null;
        const buf = await imgResp.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        const mime = l.format === 'svg' ? 'image/svg+xml' : 'image/png';
        return { ...l, url: `data:${mime};base64,${b64}` };
      } catch(e) { return null; }
    }));

    const colors = (data.colors || []).map(c => c.hex).filter(Boolean);
    res.status(200).json({ name: data.name || domain, domain, logos: logos.filter(Boolean), colors });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
