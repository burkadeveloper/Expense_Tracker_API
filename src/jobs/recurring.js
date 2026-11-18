import cron from "node-cron";
import RecurringRule from "../models/RecurringRule.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import {
  gregorianToEthiopian,
  ethiopianToGregorian,
} from "../utils/ethiopianCalendar.js";

const DAY = 86400000;
const MAX_CATCHUP = 60; // safety cap per rule per run

function addUtcMonths(date, n) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

// Add one Ethiopian month, keeping the day of month (clamped to the month length,
// e.g. day 30 in Pagume becomes day 5 or 6).
function addEthiopianMonth(date) {
  const e = gregorianToEthiopian(date);
  let year = e.year;
  let month = e.month + 1;
  if (month > 13) {
    month = 1;
    year += 1;
  }
  const maxDay = month === 13 ? 5 : 30; // Pagume length handled by clamp below
  let day = Math.min(e.day, maxDay);
  let next = ethiopianToGregorian(year, month, day);
  // If Pagume has 6 days in a leap year and day was 6, allow it
  if (month === 13 && e.day === 6) {
    const six = ethiopianToGregorian(year, 13, 6);
    if (gregorianToEthiopian(six).month === 13) next = six;
  }
  // Preserve time-of-day
  next.setUTCHours(
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    0,
  );
  return next;
}

export function computeNextRun(rule, from) {
  const d = new Date(from);
  switch (rule.frequency) {
    case "daily":
      return new Date(d.getTime() + DAY);
    case "weekly":
      return new Date(d.getTime() + 7 * DAY);
    case "monthly":
      return rule.followEthiopianMonth ? addEthiopianMonth(d) : addUtcMonths(d, 1);
    case "yearly":
      return addUtcMonths(d, 12);
    default:
      throw new Error(`Unknown frequency: ${rule.frequency}`);
  }
}

async function applyBalance(tx) {
  if (tx.type === "expense" && tx.fromAccount) {
    await Account.updateOne(
      { _id: tx.fromAccount },
      { $inc: { balanceMinor: -tx.amountMinor } },
    );
  } else if (tx.type === "income" && tx.toAccount) {
    await Account.updateOne(
      { _id: tx.toAccount },
      { $inc: { balanceMinor: tx.amountMinor } },
    );
  } else if (tx.type === "transfer") {
    if (tx.fromAccount)
      await Account.updateOne(
        { _id: tx.fromAccount },
        { $inc: { balanceMinor: -tx.amountMinor } },
      );
    if (tx.toAccount)
      await Account.updateOne(
        { _id: tx.toAccount },
        { $inc: { balanceMinor: tx.amountMinor } },
      );
  }
}

// Creates every due transaction for every active rule. Safe to run repeatedly:
// each generated transaction carries a deterministic idempotencyKey, so a
// retry after a crash cannot create duplicates.
export async function runRecurring(now = new Date()) {
  const rules = await RecurringRule.find({
    active: true,
    nextRunAt: { $lte: now },
  });
  let createdCount = 0;

  for (const rule of rules) {
    let guard = 0;
    while (rule.nextRunAt <= now && guard++ < MAX_CATCHUP) {
      const key = `recurring:${rule._id}:${rule.nextRunAt.toISOString()}`;
      const t = rule.template;
      try {
        const tx = await Transaction.create({
          user: rule.user,
          type: t.type,
          amountMinor: t.amountMinor,
          fromAccount: t.fromAccount,
          toAccount: t.toAccount,
          category: t.category,
          payee: t.payee || rule.name,
          notes: t.notes,
          paymentMethod: t.paymentMethod || "cash",
          date: rule.nextRunAt,
          idempotencyKey: key,
        });
        await applyBalance(tx);
        createdCount++;
      } catch (err) {
        // 11000 = duplicate key: this occurrence was already generated
        if (err.code !== 11000) {
          console.error("[recurring] failed for rule", String(rule._id), err);
          break;
        }
      }
      rule.lastRunAt = rule.nextRunAt;
      rule.nextRunAt = computeNextRun(rule, rule.nextRunAt);
    }
    await rule.save();
  }
  return { rules: rules.length, created: createdCount };
}

export function startRecurringJob() {
  // Every day at 00:05 server time
  cron.schedule("5 0 * * *", async () => {
    try {
      const r = await runRecurring();
      console.log("[recurring] processed", r);
    } catch (err) {
      console.error("[recurring] job error", err);
    }
  });
  // Also catch up once on startup
  runRecurring().catch((err) => console.error("[recurring] startup error", err));
}
