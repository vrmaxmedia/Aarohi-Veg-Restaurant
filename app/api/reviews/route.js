import { NextResponse } from 'next/server';

const MODEL = 'gemini-3.5-flash';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.w) <= 0) return i;
  }
  return items[0];
}

// recent me jo id aa chuki hai usse bachke pick karo
function pickAvoiding(arr, recentIds) {
  const pool = arr.filter((x) => !recentIds.includes(x.id));
  return pick(pool.length ? pool : arr);
}

// ~8 words = 1 line on phone
const LENGTHS = [
  { w: 8,  lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 10, lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 32, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 32, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
  { w: 18, lines: 5, min: 40, max: 52, rule: 'FIVE lines, 42 to 50 words' },
];

function chooseLength(recent) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  const l3 = lens[lens.length - 3];
  let pool = LENGTHS;

  const mid = (n) => n === 3 || n === 4;
  if (lens.length >= 3 && mid(l1) && mid(l2) && mid(l3)) {
    pool = LENGTHS.filter((x) => !mid(x.lines)); // 1, 2 ya 5
  } else if (l1 && !mid(l1)) {
    pool = LENGTHS.filter((x) => mid(x.lines)); // off-pattern ke baad wapas 3-4
  }
  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool);
}

// ---------- WHO is writing ----------
const VOICES = [
  { id: 'desi', text: 'a simple desi Delhi person, speaks plain and rough, short sentences, no fancy words, a little loose grammar is fine' },
  { id: 'family', text: 'a middle class family person who came for a family dinner, practical and careful with money, honest and simple' },
  { id: 'professional', text: 'an educated working professional, polished and clear, well-structured sentences, calm and respectful tone' },
  { id: 'young', text: 'a college-age youngster who came with friends, casual and slangy, quick typing style, energetic' },
  { id: 'uncle', text: 'an older respectful person (uncle ji), polite, simple words, thanks the staff warmly' },
  { id: 'blunt', text: 'a straightforward no-nonsense person, few words, says only what mattered to him' },
  { id: 'couple', text: 'someone who came on a relaxed dinner outing with their partner, warm and a bit romantic but not cheesy' },
  { id: 'colleagues', text: 'someone who came with office colleagues for a group meal, practical, mentions the group naturally' },
  { id: 'visitor', text: 'someone from another part of Delhi who travelled to this area for the food, mentions it was worth the trip without exaggeration' },
  { id: 'parents', text: 'someone who brought their parents or elders along, cares about comfort, patience of staff and simple tasty food' },
  { id: 'foodie', text: 'a casual food lover who notices small details about taste and how the food was served, but never sounds like a critic' },
  { id: 'first', text: 'a first-time visitor who had no expectations and was pleasantly surprised, honest and relaxed' },
];

function chooseVoice(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-4);
  return pickAvoiding(VOICES, last);
}

// ---------- HOW the review is shaped ----------
const STYLES = [
  { id: 'plain', text: 'plain and direct: just say what you liked, no flourish, no build-up' },
  { id: 'story', text: 'a tiny story of the visit: why you came, what happened, how it ended' },
  { id: 'detail', text: 'focus on ONE small specific detail that you noticed and liked, then stop' },
  { id: 'emotion', text: 'focus on how the visit felt, the mood and comfort, with only a little about the food' },
  { id: 'tell-friends', text: 'the kind of thing you would tell a friend, casual, ends with a mild natural suggestion (never "must visit" or "highly recommended")' },
  { id: 'contrast', text: 'compare it casually with ordinary places or home food in general (NEVER name any other restaurant), saying why this felt better' },
  { id: 'run-on', text: 'a casual run-on mix of two or three things you liked, joined with commas and "aur"/"and", like quickly typed on a phone' },
];

function chooseStyle(recent) {
  const last = recent.map((r) => r.style).filter(Boolean).slice(-3);
  return pickAvoiding(STYLES, last);
}

const OPENERS = [
  { id: 'food', text: 'start with the food or what you ordered' },
  { id: 'place', text: 'start with the restaurant or the area' },
  { id: 'staff', text: 'start with the staff or service' },
  { id: 'feel', text: 'start with how you feel now' },
  { id: 'why', text: 'start with why you came here' },
  { id: 'mid', text: 'start in the middle of a thought, casually' },
  { id: 'who', text: 'start with who you came with' },
  { id: 'time', text: 'start with when you visited (evening, weekend, late night etc.)' },
];

