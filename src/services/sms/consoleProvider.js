// Development SMS provider: prints the message to the server console.
// Phone numbers are masked so they never appear in plain logs.
// To add a real gateway (Afro Message, GeezSMS, Twilio), create a file
// that exports an object with the same `send(phone, text)` method and
// register it in ./index.js.
const ConsoleProvider = {
  async send(phone, text) {
    const masked = String(phone).replace(/\d(?=\d{2})/g, "*");
    console.log("[sms] to=%s text=%s", masked, text);
    return { ok: true };
  },
};

export default ConsoleProvider;
