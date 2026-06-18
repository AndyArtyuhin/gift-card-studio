module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const domain = req.query.domain;
  if (!domain) { res.status(400).json({ error: 'Missing domain' }); return; }

  const API_KEY = 'MOn81RbooN5GNlGiHuFDvNIRQGyi0SrsypJ3krKHgQeggfTtHWrfsLim93mqOkRbBCUCxHq0ZP0o4VbyP7gxSQ';

  try {
    const resp = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`, {
      headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
    });
    if (!resp.ok) {
      res.status(resp.status).json({ error: 'Brandfetch: ' + resp.status });
      return;
    }
    const data = await resp.json();

    // Extract logos, sorted: wordmark first, then symbol, then icon
    const typeOrder = { logo: 0, symbol: 1, icon: 2 };
    const allLogos = [];
    for (const logo of (data.logos || [])) {
      const type  = logo.type  || 'unknown';
      const theme = logo.theme || 'light';
      for (const fmt of (logo.formats || [])) {
        if (!fmt.src) continue;
        allLogos.push({ type, theme, url: fmt.src, format: fmt.format || 'png', width: fmt.width || 0, height: fmt.height || 0 });
      }
    }
    allLogos.sort((a, b) => {
      const td = (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3);
      if (td !== 0) return td;
      // PNG before SVG within same type
      if (a.format === 'png' && b.format !== 'png') return -1;
      if (b.format === 'png' && a.format !== 'png') return 1;
      return (b.width || 0) - (a.width || 0);
    });

    // Convert SVG logos to base64 data URLs so canvas can render them
    const logos = await Promise.all(allLogos.map(async (l) => {
      if (l.format === 'svg') {
        try {
          const r = await fetch(l.url);
          const svgText = await r.text();
          const b64 = Buffer.from(svgText).toString('base64');
          return { ...l, url: 'data:image/svg+xml;base64,' + b64, originalUrl: l.url };
        } catch(e) {
          return l; // keep original URL on error
        }
      }
      return l;
    }));

    const colors = (data.colors || []).map(c => c.hex).filter(Boolean);

    res.status(200).json({
      name: data.name || domain,
      domain: data.domain || domain,
      logos,
      colors,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
