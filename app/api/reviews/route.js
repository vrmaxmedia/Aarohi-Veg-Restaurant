import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/* =====================================================================
   SETTINGS & ENGINE CONFIGURATION
   ===================================================================== */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const PARALLEL_CALLS = 2;      // Sends 2 requests at once, picks the first successful one
const MAX_ROUNDS = 2;          // Retries if both fail
const CALL_TIMEOUT_MS = 12000; // 12 seconds timeout per call
const MAX_OUTPUT_TOKENS = 300;
const HISTORY_SIZE = 60;       // Remembers last 60 reviews to prevent repetition

/* =====================================================================
   BUSINESS PACK (Aarohi Veg Restaurant - Daryaganj)
   ===================================================================== */
const OWNER_NAME = process.env.OWNER_NAME || 'Aarohi Veg Restaurant';

// Restaurant Food Items / Specialties (weighted for variety)
const FOOD_SERIES = [
  { n: 'North Indian Gravy', w: 8, variants: [['Dal Makhani', 4], ['Shahi Paneer', 3], ['Kadai Paneer', 2], ['Mix Veg', 2]] },
  { n: 'Breads & Rice', w: 5, variants: [['Butter Naan', 3], ['Garlic Naan', 2], ['Veg Biryani', 2]] },
  { n: 'Snacks & Starters', w: 6, variants: [['Paneer Tikka', 3], ['Hara Bhara Kebab', 2], ['Spring Rolls', 2]] },
  { n: 'Thali & Combos', w: 5, variants: [['Special Veg Thali', 4], ['Deluxe Thali', 2]] },
];

const SEO_KEYWORDS = [
  'best vegetarian restaurant in Daryaganj',
  'pure veg food old delhi',
  'family restaurant near netaji subhash marg',
  'late night veg food delhi',
  'pocket friendly veg thali',
  'aarohi veg restaurant daryaganj',
  'top rated veg restaurant in old delhi',
  'best dal makhani in daryaganj',
];

// Topics for random generation if no specific chip is selected
const TOPICS = {
  food: {
    id: 'food',
    text: 'the food quality: very tasty, fresh vegetarian food, full of rich flavors',
    must: /food|taste|tasty|fresh|delicious|flavor|swad|khana|veg|thali|paneer/i,
  },
  ambience: {
    id: 'ambience',
    text: 'the ambience: comfortable red-cushioned seating, neat modern interior, relaxed vibe',
    must: /ambience|seat|interior|vibe|atmosphere|comfortable|decor|red/i,
  },
  service: {
    id: 'service',
    text: 'the staff and service: polite friendly staff, quick and attentive service',
    must: /staff|service|polite|quick|attentive|behavior|waiter|friendly/i,
  },
  value: {
    id: 'value',
    text: 'value for money: fair pocket-friendly pricing, good portions',
    must: /value|price|pocket|money|budget|sasta|portion|bill|affordable/i,
  },
  family: {
    id: 'family',
    text: 'family dining: great place for family dinners and group meals',
    must: /family|group|dinner|celebration|kids|together|parents/i,
  },
  parking: {
    id: 'parking',
    text: 'parking and location: easy to find in Daryaganj with on-site parking',
    must: /parking|location|daryaganj|find|park|marg|subhash|road/i,
  },
  takeaway: {
    id: 'takeaway',
    text: 'takeaway and delivery: neat packaging, food arrives fresh and hot',
    must: /takeaway|order|pack|delivery|online|parcel|home/i,
  },
  hygiene: {
    id: 'hygiene',
    text: 'cleanliness and hygiene: very clean tables, neat and hygienic surroundings',
    must: /clean|hygiene|saaf|safai|neat|maintain|table/i,
  },
  late: {
    id: 'late',
    text: 'late night dining: open late till 1 am, great for late dinner',
    must: /late|night|1 am|one am|midnight|raat|open|dinner/i,
  }
};

const ALL_TOPICS = ['food', 'ambience', 'service', 'value', 'family', 'parking', 'takeaway', 'hygiene', 'late'];

