export async function fetchNews() {
  try {
    const res = await fetch('https://finnhub.io/api/v1/news?category=forex&token=YOUR_FINNHUB_KEY');
    const data = await res.json();
    return data.slice(0, 10).map(item => ({
      id: item.id,
      title: { en: item.headline, ar: item.headline }, // يمكنك إضافة ترجمة لاحقاً
      source: item.source,
      timeMin: Math.floor((Date.now() / 1000 - item.datetime) / 60),
      sentiment: item.sentiment || 'neutral',
      pairs: item.related?.split(',') || [],
      summary: { en: item.summary, ar: item.summary },
    }));
  } catch {
    return []; // أو الرجوع للأخبار الافتراضية
  }
}