module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const domain = req.query.domain;
  if (!domain) { res.status(400).json({ error: 'Missing domain' }); return; }

  try {
    // Brandfetch API v2 — returns all logo variants with types
    const resp = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!resp.ok) {
      res.status(resp.status).json({ error: 'Brandfetch API error: ' + resp.status });
      return;
    }

    const data = await resp.json();

    // Extract all logo URLs grouped by type
    const logos = [];
    for (const logo of (data.logos || [])) {
      const type = logo.type || 'unknown'; // "logo" = wordmark, "symbol" = icon, "icon" = app icon
      for (const format of (logo.formats || [])) {
        if (format.src) {
          logos.push({
            type,
            url: format.src,
            format: format.format || 'png',
            width: format.width || 0,
            height: format.height || 0,
            bg: format.background || null,
          });
        }
      }
    }

    // Extract brand colors
    const colors = [];
    for (const color of (data.colors || [])) {
      if (color.hex) colors.push(color.hex);
    }

    // Sort: "logo" type first (wordmark), then "symbol", then "icon"
    const typeOrder = { logo: 0, symbol: 1, icon: 2 };
    logos.sort((a, b) => (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3));

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
