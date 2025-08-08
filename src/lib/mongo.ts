import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI não definida no .env');
}

// Cache global para evitar múltiplas conexões no dev
declare global {
  var mongooseCache: { conn: Mongoose | null; promise: Promise<Mongoose> | null };
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<Mongoose> {
  if (global.mongooseCache.conn) return global.mongooseCache.conn;

  if (!global.mongooseCache.promise) {
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  global.mongooseCache.conn = await global.mongooseCache.promise;
  return global.mongooseCache.conn;
}