// Chips matched exactly with frontend labels
const CHIPS = {
  'Food & Taste': { id: 'chip_food', text: 'the vegetarian food is very tasty, fresh, and perfectly cooked', must: /food|taste|tasty|fresh|delicious|flavor|swad|khana|veg/i },
  'Ambience & Seating': { id: 'chip_ambience', text: 'comfortable red-cushioned seating and a neat modern interior', must: /ambience|seat|interior|vibe|atmosphere|comfortable|decor/i },
  'Staff & Service': { id: 'chip_service', text: 'polite staff and very quick, attentive service', must: /staff|service|polite|quick|attentive|behavior|friendly/i },
  'Value for Money': { id: 'chip_value', text: 'pocket-friendly pricing and great value for money', must: /value|price|pocket|money|budget|sasta|bill/i },
  'Family & Groups': { id: 'chip_family', text: 'a wonderful place for family dinners and group meals', must: /family|group|dinner|celebration|kids/i },
  'Parking & Location': { id: 'chip_parking', text: 'easy to find in Daryaganj with convenient on-site parking', must: /parking|location|daryaganj|find|park/i },
  'Takeaway & Order': { id: 'chip_takeaway', text: 'neat packaging and fresh food for takeaway/online orders', must: /takeaway|order|pack|delivery|online|parcel/i },
  'Clean & Hygienic': { id: 'chip_hygiene', text: 'the restaurant is very clean, hygienic, and well maintained', must: /clean|hygiene|saaf|safai|neat/i },
};

// Customer Personas
const PERSONAS = [
  { id: 'local_foodie', text: 'a local Delhi foodie who loves authentic pure veg North Indian food' },
  { id: 'family_person', text: 'a family person who visited with kids and parents for a nice weekend dinner' },
  { id: 'office_worker', text: 'an office worker looking for a quick, tasty, and pocket-friendly meal' },
  { id: 'late_night', text: 'someone who visited late night for dinner since the place is open till 1 AM' },
  { id: 'takeaway_customer', text: 'a customer who ordered takeaway and was impressed by the packaging' },
  { id: 'tourist', text: 'someone visiting Old Delhi/Daryaganj for the first time who stumbled upon this neat restaurant' },
  { id: 'budget_diner', text: 'a budget-conscious diner who found the 200-400rs per person range very reasonable' },
];

const WRITING_STYLES = [
  'neat spelling and proper grammar',
  'casual WhatsApp-style typing, relaxed',
  'all small letters, casual typing, no capital letters',
  'simple and slightly rough, one tiny spelling slip is fine',
];

const HINGLISH_LEVELS = [
  'mostly Hindi words, only a few English words like food, service, parking',
  'half Hindi, half English words',
  'Hindi grammar but many common English words mixed in',
];

const OPENERS = [
  'start by mentioning what food you ordered',
  'start with how the restaurant looked inside (red seating, clean)',
  'start with how you feel about the prices and value',
  'start with the service and staff behavior',
  'start in the middle of a thought, casually',
  'start by saying how you found this place in Daryaganj',
  'start with a simple statement about the whole experience',
];

const ENDINGS = [
  'end with a small thanks or recommendation to visit',
  'end by highly recommending their specific thali or dish',
  'end by saying you will come back again with family',
  'end with a short plain remark about the parking or location ease',
  'just stop naturally after your last point, no wrap-up line',
];

const BUYER_LINES = [
  'You visited for dinner.',
  'You visited for lunch.',
  'You ordered a takeaway.',
  'You went with your family.',
  'You went for a late night meal.',
];

const EXAMPLES = {
  ENGLISH: [
    'Visited Aarohi Veg Restaurant in Daryaganj for dinner, the food was absolutely delicious and the seating was very comfortable.',
    'Best vegetarian food in Old Delhi, tried their Dal Makhani and it was perfect, very pocket friendly too.',
    'Great place for a family dinner, they have good parking which is rare in Daryaganj, staff is very polite.',
    'Ordered takeaway from here, the packaging was neat and the food arrived hot, amazing value for money.',
  ],
  HINGLISH: [
    'daryaganj me pure veg khane ke liye best jagah hai, food bahut tasty tha aur price bhi kaafi pocket friendly hai.',
    'family ke sath dinner ke liye gaye the, red cushions wali seating bahut comfortable hai aur safai bhi acchi thi.',
    'late night open rehta hai toh raat me thali khane gaye the, parking mil gayi aaram se, service bhi fast thi.',
    'paneer tikka aur dal makhani try kiya, swad ekdum badhiya tha aur staff ka behavior bahut polite tha.',
  ],
};

/* =====================================================================
   HELPER FUNCTIONS
   ===================================================================== */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.w) <= 0) return i;
  }
  return items[0];
}

