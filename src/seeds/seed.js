import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import User from "../models/User.js";
import Provider from "../models/Provider.js";
import Category from "../models/Category.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import SmsTemplate from "../models/SmsTemplate.js";

const PROVIDERS = [
  { name: "Commercial Bank of Ethiopia", kind: "bank" },
  { name: "Awash Bank", kind: "bank" },
  { name: "Dashen Bank", kind: "bank" },
  { name: "Bank of Abyssinia", kind: "bank" },
  { name: "Wegagen Bank", kind: "bank" },
  { name: "Zemen Bank", kind: "bank" },
  { name: "Oromia Bank", kind: "bank" },
  { name: "Cooperative Bank of Oromia", kind: "bank" },
  { name: "Nib International Bank", kind: "bank" },
  { name: "Hibret Bank", kind: "bank" },
  { name: "Amhara Bank", kind: "bank" },
  { name: "Telebirr", kind: "mobile_money" },
  { name: "CBE Birr", kind: "mobile_money" },
  { name: "M-Pesa", kind: "mobile_money" },
];

const CATEGORIES = [
  {
    key: "food",
    kind: "expense",
    name: { en: "Food & groceries", am: "ምግብና ግሮሰሪ" },
    icon: "🛒",
  },
  {
    key: "eating_out",
    kind: "expense",
    name: { en: "Eating out & cafes", am: "ውጭ መመገብ" },
    icon: "🍽️",
  },
  { key: "rent", kind: "expense", name: { en: "Rent", am: "ኪራይ" }, icon: "🏠" },
  {
    key: "utilities",
    kind: "expense",
    name: { en: "Utilities", am: "የግልግል አገልግሎት" },
    icon: "💡",
  },
  {
    key: "airtime",
    kind: "expense",
    name: { en: "Mobile airtime & data", am: "የሞባይል ክፍያ" },
    icon: "📱",
  },
  {
    key: "internet",
    kind: "expense",
    name: { en: "Internet", am: "ኢንተርኔት" },
    icon: "🌐",
  },
  {
    key: "transport",
    kind: "expense",
    name: { en: "Transport", am: "ትራንስፖርት" },
    icon: "🚐",
  },
  {
    key: "health",
    kind: "expense",
    name: { en: "Health", am: "ጤና" },
    icon: "🏥",
  },
  {
    key: "education",
    kind: "expense",
    name: { en: "Education", am: "ትምህርት" },
    icon: "📚",
  },
  {
    key: "clothing",
    kind: "expense",
    name: { en: "Clothing", am: "ልብስ" },
    icon: "👕",
  },
  {
    key: "household",
    kind: "expense",
    name: { en: "Household", am: "የቤት ዕቃዎች" },
    icon: "🛋️",
  },
  { key: "equb", kind: "expense", name: { en: "Equb", am: "እቁብ" }, icon: "🤝" },
  {
    key: "iddir",
    kind: "expense",
    name: { en: "Iddir", am: "እድር" },
    icon: "🕊️",
  },
  {
    key: "charity",
    kind: "expense",
    name: { en: "Church/Mosque/charity", am: "ሃይማኖታዊ/ልግስና" },
    icon: "🙏",
  },
  {
    key: "family_support",
    kind: "expense",
    name: { en: "Family support", am: "የቤተሰብ ድጋፍ" },
    icon: "👨‍👩‍👧",
  },
  {
    key: "remittances",
    kind: "expense",
    name: { en: "Remittances", am: "የውጭ ሐዋላ" },
    icon: "✈️",
  },
  {
    key: "entertainment",
    kind: "expense",
    name: { en: "Entertainment", am: "መዝናኛ" },
    icon: "🎬",
  },
  {
    key: "business_expense",
    kind: "expense",
    name: { en: "Business expenses", am: "የንግድ ወጪ" },
    icon: "💼",
  },
  {
    key: "other_expense",
    kind: "expense",
    name: { en: "Other", am: "ሌላ" },
    icon: "📦",
  },
  {
    key: "salary",
    kind: "income",
    name: { en: "Salary", am: "ደመወዝ" },
    icon: "💰",
  },
  {
    key: "freelance",
    kind: "income",
    name: { en: "Freelance", am: "ራሱን የቻለ ስራ" },
    icon: "💻",
  },
  {
    key: "business_income",
    kind: "income",
    name: { en: "Business income", am: "የንግድ ገቢ" },
    icon: "🏪",
  },
  {
    key: "gifts",
    kind: "income",
    name: { en: "Gifts", am: "ስጦታ" },
    icon: "🎁",
  },
  {
    key: "remittance_in",
    kind: "income",
    name: { en: "Remittances received", am: "ከውጭ የተላከ" },
    icon: "💸",
  },
  {
    key: "other_income",
    kind: "income",
    name: { en: "Other income", am: "ሌላ ገቢ" },
    icon: "➕",
  },
];