function chooseOpener(recent) {
  const last = recent.map((r) => r.opener).filter(Boolean).slice(-3);
  return pickAvoiding(OPENERS, last);
}

// ---------- WHAT it is about ----------
// angles: us topic ke andar kis cheez pe focus kare (random), taaki har review ka matlab alag ho
const TOPICS = {
  food: {
    id: 'food',
    text: 'the vegetarian food: tasty, fresh, well cooked, would order again',
    angles: [
      'how fresh and hot the food was when served',
      'the flavours being well balanced, not too oily or too spicy',
      'the portion size being enough',
      'the good variety of vegetarian dishes on the menu',
      'the starters and main course both being good',
      'the breads and gravies tasting properly homemade-style',
      'the taste being consistent and satisfying',
    ],
    must: /food|taste|tasty|flavou?r|swad|khana|delicious|fresh|dish|meal|menu|portion|yummy|mazedar|zayka|served|order|veg|starter|main course|bread|roti|gravy|variety/i,
  },
  ambience: {
    id: 'ambience',
    text: 'the ambience: comfortable red cushioned seating, neat modern interior, relaxed pleasant vibe',
    angles: [
      'the comfortable red cushioned seating',
      'the wooden flooring and neat setup',
      'the bright colourful decor',
      'how relaxed and pleasant it felt to sit there',
      'it being a good place to sit and talk without rush',
    ],
    must: /ambience|ambiance|interior|decor|seating|vibe|cozy|comfortable|sitting|sit|mahaul|baith|red|wood|aesthetic|peaceful|space|environment|atmosphere|jagah|look|neat/i,
  },
  politeness: {
    id: 'politeness',
    text: 'the behaviour of the staff: polite, friendly, attentive, quick service, made us feel welcome',
    angles: [
      'how quickly the food came after ordering',
      'the staff being patient while we decided what to order',
      'the staff checking on us without being pushy',
      'the polite way the staff spoke',
      'the staff helping with suggestions from the menu',
    ],
    must: /staff|service|behav|polite|friendly|attentive|patient|respect|welcom|prompt|quick|baat|nature|attend|samjhaya|serve|team|waiter/i,
  },
  pricing: {
    id: 'pricing',
    text: 'the price: pocket-friendly, good portions, great value for the money, no hidden charges',
    angles: [
      'the bill being reasonable for what we ate',
      'the portions being good for the price',
      'it being easy on the pocket even for a group',
      'the price matching the quality of the food',
    ],
    must: /price|rate|daam|paise|budget|cheap|sasta|saste|pocket|kimat|value|worth|portion|affordable|reasonable|bill/i,
  },
  family: {
    id: 'family',
    text: 'it being a good place for family dinners, group meals and small celebrations',
    angles: [
      'a family dinner going smoothly',
      'enough comfortable seating for a group',
      'a small celebration or birthday feeling easy here',
      'kids and elders both being comfortable',
    ],
    must: /family|parivar|group|friends|dost|birthday|celebrat|party|gathering|dinner|lunch|kids|parents|elders|outing|together|colleagues/i,
  },
  parking: {
    id: 'parking',
    text: 'the location and parking: easy to find in Daryaganj on Netaji Subhash Marg, on-site parking available',
    angles: [
      'having on-site parking in a busy area like Old Delhi',
      'it being easy to find on the main road',
      'the place being convenient to reach for people coming from other parts of Delhi',
    ],
    must: /parking|park|daryaganj|old delhi|location|jagah|rasta|nazdik|paas|easy to find|aasani|area|locality|reach|convenient|road|netaji|car|bike|gaadi/i,
  },
  takeaway: {
    id: 'takeaway',
    text: 'takeaway and online ordering: easy to order, neat packaging, food stayed fresh',
    angles: [
      'the packing being neat and spill-free',
      'the food reaching home still fresh',
      'the ordering process being smooth',
      'a quick takeaway when short on time',
    ],
    must: /order|online|deliver|pack|packing|packaging|takeaway|take away|parcel|arriv|fresh|home|tak/i,
  },
  hygiene: {
    id: 'hygiene',
    text: 'cleanliness: clean tables, neat and hygienic place, well maintained',
    angles: [
      'the tables and cutlery being clean',
      'the whole place being neat and well kept',
      'feeling comfortable about hygiene while eating',
    ],
    must: /clean|hygien|safai|saaf|neat|tidy|fresh|washroom|table|utensil|sanitiz|maintain/i,
  },
  late: {
    id: 'late',
    text: 'being open late at night (closes around 1 am), good for a late dinner',
    angles: [
      'getting a proper dinner late at night',
      'not having to rush because it stays open late',
    ],
    must: /late|night|1 am|one am|midnight|raat|open|time|dinner|timing/i,
  },
};

