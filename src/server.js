import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";
import { startRecurringJob } from "./jobs/recurring.js";

async function main() {
  await connectDB();
  const app = createApp();
  startRecurringJob();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
