module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const q = req.query.q;
  if (!q) { res.status(400).json({ error: 'Missing q' }); return; }

  const KEY = process.env.GCSE_KEY || 'AIzaSyBm3WwTA4LqXKLhThRzm7AM50ouTpa_wOA';
  const CX  = process.env.GCSE_CX  || 'e69e669d98b834d46';

  let url = `https://www.googleapis.com/customsearch/v1?key=${KEY}&cx=${CX}&q=${encodeURIComponent(q)}&searchType=image&num=8`;
  if (req.query.start)          url += `&start=${req.query.start}`;
  if (req.query.imgColorType)   url += `&imgColorType=${req.query.imgColorType}`;
  if (req.query.imgDominantColor) url += `&imgDominantColor=${req.query.imgDominantColor}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
