export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { q, start, imgColorType, imgDominantColor } = req.query;
  if (!q) { res.status(400).json({ error: 'Missing q parameter' }); return; }

  const GCSE_KEY = process.env.GCSE_KEY || 'AIzaSyBm3WwTA4LqXKLhThRzm7AM50ouTpa_wOA';
  const GCSE_CX  = process.env.GCSE_CX  || 'e69e669d98b834d46';

  let url = `https://www.googleapis.com/customsearch/v1?key=${GCSE_KEY}&cx=${GCSE_CX}&q=${encodeURIComponent(q)}&searchType=image&num=6`;
  if (start) url += `&start=${start}`;
  if (imgColorType) url += `&imgColorType=${imgColorType}`;
  if (imgDominantColor) url += `&imgDominantColor=${imgDominantColor}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
