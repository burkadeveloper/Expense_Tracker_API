// SMS parser — template-driven. Templates live in the SmsTemplate collection.
// NOTE: The seed file only ships PLACEHOLDER patterns. Replace them with real
// sample messages from Telebirr / CBE / Dashen etc. Never invent them.

import SmsTemplate from "../../models/SmsTemplate.js";

// Compile cached regexes per template. Refresh on template change (simple approach).
const cache = new Map();

async function loadTemplates() {
  if (cache.size) return cache;
  const templates = await SmsTemplate.find({ active: true });
  for (const t of templates) {
    cache.set(t.providerKey, t);
  }
  return cache;
}

export async function invalidateCache() {
  cache.clear();
}

export async function parseSms(text) {
  const templates = await loadTemplates();
  for (const t of templates.values()) {
    for (const p of t.patterns) {
      const re = new RegExp(p.regex, "i");
      const m = text.match(re);
      if (!m) continue;
      const g = m.groups || {};
      const amountMajor = g.amount
        ? Number(String(g.amount).replace(/,/g, ""))
        : null;
      return {
        matched: true,
        providerKey: t.providerKey,
        providerName: t.providerName,
        type: p.type || "unknown",
        amountMinor: amountMajor ? Math.round(amountMajor * 100) : null,
        date: g.date || null,
        counterparty: g.counterparty || null,
        reference: g.ref || null,
        paymentMethod: p.defaults?.paymentMethod || "other",
        raw: text,
      };
    }
  }
  return { matched: false, raw: text };
}
