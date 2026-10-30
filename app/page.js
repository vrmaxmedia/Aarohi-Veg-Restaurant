"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PLACE_ID = "ChIJtRYjRQr9DDkRA97B_A4815g";

const CLIENT_CONFIG = {
  clientId: "aarohi_daryaganj_01",
  businessName: "Aarohi Veg Restaurant",
  subHeading: "Vegetarian Restaurant • Daryaganj, Delhi",
  tagline: "VEGETARIAN RESTAURANT • DINE-IN • TAKEAWAY • ONLINE ORDER • DARYAGANJ, OLD DELHI",
  description:
    "Highly rated vegetarian restaurant in Daryaganj, Old Delhi with comfortable red-cushioned seating, a neat modern interior, tasty vegetarian food, friendly service and pocket-friendly pricing (about ₹200 to ₹400 per person). Dine-in, takeaway and online ordering available, on-site parking, open late till 1 am.",
  city: "Daryaganj, Old Delhi 110002",
  fullAddress: "Plot 5048/49, Netaji Subhash Marg, Old Delhi, Daryaganj, New Delhi, Delhi, 110002",
  phone: "+919911275551",
  cleanPhone: "919911275551",
  logoUrl: "/logo.png",
  googleReviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
  googlePageUrl: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
  mapsDirectionUrl: `https://www.google.com/maps/dir/?api=1&destination=Aarohi%20Veg%20Restaurant%20Daryaganj&destination_place_id=${PLACE_ID}`,

  // Social / menu links: jo ho wahi daalo, khali ("") chhodoge to icon apne aap hide ho jayega
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  whatsappChannelUrl: "",
  menuUrl: "",

  // "What we offer" card (Google listing se)
  offers: [
    "Vegetarian Restaurant",
    "Dine-in & Takeaway",
    "Online Ordering Available",
    "On-site Parking",
    "Open Late • Closes 1 AM",
    "Pocket-friendly • ₹200 – 400 per person",
  ],

  // VR Max AI (agency) contact
  agencyName: "VR Max AI",
  agencyWhatsapp: "918700660097",
  agencyPhoneDisplay: "+91 87006 60097",

  customInstruction:
    "You are an authentic local customer writing an unscripted Google Maps review for Aarohi Veg Restaurant, a vegetarian restaurant in Daryaganj, Old Delhi. Write like a real human, not a marketer. Strictly DO NOT use full stops (.) at the end of sentences. Vary length, tone and structure completely at random. Never use robotic or repetitive openings.",

  chips: [
    { label: "All", context: "overall dining experience at the vegetarian restaurant: food, ambience, service and value" },
    { label: "Food & Taste", context: "tasty fresh vegetarian food, good flavours, well cooked and nicely served" },
    { label: "Ambience & Seating", context: "comfortable red cushioned seating, neat modern interior, pleasant relaxed vibe" },
    { label: "Staff & Service", context: "polite friendly staff, quick and attentive service, welcoming behaviour" },
    { label: "Value for Money", context: "fair pocket-friendly pricing, good portions and great value for the money" },
    { label: "Family & Groups", context: "a good place for family dinners, group meals and small celebrations" },
    { label: "Parking & Location", context: "easy to find in Daryaganj on Netaji Subhash Marg with on-site parking available" },
    { label: "Takeaway & Order", context: "easy takeaway or online order, neat packaging and food arriving fresh" },
    { label: "Clean & Hygienic", context: "clean tables, neat hygienic place and well-maintained surroundings" },
  ],
};

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  `${CLIENT_CONFIG.businessName}, ${CLIENT_CONFIG.fullAddress}`
)}&output=embed`;

const AGENCY_WA_LINK = `https://wa.me/${CLIENT_CONFIG.agencyWhatsapp}?text=${encodeURIComponent(
  "Hi VR Max AI, I want to get a QR review system for my business."
)}`;

function useTypewriter(fullText, speed = 10) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }
    setDisplayText("");
    setIsTyping(true);
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [fullText, speed]);

  return { displayText, isTyping };
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fallback neeche
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

export default function UniversalReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedChipObj, setSelectedChipObj] = useState(CLIENT_CONFIG.chips[0]);
  const [language, setLanguage] = useState("ENGLISH");
  const [reviewDraft, setReviewDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const recentLengthsRef = useRef([]);
  const { displayText, isTyping } = useTypewriter(reviewDraft, 10);

  useEffect(() => {
    setMounted(true);
    return () => {
      requestIdRef.current++;
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateAIReview = useCallback(async (chipObj, lang) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCopied(false);
    setError("");
    setReviewDraft("");

    try {
      const effectiveFocus = `${chipObj.label} (Context cues: ${chipObj.context})`;

      const res = await fetch("/api/reviews", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          businessName: CLIENT_CONFIG.businessName,
          category: CLIENT_CONFIG.tagline,
          description: CLIENT_CONFIG.description,
          city: CLIENT_CONFIG.city,
          selectedService: effectiveFocus,
          customInstruction: CLIENT_CONFIG.customInstruction,
          language: lang,
          nonce: Math.random().toString(36).substring(2, 12),
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 100000),
          recentLengths: recentLengthsRef.current,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Draft generation failed (${res.status}).`);
      if (!data.review?.trim()) throw new Error("The API returned an empty draft.");
      if (requestId !== requestIdRef.current) return;

      if (data.meta) {
        recentLengthsRef.current = [...recentLengthsRef.current, data.meta].slice(-6);
      }
      setReviewDraft(data.review.trim());
    } catch (err) {
      if (err.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setError(err.message || "Unable to generate a draft.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    generateAIReview(selectedChipObj, language);
    return () => abortControllerRef.current?.abort();
  }, [mounted, selectedChipObj, language, generateAIReview]);

  function handleChipChange(chipObj) {
    if (chipObj.label === selectedChipObj.label) {
      generateAIReview(chipObj, language);
      return;
    }
    setSelectedChipObj(chipObj);
  }

  function handleLanguageChange(lang) {
    if (lang === language) {
      generateAIReview(selectedChipObj, lang);
      return;
    }
    setLanguage(lang);
  }

  async function handleCopyAndRedirect() {
    if (!reviewDraft || loading || isTyping) return;
    const ok = await copyToClipboard(reviewDraft);
    if (!ok) {
      setError("Could not copy the draft. Please select and copy it manually.");
      return;
    }
    setCopied(true);
    setTimeout(() => {
      window.location.href = CLIENT_CONFIG.googleReviewUrl;
    }, 550);
  }

  function handleSaveContact() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${CLIENT_CONFIG.businessName}
ORG:${CLIENT_CONFIG.businessName}
TEL;TYPE=CELL:${CLIENT_CONFIG.phone}
ADR;TYPE=WORK:;;${CLIENT_CONFIG.fullAddress};;;;
NOTE:${CLIENT_CONFIG.subHeading}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${CLIENT_CONFIG.businessName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const hasSocials = !!(
    CLIENT_CONFIG.instagramUrl ||
    CLIENT_CONFIG.whatsappChannelUrl ||
    CLIENT_CONFIG.facebookUrl ||
    CLIENT_CONFIG.youtubeUrl ||
    CLIENT_CONFIG.menuUrl
  );

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#c01a2a" }} />;

  return (
    <main className="soft-luxury-viewport">
      <div className="main-content-flow">
        {/* Logo */}
        <div className="brand-medallion-badge">
          <div
            className="logo-circle-container"
            style={{ backgroundImage: `url(${CLIENT_CONFIG.logoUrl})` }}
            role="img"
            aria-label={`${CLIENT_CONFIG.businessName} logo`}
          ></div>
          <h1 className="brand-main-title">{CLIENT_CONFIG.businessName}</h1>
        </div>

        <p className="brand-serif-subtitle">{CLIENT_CONFIG.subHeading}</p>

        <div className="royal-shahi-divider">
          <span className="divider-line"></span>
          <span className="divider-gem">◆</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster" aria-hidden="true">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>

        <p className="experience-tracker-title">SHARE YOUR EXPERIENCE</p>

        {/* Filter Chips */}
        <div className="floating-pills-cloud">
          {CLIENT_CONFIG.chips.map((chip) => {
            const active = selectedChipObj.label === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipChange(chip)}
                className={`embossed-pill ${active ? "active" : ""}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Language Selector */}
        <div className="capsule-lang-dock">
          {["ENGLISH", "HINGLISH"].map((lang) => {
            const active = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`capsule-lang-btn ${active ? "active" : ""}`}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Review Box */}
        <div className="signature-review-box">
          <div className="box-top-ribbon">
            <div className="label-badge">
              <span className="dot-ping"></span>
              YOUR REVIEW
            </div>
            <button
              type="button"
              disabled={loading || isTyping}
              onClick={() => generateAIReview(selectedChipObj, language)}
              className="top-rewrite-btn"
            >
              <span>Rewrite</span>
            </button>
          </div>

          <div className="review-display-zone">
            {loading ? (
              <div className="loader-shimmer-wrap">
                <span className="sparkle-icon">✦</span>
                <span className="shimmer-text"> Crafting authentic review...</span>
              </div>
            ) : error ? (
              <p className="review-error">{error}</p>
            ) : reviewDraft ? (
              <p className="review-body-text">
                {displayText}
                {isTyping && <span className="typewriter-cursor"></span>}
              </p>
            ) : (
              <p className="review-placeholder">Your review draft will appear here.</p>
            )}
          </div>

          <div className="card-ornament-center"><span>◆</span></div>

          <button
            type="button"
            disabled={loading || isTyping || !reviewDraft}
            onClick={handleCopyAndRedirect}
            className="full-luxury-copy-btn"
          >
            <span>{copied ? "Copied! Opening Google..." : "Copy & Paste on Google"}</span>
          </button>
          <p className="card-disclaimer-note">Please review the wording before posting.</p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <div className="soft-action-grid">
            <div className="action-row-upper">
              {/* WhatsApp */}
              <a href={`https://wa.me/${CLIENT_CONFIG.cleanPhone}`} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc whatsapp-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <span className="icon-tag">WhatsApp</span>
              </a>

              {/* Call Us */}
              <a href={`tel:${CLIENT_CONFIG.phone}`} className="soft-circle-action">
                <div className="icon-disc call-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <span className="icon-tag">Call Us</span>
              </a>

              {/* Save Contact */}
              <button type="button" onClick={handleSaveContact} className="soft-circle-action">
                <div className="icon-disc contact-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <span className="icon-tag">Save Contact</span>
              </button>

              {/* Directions */}
              <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc map-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <span className="icon-tag">Directions</span>
              </a>
            </div>

            {hasSocials && (
            <div className="action-row-lower">
              {/* Instagram */}
              {CLIENT_CONFIG.instagramUrl && (
                <a href={CLIENT_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc insta-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </div>
                <span className="icon-tag">Instagram</span>
              </a>
              )}

              {/* WhatsApp Channel */}
              {CLIENT_CONFIG.whatsappChannelUrl && (
                <a href={CLIENT_CONFIG.whatsappChannelUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc wa-channel-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <span className="icon-tag">WA Channel</span>
              </a>
              )}

              {/* Facebook */}
              {CLIENT_CONFIG.facebookUrl && (
                <a href={CLIENT_CONFIG.facebookUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc fb-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </div>
                <span className="icon-tag">Facebook</span>
              </a>
              )}

              {/* Menu */}
              {CLIENT_CONFIG.menuUrl && (
                <a href={CLIENT_CONFIG.menuUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                  <div className="icon-disc menu-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v8a2 2 0 0 0 2 2v8"/><path d="M5 3v6"/><path d="M9 3v6"/><path d="M17 21V3c-2.2 1.2-3.5 3.7-3.5 7 0 1.7.8 3 2 3h1.5"/></svg>
                  </div>
                  <span className="icon-tag">Menu</span>
                </a>
              )}

              {/* YouTube */}
              {CLIENT_CONFIG.youtubeUrl && (
                <a href={CLIENT_CONFIG.youtubeUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc yt-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor"/></svg>
                </div>
                <span className="icon-tag">YouTube</span>
              </a>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Map Card */}
        <div className="embedded-map-card">
          <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="map-card-header-link">
            <div className="address-highlight-box">
              <p className="agency-clean-address"><strong>📍 Address:</strong> {CLIENT_CONFIG.fullAddress}</p>
            </div>
            <div className="map-card-header">
              <span>Find Us • Daryaganj, Delhi</span>
            </div>
          </a>
          <div className="map-iframe-container">
            <iframe
              title={`${CLIENT_CONFIG.businessName} Location`}
              src={MAP_EMBED_URL}
              width="100%"
              height="170"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={CLIENT_CONFIG.mapsDirectionUrl}
            target="_blank"
            rel="noreferrer"
            className="map-directions-link"
          >
            Get Directions on Google Maps &rarr;
          </a>
        </div>

        {/* What we offer */}
        {CLIENT_CONFIG.offers?.length > 0 && (
          <div className="offers-card">
            <h2 className="offers-title">What we offer</h2>
            <ul className="offers-list">
              {CLIENT_CONFIG.offers.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Mini Footer */}
        <footer className="mini-footer">
          <span className="mini-footer-pill">
            Powered by <strong>{CLIENT_CONFIG.agencyName}</strong>
            <span className="mini-footer-dot">•</span>
            Get QR:
            <a href={AGENCY_WA_LINK} target="_blank" rel="noreferrer">
              {CLIENT_CONFIG.agencyPhoneDisplay}
            </a>
          </span>
        </footer>

        <p className="page-disclaimer">
          These are only suggested reviews. You are free to write your own review or edit this one before posting.
        </p>
      </div>

      <style jsx global>{`
        .soft-luxury-viewport {
          --primary: #b3121f;
          --primary-dark: #7a0b14;
          --primary-mid: #d02030;
          --gold: #f7c948;
          --gold-deep: #c98a1b;
          --line: #f1cfcf;
          --soft: #fff6f4;
          --muted: #9a7a78;
          --lang-active: #d4830f;
          --ink: #2a1410;
          min-height: 100vh;
          background: linear-gradient(180deg, #e0303f 0%, #c01a2a 50%, #9c1220 100%);
          padding: 20px 16px 20px;
          box-sizing: border-box;
          font-family: "Jost", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #2a1410;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .main-content-flow {
          width: 100%;
          max-width: 410px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .brand-medallion-badge {
          margin-top: 6px;
          margin-bottom: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo-circle-container {
          width: clamp(96px, 13vh, 120px);
          height: clamp(96px, 13vh, 120px);
          border-radius: 50%;
          background-color: transparent;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 0 14px 34px rgba(60, 0, 0, 0.4), 0 6px 14px rgba(0,0,0,0.18);
          margin-bottom: 8px;
          animation: floatLogo 3.5s ease-in-out infinite;
          border: 3px solid #f7c948;
          transition: transform 0.2s ease;
        }
        .logo-circle-container:active {
          transform: scale(0.96);
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-circle-container { animation: none; }
        }
        .brand-main-title {
          font-family: Georgia, serif;
          font-size: 21px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 2px;
          letter-spacing: 0.3px;
          text-shadow: 0 2px 10px rgba(60,0,0,0.3);
        }
        .brand-serif-subtitle {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 12.5px;
          color: #ffe3a3;
          margin: 0 0 4px;
        }
        .royal-shahi-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85%;
          margin: 4px auto 6px;
          gap: 10px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #f7c948, transparent);
        }
        .divider-gem {
          color: #f7c948;
          font-size: 8px;
        }
        .stars-cluster {
          display: flex;
          gap: 4px;
          color: #ffd24d;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .experience-tracker-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #ffe6e6;
          text-transform: uppercase;
          margin: 0 0 8px;
        }
        .floating-pills-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
          margin-bottom: 8px;
          width: 100%;
        }
        .embossed-pill {
          border-radius: 999px;
          padding: 5px 11px;
          font-family: inherit;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          line-height: 1.2;
          background: var(--soft);
          color: #a3121f;
          border: 1px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(60, 0, 0, 0.18);
          transition: all 0.16s ease;
        }
        .embossed-pill:active {
          transform: scale(0.95);
        }
        .embossed-pill.active {
          background: var(--primary-dark);
          color: #ffffff;
          border-color: var(--primary-dark);
          box-shadow: 0 4px 14px rgba(106, 18, 32, 0.3);
        }
        .capsule-lang-dock {
          display: inline-flex;
          background: #ffffff;
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          margin-bottom: 10px;
          box-shadow: 0 3px 10px rgba(180, 155, 130, 0.12);
          border: 1px solid var(--line);
        }
        .capsule-lang-btn {
          padding: 6px 20px;
          letter-spacing: 1px;
          font-family: inherit;
          border-radius: 999px;
          border: none;
          background: transparent;
          font-size: 10px;
          font-weight: 700;
          color: #7b6b5d;
          cursor: pointer;
        }
        .capsule-lang-btn.active {
          background: var(--lang-active);
          color: #ffffff;
          box-shadow: 0 3px 8px rgba(120, 70, 0, 0.35);
        }
        .signature-review-box {
          width: 100%;
          background: #fffdfb;
          border-radius: 24px;
          padding: 18px;
          box-sizing: border-box;
          box-shadow: 0 14px 34px rgba(60, 0, 0, 0.28);
          margin-bottom: 16px;
          text-align: left;
          border-top: 4px solid var(--gold);
          color: #2b2016;
        }
        .box-top-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .label-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          color: var(--muted);
          text-transform: uppercase;
        }
        .dot-ping {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--primary);
        }
        .top-rewrite-btn {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--soft);
          border: 1px solid var(--line);
          color: var(--primary);
          font-size: 10.5px;
          font-weight: 650;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .top-rewrite-btn:active {
          transform: scale(0.95);
        }
        .review-display-zone {
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 2px 8px;
        }
        .loader-shimmer-wrap {
          color: var(--gold-deep);
          font-size: 12px;
          font-style: italic;
        }
        .review-body-text {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-style: italic;
          font-size: 17px;
          line-height: 1.6;
          color: #2b2016;
          margin: 0;
          width: 100%;
          white-space: pre-wrap;
        }
        .review-placeholder {
          font-family: Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: #a49688;
          margin: 0;
        }
        .review-error {
          font-size: 12px;
          color: #a3212d;
          margin: 0;
        }
        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: var(--primary);
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 0.7s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .card-ornament-center {
          text-align: center;
          color: var(--gold);
          font-size: 7px;
          margin: 4px 0 8px;
        }
        .full-luxury-copy-btn {
          width: 100%;
          height: 50px;
          border-radius: 999px;
          background: linear-gradient(180deg, var(--primary-mid) 0%, var(--primary) 100%);
          border: none;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(106, 18, 32, 0.35);
          transition: transform 0.15s ease;
        }
        .full-luxury-copy-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .full-luxury-copy-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .card-disclaimer-note {
          font-size: 9.5px;
          color: var(--muted);
          text-align: center;
          margin: 8px 0 0;
          font-style: italic;
        }
        .quick-actions-card {
          width: 100%;
          background: transparent;
          padding: 4px 0 6px;
          box-sizing: border-box;
          margin-bottom: 10px;
        }
        .soft-action-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }
        .action-row-upper {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }
        .action-row-lower {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }
        .soft-circle-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          text-decoration: none !important;
          font-family: inherit;
          color: #4a3c30;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s ease;
        }
        .soft-circle-action:active {
          transform: scale(0.92);
        }
        .icon-disc {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #ffffff;
          display: grid;
          place-items: center;
          box-shadow: 0 8px 18px rgba(60, 0, 0, 0.3);
          border: 2px solid #f7c948;
          transition: all 0.2s ease;
        }
        .icon-disc svg {
          width: 20px;
          height: 20px;
          stroke: #b3121f;
          transition: stroke 0.2s ease;
        }
        .whatsapp-disc:hover { background: #25d366; border-color: #25d366; }
        .whatsapp-disc:hover svg { stroke: #ffffff; }

        .call-disc:hover { background: #007aff; border-color: #007aff; }
        .call-disc:hover svg { stroke: #ffffff; }

        .contact-disc:hover { background: var(--primary-dark); border-color: var(--primary-dark); }
        .contact-disc:hover svg { stroke: #ffffff; }

        .map-disc:hover { background: #ea4335; border-color: #ea4335; }
        .map-disc:hover svg { stroke: #ffffff; }

        .insta-disc:hover { background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%); border-color: transparent; }
        .insta-disc:hover svg { stroke: #ffffff; }

        .wa-channel-disc:hover { background: #25d366; border-color: #25d366; }
        .wa-channel-disc:hover svg { stroke: #ffffff; }

        .fb-disc:hover { background: #1877f2; border-color: #1877f2; }
        .fb-disc:hover svg { stroke: #ffffff; }

        .google-disc:hover { background: #4285f4; border-color: #4285f4; }
        .google-disc:hover svg { stroke: #ffffff; }
        .menu-disc:hover { background: var(--primary); border-color: var(--primary); }
        .menu-disc:hover svg { stroke: #ffffff; }

        .yt-disc:hover { background: #ff0000; border-color: #ff0000; }
        .yt-disc:hover svg { stroke: #ffffff; color: #ffffff; }

        .icon-tag {
          font-size: 10.5px;
          font-weight: 600;
          color: #ffffff;
        }
        .embedded-map-card {
          width: 100%;
          background: transparent;
          padding: 0;
          box-sizing: border-box;
          margin-bottom: 10px;
          text-align: left;
        }
        .map-card-header-link {
          text-decoration: none;
        }
        .map-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: #ffe3a3;
          margin-bottom: 8px;
        }
        .map-iframe-container {
          width: 100%;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--line);
          box-shadow: 0 8px 22px rgba(60, 0, 0, 0.35);
          margin-bottom: 8px;
        }
        .map-directions-link {
          font-size: 11px;
          font-weight: 750;
          color: #ffe3a3;
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 8px;
        }
        .address-highlight-box {
          background: transparent;
          padding: 0 4px;
          margin-bottom: 10px;
        }
        .agency-clean-address {
          font-size: 12px;
          color: #ffffff;
          margin: 0;
          line-height: 1.4;
          text-align: center;
        }

        /* ---------- What we offer ---------- */
        .offers-card {
          width: 100%;
          background: #fffdfb;
          border-radius: 22px;
          padding: 16px 18px 8px;
          box-sizing: border-box;
          border: 1px solid var(--line);
          box-shadow: 0 8px 24px rgba(60, 0, 0, 0.2);
          margin-bottom: 14px;
        }
        .offers-title {
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--primary);
          margin: 0 0 8px;
        }
        .offers-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .offers-list li {
          font-size: 12.5px;
          color: #4a3c30;
          padding: 10px 0;
          border-top: 1px solid var(--line);
        }
        .offers-list li:first-child { border-top: none; }

        .page-disclaimer {
          font-size: 9.5px;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          line-height: 1.5;
          margin: 10px 8px 0;
        }

        /* ---------- Mini Footer ---------- */
        .mini-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 2px;
        }
        .mini-footer-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
          padding: 5px 12px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: #ffffff;
          font-size: 8.5px;
          letter-spacing: 0.3px;
          color: var(--muted);
          line-height: 1.4;
        }
        .mini-footer-pill strong {
          color: var(--primary);
          font-weight: 700;
        }
        .mini-footer-dot {
          color: var(--gold);
        }
        .mini-footer-pill a {
          color: var(--primary);
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
