// Worker entrypoint — BullMQ AI job processing
// Placeholder: full implementation in Session B1+
console.log("[worker] Toolspire worker starting...");
console.log("[worker] BullMQ and AI job queues will be wired up in Phase 2.");

process.on("SIGTERM", () => {
  console.log("[worker] Shutting down...");
  process.exit(0);
});
