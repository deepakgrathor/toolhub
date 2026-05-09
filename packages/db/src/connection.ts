import _mongoose from "mongoose";

// Handle ESM/CJS interop: webpack may wrap the CJS mongoose module in a
// namespace object { default: <instance> }. Normalise to the real instance.
const mongoose =
  (_mongoose as unknown as { default: typeof _mongoose }).default ?? _mongoose;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cache;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in environment variables");

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export function disconnectDB(): Promise<void> {
  cache.conn = null;
  cache.promise = null;
  return mongoose.disconnect();
}
