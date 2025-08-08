// app/api/test-mongo/route.ts
import { connectDB } from '@/lib/mongo';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: '✅ Conectado ao MongoDB' });
  } catch (error) {
    console.error('Erro de conexão:', error);
    return NextResponse.json({ status: '❌ Erro de conexão', error: String(error) }, { status: 500 });
  }
}
