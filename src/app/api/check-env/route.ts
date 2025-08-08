import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    mongoUri: process.env.MONGODB_URI ? '✅ Definido' : '❌ Não encontrado',
    env: process.env.NODE_ENV,
  });
}