function pickFoodItem(recentFoods) {
  const flat = [];
  for (const sr of FOOD_SERIES) {
    const total = sr.variants.reduce((a, v) => a + v[1], 0);
    for (const [name, vw] of sr.variants) {
      if (recentFoods.includes(name)) continue;
      flat.push({ name, series: sr.n, w: sr.w * (vw / total) });
    }
  }
  return pickWeighted(flat);
}

const LENGTHS = [
  { w: 12, lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 16, lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 30, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 28, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
  { w: 14, lines: 5, min: 40, max: 52, rule: 'FIVE lines, 42 to 50 words' },
];

function chooseLength(recent, minLines = 1) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  let pool = LENGTHS.filter((x) => x.lines >= minLines);

  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool);
}

function choosePersona(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-4);
  const pool = PERSONAS.filter((v) => !last.includes(v.id));
  return pick(pool.length ? pool : PERSONAS);
}

function chooseTopic(recent) {
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-2);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

function chosenChips(body) {
  const labels = Array.isArray(body.selectedChips) ? body.selectedChips : [];
  return labels.filter((l) => typeof l === 'string' && CHIPS[l]).slice(0, 3).map((l) => ({ label: l, ...CHIPS[l] }));
}

function chooseFrom(list, key, recent, n = 3) {
  const last = recent.map((r) => r[key]).filter((v) => v !== undefined && v !== null).slice(-n);
  const pool = list.filter((x) => !last.includes(x));
  return pick(pool.length ? pool : list);
}

const BANNED_OPENINGS = [
  'Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'The staff here',
  'Outstanding', 'Fantastic', 'Wonderful', 'Perfect', 'Must visit', 'Trust me', 'Wow', 'Absolutely', 'Really'
];

const AI_PHRASES = /seamless|hassle[- ]free|top[- ]notch|look no further|go-to|game[- ]changer|one[- ]stop|unparalleled|exceptional|impeccable|commendable|must[- ]visit|highly recommended|hands down|truly|delighted|kudos|paisa vasool|—|–/i;

const DANGLING = new Set([
  'to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'toh',
  'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'that',
  'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki',
]);

const HINDI_WORDS = new Set([
  'hai', 'hain', 'nahi', 'nahin', 'bahut', 'bohot', 'bhot', 'mera', 'meri', 'mere', 'mujhe', 'hume',
  'aur', 'ki', 'ke', 'ka', 'ko', 'se', 'par', 'pe', 'tha', 'thi', 'kiya', 'mila', 'mil', 'gaya', 'gayi',
  'liya', 'wala', 'wale', 'jo', 'kaafi', 'accha', 'acha', 'achha', 'sach', 'yahan', 'yaha', 'kar', 'karke', 'raha',
  'rahe', 'rahi', 'laga', 'lagi', 'bilkul', 'ekdum', 'sab', 'kuch', 'koi', 'phir', 'fir', 'bhi', 'toh', 'lekin',
  'isliye', 'abhi', 'dekh', 'dekha', 'diya', 'dikhaya', 'samjhaya', 'sahi', 'dukaan', 'dukan', 'aap', 'aapne',
  'paise', 'kam', 'jyada', 'zyada', 'badhiya', 'mast', 'yaar', 'mein', 'yeh', 'ye', 'woh', 'wo', 'ne', 'hu', 'hun', 'tak', 'wahan', 'sabse', 'swad', 'khana', 'bhai', 'safai', 'mahaul', 'zayka'
]);

const HISTORY = [];
const HITS = new Map();

const openingOf = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
const wordSet = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2));

function tooSimilar(text, recentOpenings) {
  const open = openingOf(text);
  if (recentOpenings.includes(open)) return true;
  const ws = wordSet(text);
  for (const h of HISTORY) {
    if (h.open === open) return true;
    let inter = 0;
    for (const w of ws) if (h.ws.has(w)) inter++;
    const union = ws.size + h.ws.size - inter || 1;
    if (inter / union > 0.45) return true;
  }
  return false;
}

function remember(text) {
  HISTORY.push({ open: openingOf(text), ws: wordSet(text) });
  while (HISTORY.length > HISTORY_SIZE) HISTORY.shift();
}

function rateLimited(request) {
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < 5 * 60 * 1000);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 2000) {
    for (const [k, v] of HITS) if (!v.some((t) => now - t < 5 * 60 * 1000)) HITS.delete(k);
  }
  return arr.length > 25;
}

