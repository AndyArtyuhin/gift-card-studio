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
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Accept': 'application/json',
      }
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).json({ error: 'Brandfetch: ' + resp.status + ' ' + text.substring(0, 200) });
      return;
    }

    const data = await resp.json();

    // Extract all logo URLs grouped by type
    const logos = [];
    for (const logo of (data.logos || [])) {
      const type = logo.type || 'unknown';
      const theme = logo.theme || 'light';
      for (const format of (logo.formats || [])) {
        if (format.src) {
          logos.push({
            type,
            theme,
            url: format.src,
            format: format.format || 'png',
            width: format.width || 0,
            height: format.height || 0,
          });
        }
      }
    }

    // Extract brand colors
    const colors = [];
    for (const color of (data.colors || [])) {
      if (color.hex) colors.push(color.hex);
    }

    // Sort: wordmark ("logo") first, prefer PNG, prefer larger
    const typeOrder = { logo: 0, symbol: 1, icon: 2 };
    logos.sort((a, b) => {
      const td = (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3);
      if (td !== 0) return td;
      // Prefer png over svg
      if (a.format === 'png' && b.format !== 'png') return -1;
      if (b.format === 'png' && a.format !== 'png') return 1;
      // Prefer larger
      return (b.width || 0) - (a.width || 0);
    });

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
