// Gregorian <-> Ethiopian (Amete Mihret) calendar conversions.
// All dates are handled as UTC-midnight Gregorian Date objects at the boundary.

const ETHIOPIAN_EPOCH_JDN = 1724221; // JDN of 1 Meskerem, year 1 EE
export const ETH_MONTHS = {
  en: [
    "Meskerem",
    "Tikimt",
    "Hidar",
    "Tahsas",
    "Tir",
    "Yekatit",
    "Megabit",
    "Miazia",
    "Ginbot",
    "Sene",
    "Hamle",
    "Nehase",
    "Pagume",
  ],
  am: [
    "መስከረም",
    "ጥቅምት",
    "ኅዳር",
    "ታኅሣሥ",
    "ጥር",
    "የካቲት",
    "መጋቢት",
    "ሚያዝያ",
    "ግንቦት",
    "ሰኔ",
    "ሐምሌ",
    "ነሐሴ",
    "ጳጉሜ",
  ],
};
export const ETH_DAYS = {
  en: ["Segno", "Maksegno", "Erob", "Hamus", "Arb", "Kidame", "Sambata"],
  am: ["ሰኞ", "ማክሰኞ", "እሮብ", "ሐሙስ", "አርብ", "ቅዳሜ", "እሁድ"],
};

export function gregorianToJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

export function jdnToGregorian(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

export function isEthiopianLeapYear(ethYear) {
  return ethYear % 4 === 3;
}

export function gregorianToEthiopian(date) {
  const jdn = gregorianToJDN(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  // Count from the start of year 0 so leap years fall on year % 4 === 3
  const diff = jdn - (ETHIOPIAN_EPOCH_JDN - 365);
  const r = diff % 1461; // days within the 4-year cycle (3 common years + 1 leap year)
  const n = (r % 365) + 365 * Math.floor(r / 1460); // day of year (0-based)
  const year =
    4 * Math.floor(diff / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

export function ethiopianToGregorian(ethYear, ethMonth, ethDay) {
  // Leap years (year % 4 === 3) before ethYear: floor(ethYear / 4)
  const days =
    365 * (ethYear - 1) +
    Math.floor(ethYear / 4) +
    (ethMonth - 1) * 30 +
    (ethDay - 1);
  const g = jdnToGregorian(ETHIOPIAN_EPOCH_JDN + days);
  return new Date(Date.UTC(g.year, g.month - 1, g.day));
}

export function formatEthiopianDate(date, locale = "en") {
  const e = gregorianToEthiopian(date);
  const months = ETH_MONTHS[locale] || ETH_MONTHS.en;
  return `${months[e.month - 1]} ${e.day}, ${e.year}`;
}

export function ethiopianMonthRange(ethYear, ethMonth) {
  const start = ethiopianToGregorian(ethYear, ethMonth, 1);
  const end = new Date(
    ethiopianToGregorian(ethYear, ethMonth + 1, 1).getTime() - 1,
  );
  return { start, end };
}

export function ethiopianYearRange(ethYear) {
  const start = ethiopianToGregorian(ethYear, 1, 1);
  const end = new Date(ethiopianToGregorian(ethYear + 1, 1, 1).getTime() - 1);
  return { start, end };
}

// Ethiopian fiscal year: starts Hamle 1 (month 11)
export function ethiopianFiscalYearRange(ethYear) {
  const start = ethiopianToGregorian(ethYear - 1, 11, 1);
  const end = new Date(ethiopianToGregorian(ethYear, 11, 1).getTime() - 1);
  return { start, end };
}
