import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: '✅ Conectado ao MongoDB' });
  } catch (error: any) {
    console.error('Erro ao conectar:', error.message);
    return NextResponse.json({ status: '❌ Erro na conexão', erro: error.message }, { status: 500 });
  }
}