const CHIP_TOPIC = {
  'Food & Taste': 'food',
  'Ambience & Seating': 'ambience',
  'Staff & Service': 'politeness',
  'Value for Money': 'pricing',
  'Family & Groups': 'family',
  'Parking & Location': 'parking',
  'Takeaway & Order': 'takeaway',
  'Clean & Hygienic': 'hygiene',
};

// food zyada baar aaye (duplicate = zyada weight)
const ALL_TOPICS = ['food', 'food', 'food', 'ambience', 'ambience', 'politeness', 'pricing', 'family', 'parking', 'takeaway', 'hygiene', 'late'];

function chooseTopic(selectedService, recent) {
  const label = String(selectedService || '').split(' (Context')[0].trim();
  if (CHIP_TOPIC[label]) return TOPICS[CHIP_TOPIC[label]];
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-3);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

// sirf general visit context, koi dish ya fact invent nahi
const VISITS = [
  'came here with family',
  'came here with friends',
  'came here with parents',
  'came with colleagues',
  'visited for lunch',
  'visited for a late dinner',
  'dropped by on a weekend',
  'came for a small celebration',
  'ordered a takeaway',
];

const SEO_KEYWORDS = [
  'veg restaurant in Daryaganj',
  'vegetarian restaurant in Old Delhi',
  'best veg food in Daryaganj',
  'family restaurant in Daryaganj Delhi',
  'veg restaurant on Netaji Subhash Marg',
  'restaurant with parking in Daryaganj',
  'pure vegetarian food in Old Delhi',
  'late night veg restaurant in Delhi',
  'good veg restaurant near Daryaganj',
  'affordable veg restaurant in Old Delhi',
];

const BANNED_OPENINGS = ['Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'The staff here', 'Wow', 'Absolutely', 'Really', 'Very', 'Had a'];

// AI-jaisa lagne wale cliche: inme se koi mila to dobara likhwate hain
const CLICHES = /must[- ]visit|highly recommend|five star|5 star|10\/10|hidden gem|a must|cannot recommend|can't recommend|exceeded (my |our )?expectations|go-to (place|spot)|feast for|culinary|delightful|impeccable|top[- ]notch|mouth[- ]watering|foodie'?s? (paradise|heaven)|paisa vasool/i;

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
  'paise', 'kam', 'jyada', 'zyada', 'badhiya', 'mast', 'yaar', 'khana', 'swad', 'mahaul', 'safai', 'saaf', 'dost',
  'jagah', 'zayka', 'mazedar', 'parivar', 'raat', 'gaadi', 'ghar', 'humne', 'hamne', 'wahan', 'ek', 'hum',
]);

async function callGemini(apiKey, payload) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  return { res, data };
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

const firstWord = (text) => text.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');