function cleanReview(text) {
  return text
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, ' ')
    .replace(/\.\s+/g, ', ')
    .replace(/\.+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
}

function fixCutOff(text) {
  let parts = text.trim().replace(/[,\-\s]+$/g, '').split(/\s+/);
  while (parts.length > 6) {
    const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    if (!DANGLING.has(last)) break;
    parts.pop();
    parts = parts.join(' ').replace(/[,\-\s]+$/g, '').split(/\s+/);
  }
  return parts.join(' ');
}

function looksCutOff(text) {
  const last = text.split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  return DANGLING.has(last) || /[,\-]$/.test(text.trim());
}

function hindiCount(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => HINDI_WORDS.has(w)).length;
}

function languageOk(text, language, words) {
  const h = hindiCount(text);
  if (language === 'HINGLISH') return h >= Math.max(3, Math.floor(words * 0.2));
  return h <= 2;
}

function startsBanned(text) {
  const t = text.trim().toLowerCase();
  return BANNED_OPENINGS.some((b) => t.startsWith(b.toLowerCase()));
}

/* =====================================================================
   PROMPT BUILDER
   ===================================================================== */
function buildPrompt(body, recent) {
  const language = body.language === 'HINGLISH' ? 'HINGLISH' : 'ENGLISH';
  const businessName = String(body.businessName || 'Aarohi Veg Restaurant').slice(0, 120);
  const category = String(body.category || 'Vegetarian Restaurant').slice(0, 200);
  const city = String(body.city || 'Daryaganj, Delhi').slice(0, 120);

  const recentFoods = recent.map((r) => r.foodItem).filter(Boolean).slice(-3);
  let chips = chosenChips(body);
  const picked = chance(0.5) ? pickFoodItem(recentFoods) : null;
  const foodItem = picked ? picked.name : null;

  // Minimum lines based on how many chips were selected
  const minLines = chips.length >= 3 ? 4 : chips.length === 2 ? 3 : 1;
  const length = chooseLength(recent, minLines);
  const persona = choosePersona(recent);
  
  const topic = chips.length
    ? { id: chips[0].id, text: chips[0].text, must: chips[0].must }
    : chooseTopic(recent);
  
  const extraChips = chips.slice(1);
  const opener = chooseFrom(OPENERS, 'opener', recent, 3);
  const ending = chooseFrom(ENDINGS, 'ending', recent, 2);
  const style = pick(WRITING_STYLES);
  const hinglishLevel = pick(HINGLISH_LEVELS);
  const buyerLine = chance(0.6) ? pick(BUYER_LINES) + ' ' : '';

  const longEnough = length.lines >= 3;
  const secondPoint = !extraChips.length && length.lines >= 4 && chance(0.5);
  const mentionName = chance(0.4);
  const useEmoji = chance(0.05);

  const recentSeo = recent.map((r) => r.seo).filter(Boolean).slice(-8);
  const seoPool = SEO_KEYWORDS.filter((k) => !recentSeo.includes(k));
  const seo = chance(0.35) ? pick(seoPool.length ? seoPool : SEO_KEYWORDS) : null;

  const languageBlock =
    language === 'HINGLISH'
      ? `LANGUAGE (MOST IMPORTANT): Write in HINGLISH = Hindi sentences typed in English/Roman letters, like a Delhi local on WhatsApp. Level: ${hinglishLevel}. Grammar must be Hindi (hai, tha, khaya, gaya, swad, bahut, aur etc.). Words like food, parking, restaurant, service can stay in English. Never write a full English sentence. Never use Devanagari.`
      : `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian diner. Do not use Hindi words.`;

  const examples = shuffle(EXAMPLES[language]).slice(0, 3).map((e) => `- ${e}`).join('\n');

  const prompt = `${languageBlock}

You are ${persona.text}. ${buyerLine}You are writing a Google Maps review for this Restaurant.
Business: ${businessName} (${city}) | ${category}

Tone samples from other diners (only for feel, never copy words or structure):
${examples}

THIS REVIEW:
- Main topic: ${topic.text}. The review must clearly be about this.
${extraChips.length ? `- ALSO naturally cover these points (all of them): ${extraChips.map((c) => c.text).join('; ')}.` : secondPoint ? '- You may add one small extra point at the end, from any other area (like parking or ambience).' : '- Stick to the main topic only.'}
- Writing style: ${style}.
- Opening: ${opener}.
${longEnough ? `- Ending: ${ending}.` : ''}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention "Aarohi Veg" or "Aarohi" once naturally.` : '- Do not repeat the restaurant name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}
${foodItem ? `- You may mention that you ordered or tried the "${foodItem}".` : ''}
${useEmoji ? '- One food/happy emoji at the very end is allowed.' : '- No emojis.'}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real customer, not an advertisement. No hashtags, slogans, keyword stuffing, no dashes. Avoid polished marketing words (seamless, top-notch, exceptional).
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`.replace(/\n{3,}/g, '\n\n').replace(/\n\n(- )/g, '\n$1');

  return { prompt, length, persona, topic, extraChips, opener, ending, seo, foodItem, language };
}

/* =====================================================================
   API HANDLER
   ===================================================================== */
async function callGemini(apiKey, payload, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }
  );
  const data = await res.json();
  return { res, data };
}

async function attempt(apiKey, body, recent, signal) {
  const built = buildPrompt(body, recent);
  const { prompt, length, persona, topic, extraChips, opener, ending, seo, foodItem, language } = built;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Write the restaurant review now.` }] }],
    systemInstruction: { parts: [{ text: prompt }] },
    generationConfig: {
      temperature: 1.0, // High creativity
      topP: 0.95,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    let { res, data } = await callGemini(apiKey, payload, signal);

    // Fallback if thinking config isn't supported on current model tier
    if (!res.ok && /thinking/i.test(data?.error?.message || '')) {
      delete payload.generationConfig.thinkingConfig;
      ({ res, data } = await callGemini(apiKey, payload, signal));
    }
    
    if (!res.ok) return { ok: false, error: data?.error?.message || 'Gemini API request failed.' };

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const raw = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
    const review = fixCutOff(cleanReview(raw));
    const words = review.split(/\s+/).filter(Boolean).length;

    // Strict Validation
    if (!review) return { ok: false, error: 'Empty response from Gemini.' };
    if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, error: 'Response was cut off.' };
    if (looksCutOff(review)) return { ok: false, error: 'Review ended mid-sentence.' };
    if (words > length.max + 8) return { ok: false, error: 'Review too long.' };
    if (words < Math.floor(length.min * 0.75)) return { ok: false, error: 'Review too short.' };
    if (/[ऀ-ॿ]/.test(review)) return { ok: false, error: 'Devanagari used.' };
    if (AI_PHRASES.test(review)) return { ok: false, error: 'Robotic phrase used.' };
    if (startsBanned(review)) return { ok: false, error: 'Banned opening used.' };
    if (!languageOk(review, language, words)) return { ok: false, error: 'Wrong language style.' };
    
    // Topic Checks
    if (!topic.must.test(review)) return { ok: false, error: 'Review missed the selected primary topic.' };
    if (extraChips.some((c) => !c.must.test(review))) return { ok: false, error: 'Review missed a selected extra keyword.' };
    
    // Similarity Check
    const recentOpenings = recent.map((r) => r.open).filter(Boolean);
    if (tooSimilar(review, recentOpenings)) return { ok: false, error: 'Too similar to an earlier review.' };

    return {
      ok: true,
      review,
      meta: {
        lines: length.lines,
        voice: persona.id,
        topic: topic.id,
        opener,
        ending,
        seo: seo || null,
        foodItem: foodItem || null,
        open: openingOf(review),
      },
    };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'aborted' : e?.message || 'Request failed.', aborted: e?.name === 'AbortError' };
  }
}

function firstValid(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length;
    let firstError = null;
    for (const t of tasks) {
      t.then((r) => {
        if (r.ok) return resolve(r);
        if (!r.aborted && !firstError) firstError = r.error;
        if (--pending === 0) resolve({ ok: false, error: firstError || 'Failed to generate review draft.' });
      });
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }
    if (rateLimited(request)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : [])
      .filter((r) => r && typeof r === 'object')
      .slice(-6);

    let lastError = 'Failed to generate review draft.';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

      const winner = await firstValid(
        Array.from({ length: PARALLEL_CALLS }, () => attempt(apiKey, body, recent, controller.signal))
      );

      clearTimeout(timer);
      controller.abort();

      if (winner.ok) {
        remember(winner.review);
        return NextResponse.json({ review: winner.review, meta: winner.meta });
      }
      lastError = winner.error;
    }

    throw new Error(lastError);
  } catch (error) {
    console.error('API Review Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate review draft.' },
      { status: 500 }
    );
  }
}
