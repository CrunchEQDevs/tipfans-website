import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import TestDoc from '@/models/TestDoc';

// Helper tipado
function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// Autenticação admin
function getAuth(req: Request) {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}
function requireAdmin(req: Request) {
  const token = getAuth(req);
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return { ok: false, error: 'ADMIN_API_TOKEN não definido' };
  if (!token) return { ok: false, error: 'Token ausente' };
  if (token !== expected) return { ok: false, error: 'Token inválido' };
  return { ok: true };
}

// GET - lista documentos
export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      TestDoc.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      TestDoc.countDocuments(),
    ]);

    return json({ status: 'ok', page, limit, total, data });
  } catch (e) {
    return json({ status: 'error', error: (e as Error).message }, 500);
  }
}

// POST - cria documento
export async function POST(req: Request) {
  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return json({ status: 'error', error: auth.error }, 401);

    const body = await req.json().catch(() => ({}));
    const name = (body as { name?: string }).name?.trim();

    if (!name || name.length < 2 || name.length > 100) {
      return json({ status: 'error', error: 'Campo "name" (2–100) obrigatório' }, 400);
    }

    await connectDB();
    const created = await TestDoc.create({ name });
    return json({ status: 'created', data: created }, 201);
  } catch (e) {
    return json({ status: 'error', error: (e as Error).message }, 500);
  }
}
