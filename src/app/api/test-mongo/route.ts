import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import UserExtra from '@/models/UserExtra';

export async function GET() {
  try {
    await connectDB();

    const users = await UserExtra.find();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro na conexão Mongo:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