async function run() {
  await mongoose.connect(env.MONGO_URI);
  console.log("[seed] connected");

  for (const p of PROVIDERS) {
    await Provider.updateOne({ name: p.name }, { $set: p }, { upsert: true });
  }
  console.log("[seed] providers upserted");

  for (const c of CATEGORIES) {
    await Category.updateOne(
      { user: null, key: c.key },
      { $set: { ...c, user: null, isDefault: true } },
      { upsert: true },
    );
  }
  console.log("[seed] default categories upserted");

  // NOTE: These SMS templates are PLACEHOLDERS and must be replaced with real
  // sample messages from each provider. The parser works as long as templates
  // define the named groups: amount, date, counterparty, ref.
  const templates = [
    {
      providerKey: "telebirr_placeholder",
      providerName: "Telebirr (placeholder — replace with real sample)",
      active: false, // disabled until real samples are provided
      patterns: [
        {
          regex: "You have (sent|received) (?<amount>[\\d,.]+) Birr",
          type: "expense",
          defaults: { paymentMethod: "telebirr" },
        },
      ],
    },
  ];
  for (const t of templates) {
    await SmsTemplate.updateOne(
      { providerKey: t.providerKey },
      { $set: t },
      { upsert: true },
    );
  }
  console.log("[seed] sms templates seeded (placeholders)");

  // Demo user
  const email = "demo@birrtracker.et";
  let demo = await User.findOne({ email });
  if (!demo) {
    const hash = await bcrypt.hash("Demo@12345", 12);
    demo = await User.create({
      name: "Demo User",
      email,
      password: hash,
      emailVerified: true,
      onboarded: true,
      consentAcceptedAt: new Date(),
      locale: "en",
      calendar: "ethiopian",
      currency: "ETB",
    });
    console.log("[seed] demo user created: demo@birrtracker.et / Demo@12345");
  }

  // Demo accounts
  const telebirr = await Provider.findOne({ name: "Telebirr" });
  const cbe = await Provider.findOne({ name: "Commercial Bank of Ethiopia" });
  const accountDefs = [
    { name: "Cash Wallet", type: "cash", openingBalanceMinor: 50000 },
    {
      name: "Telebirr",
      type: "mobile_money",
      provider: telebirr?._id,
      openingBalanceMinor: 250000,
    },
    {
      name: "CBE Savings",
      type: "bank",
      provider: cbe?._id,
      openingBalanceMinor: 1500000,
    },
  ];
  const demoAccounts = [];
  for (const def of accountDefs) {
    let acc = await Account.findOne({ user: demo._id, name: def.name });
    if (!acc)
      acc = await Account.create({
        ...def,
        user: demo._id,
        balanceMinor: def.openingBalanceMinor,
      });
    demoAccounts.push(acc);
  }
  console.log("[seed] demo accounts ready");

  // Demo transactions
  const existingTx = await Transaction.countDocuments({ user: demo._id });
  if (existingTx === 0) {
    const salaryCat = await Category.findOne({ user: null, key: "salary" });
    const rentCat = await Category.findOne({ user: null, key: "rent" });
    const foodCat = await Category.findOne({ user: null, key: "food" });
    const transportCat = await Category.findOne({
      user: null,
      key: "transport",
    });
    const equbCat = await Category.findOne({ user: null, key: "equb" });

    const now = new Date();
    const txs = [
      {
        type: "income",
        amountMinor: 3500000,
        toAccount: demoAccounts[2]._id,
        category: salaryCat._id,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        payee: "Employer",
        paymentMethod: "bank_transfer",
      },
      {
        type: "expense",
        amountMinor: 800000,
        fromAccount: demoAccounts[2]._id,
        category: rentCat._id,
        date: new Date(now.getFullYear(), now.getMonth(), 3),
        payee: "Landlord",
        paymentMethod: "bank_transfer",
      },
      {
        type: "expense",
        amountMinor: 45000,
        fromAccount: demoAccounts[1]._id,
        category: foodCat._id,
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        payee: "Shola Market",
        paymentMethod: "telebirr",
      },
      {
        type: "expense",
        amountMinor: 3000,
        fromAccount: demoAccounts[0]._id,
        category: transportCat._id,
        date: new Date(now.getFullYear(), now.getMonth(), 6),
        payee: "Taxi",
        paymentMethod: "cash",
      },
      {
        type: "expense",
        amountMinor: 50000,
        fromAccount: demoAccounts[1]._id,
        category: equbCat._id,
        date: new Date(now.getFullYear(), now.getMonth(), 7),
        payee: "Equb group",
        paymentMethod: "telebirr",
      },
    ];
    await Transaction.insertMany(txs.map((t) => ({ ...t, user: demo._id })));
    console.log("[seed] demo transactions inserted");
  }

  await mongoose.disconnect();
  console.log("[seed] done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
