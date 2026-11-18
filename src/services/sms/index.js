// SMS provider interface. Replace ConsoleProvider with a real adapter
// (Afro Message, GeezSMS, Twilio) — each must implement send(phone, text).
import env from "../../config/env.js";
import ConsoleProvider from "./consoleProvider.js";

const providers = { console: ConsoleProvider };

export function getSmsProvider() {
  return providers[env.SMS_PROVIDER] || providers.console;
}

export async function sendOtp(phone, code) {
  return getSmsProvider().send(phone, `Your Birr Tracker code: ${code}`);
}
