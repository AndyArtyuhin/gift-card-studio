// api/proxy.js — Image proxy with CORS headers for canvas rendering
module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url param' });

  // Only allow trusted CDN domains
  const allowed = [
    'cdn.brandfetch.io',
    'img.logo.dev',
    'logo.clearbit.com',
  ];
  let hostname;
  try { hostname = new URL(url).hostname; } catch(e) { return res.status(400).json({ error: 'Invalid url' }); }
  if (!allowed.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return res.status(403).json({ error: 'Domain not allowed: ' + hostname });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GiftCardStudio/1.0' }
    });
    if (!response.ok) return res.status(response.status).end();

    const buf = await response.arrayBuffer();
    const ct = response.headers.get('content-type') || 'image/png';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', ct);
    res.send(Buffer.from(buf));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
