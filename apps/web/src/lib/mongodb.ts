import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null, uri: null };
global._mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to apps/web/.env.local.");
  }

  // If the connection string changed (e.g. during local dev), drop the stale
  // cached connection/promise instead of reusing a connection to the old URI.
  if (cache.uri !== uri) {
    cache.conn = null;
    cache.promise = null;
    cache.uri = uri;
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
