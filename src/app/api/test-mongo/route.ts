// src/app/api/test-mongo/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo'; // ajuste o caminho

export async function GET() {
  try {
    const conn = await connectDB();
    return NextResponse.json({
      status: '✅ Conectado ao MongoDB',
      host: conn.connection.host,
      dbName: conn.connection.name,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: '❌ Erro ao conectar', error: (error as Error).message }, { status: 500 });
  }
}
