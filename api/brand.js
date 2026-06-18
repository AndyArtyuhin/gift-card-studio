module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const domain = req.query.domain;
  if (!domain) { res.status(400).json({ error: 'Missing domain' }); return; }

  const API_KEY = 'MOn81RbooN5GNlGiHuFDvNIRQGyi0SrsypJ3krKHgQeggfTtHWrfsLim93mqOkRbBCUCxHq0ZP0o4VbyP7gxSQ';

  try {
    const resp = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`, {
      headers: { 'Authorization': 'Bearer ' + API_KEY, 'Accept': 'application/json' }
    });
    if (!resp.ok) { res.status(resp.status).json({ error: 'Brandfetch: ' + resp.status }); return; }
    const data = await resp.json();

    // PNG ONLY — no SVG
    const logos = [];
    for (const logo of (data.logos || [])) {
      for (const fmt of (logo.formats || [])) {
        if (fmt.src && fmt.format === 'png') {
          logos.push({
            type:   logo.type  || 'logo',
            theme:  logo.theme || 'light',
            url:    fmt.src,
            format: 'png',
            width:  fmt.width  || 0,
            height: fmt.height || 0,
          });
        }
      }
    }

    // Sort: wordmark first, largest PNG first within same type
    const order = { logo: 0, symbol: 1, icon: 2 };
    logos.sort((a, b) => {
      const td = (order[a.type] ?? 3) - (order[b.type] ?? 3);
      return td !== 0 ? td : (b.width - a.width);
    });

    const colors = (data.colors || []).map(c => c.hex).filter(Boolean);

    res.status(200).json({ name: data.name || domain, domain: domain, logos, colors });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
