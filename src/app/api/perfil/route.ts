// src/app/api/perfil/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, perfil: "dados do usuário" });
}
