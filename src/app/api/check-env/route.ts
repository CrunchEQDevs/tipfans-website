import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const uri = process.env.MONGODB_URI || '';
  const hash = uri
    ? crypto.createHash('sha256').update(uri).digest('hex')
    : null;

  return NextResponse.json({
    mongoUri: uri ? '✅ Definido' : '❌ Não encontrado',
    uriHash: hash, // identificador seguro da URI
    env: process.env.NODE_ENV,
  });
}
