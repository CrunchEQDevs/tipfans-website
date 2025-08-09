import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import TestDoc from '@/models/TestDoc';

export async function GET() {
  try {
    await connectDB();
    const docs = await TestDoc.find().sort({ createdAt: -1 }).limit(10);
    return NextResponse.json({ status: 'ok', data: docs });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json(
        { status: 'error', error: 'O campo "name" é obrigatório' },
        { status: 400 }
      );
    }
    await connectDB();
    const newDoc = await TestDoc.create({ name: body.name });
    return NextResponse.json({ status: 'created', data: newDoc });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
