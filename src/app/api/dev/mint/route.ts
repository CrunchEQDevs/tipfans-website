import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'tf_token';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'teste@example.com';
    const nome = searchParams.get('nome') || 'Teste Local';

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'JWT_SECRET ausente' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const token = await new SignJWT({
      email,
      name: nome,
      role: 'Subscritor',
      avatarUrl: '',
      memberSince: now,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(email)
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(secret));

    const cookieStore = await cookies();
    cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 });
  }
}
