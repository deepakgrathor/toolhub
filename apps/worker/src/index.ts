import { worker } from "./worker";
import { aiQueue } from "./queue";

console.log("[worker] Toolspire worker started, listening for jobs...");

async function shutdown() {
  console.log("[worker] Graceful shutdown...");
  await worker.close();
  await aiQueue.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
