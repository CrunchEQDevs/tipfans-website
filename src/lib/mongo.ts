import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('❌ Defina MONGODB_URI no arquivo .env.local');
}

// 🔁 Cache global para conexão em desenvolvimento
declare global {
  var mongooseConn: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

let cached = globalThis.mongooseConn;

if (!cached) {
  cached = globalThis.mongooseConn = { conn: null, promise: null };
}

export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      dbName: 'tipfans',
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