function buildPrompt(body, recent) {
  const { businessName, category, description, city, selectedService, language } = body;

  const length = chooseLength(recent);
  const voice = chooseVoice(recent);
  const style = chooseStyle(recent);
  const topic = chooseTopic(selectedService, recent);
  const opener = chooseOpener(recent);

  const recentFirsts = recent.map((r) => r.first).filter(Boolean).slice(-4);

  const mentionName = chance(0.45);
  const useEmoji = chance(0.07);
  const visit = chance(0.4) ? pick(VISITS) : null;
  const seo = chance(0.7) ? pick(SEO_KEYWORDS) : null;
  const angle = chance(0.8) ? pick(topic.angles) : null;
  const secondPoint = length.lines >= 4 && chance(0.5);
  const lowerStart = chance(0.1);

  const languageBlock =
    language === 'HINGLISH'
      ? `LANGUAGE (MOST IMPORTANT): Write in HINGLISH = Hindi sentences typed in English/Roman letters, like a Delhi person on WhatsApp. Grammar must be Hindi (hai, tha, kiya, mila, nahi, bahut, aur, ke liye, wala etc.) with common English words like food, taste, staff, price, ambience, parking mixed in. Product names and keywords can stay in English. Never write a full English sentence. Never use Devanagari.`
      : `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian customer. Do not use Hindi words.`;

  const avoidStart = [...BANNED_OPENINGS, ...recentFirsts.map((w) => w.charAt(0).toUpperCase() + w.slice(1))];

  const prompt = `${languageBlock}

You are ${voice.text}. You are a real customer of this restaurant writing a Google Maps review right after your visit.

Business: ${businessName} (${city}), a vegetarian restaurant
Category: ${category}
About: ${description || ''}

REVIEW RULES:
- Main topic of the review: ${topic.text}. The review must clearly be about this.
${angle ? `- Angle to focus on (optional but preferred): ${angle}.` : ''}
${secondPoint ? '- You may add one small extra point at the end, from any other area.' : '- Stick to the main topic only.'}
- Voice: write exactly like the person described above, so this review sounds different from other customers.
- Shape of the review: ${style.text}.
- Opening: ${opener.text}.
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention the name "${businessName}" once, naturally.` : '- Do not repeat the full name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}
${visit ? `- You may mention that you ${visit}.` : ''}
- Do not name any person.
${useEmoji ? '- One emoji at the very end is allowed.' : '- No emojis.'}
${lowerStart ? '- Start the first word in lowercase, like a quick phone message.' : ''}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and", or just flow.
- Never start with: ${avoidStart.join(', ')}.
- Sound like a real customer typing on a phone, not an advertisement. Slightly imperfect, human phrasing is good. No hashtags, slogans or keyword stuffing.
- Avoid review cliches: "must visit", "highly recommended", "hidden gem", "exceeded expectations", "5 star", "10/10", "culinary", "delightful", "top notch".
- Do not invent facts: no specific dish names, no exact prices, no discounts, no offers, no other restaurant names, no awards, no health claims. Speak generally (vegetarian food, starters, main course, breads, desserts, drinks).
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`;

  return { prompt, length, voice, style, topic, opener };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : [])
      .filter((r) => r && typeof r === 'object')
      .slice(-6);

    const recentFirsts = recent.map((r) => r.first).filter(Boolean).slice(-4);

    let lastError = 'Failed to generate review draft.';

    for (let attempt = 0; attempt < 5; attempt++) {
      const { prompt, length, voice, style, topic, opener } = buildPrompt(body, recent);

      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Write the review for ${body.businessName} now. Random seed: ${body.randomSeed || Math.floor(Math.random() * 100000)}.` }] }],
        systemInstruction: { parts: [{ text: prompt }] },
        generationConfig: {
          temperature: 1.1,
          topP: 0.95,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      };

      let { res, data } = await callGemini(apiKey, payload);

      if (!res.ok && /thinking/i.test(data.error?.message || '')) {
        delete payload.generationConfig.thinkingConfig;
        ({ res, data } = await callGemini(apiKey, payload));
      }

      if (!res.ok) {
        lastError = data.error?.message || 'Gemini API request failed.';
        continue;
      }

      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const raw = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
      const review = cleanReview(raw);
      const words = review.split(/\s+/).filter(Boolean).length;
      const first = firstWord(review);

      if (!review) { lastError = 'Empty response from Gemini.'; continue; }
      if (candidate?.finishReason === 'MAX_TOKENS') { lastError = 'Response was cut off.'; continue; }
      if (looksCutOff(review)) { lastError = 'Review ended mid-sentence.'; continue; }
      if (words > length.max + 8) { lastError = 'Review too long.'; continue; }
      if (words < Math.floor(length.min * 0.75)) { lastError = 'Review too short.'; continue; }
      if (!languageOk(review, body.language, words)) { lastError = 'Wrong language style.'; continue; }
      if (!topic.must.test(review)) { lastError = 'Review missed the selected topic.'; continue; }
      if (CLICHES.test(review)) { lastError = 'Review sounded generic.'; continue; }
      if (first && recentFirsts.includes(first)) { lastError = 'Repeated opening word.'; continue; }

      return NextResponse.json({
        review,
        meta: {
          lines: length.lines,
          voice: voice.id,
          style: style.id,
          topic: topic.id,
          opener: opener.id,
          first,
        },
      });
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
