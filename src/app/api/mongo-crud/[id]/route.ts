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

// GET - buscar documento por ID
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await connectDB();
    const doc = await TestDoc.findById(id);
    if (!doc) return json({ status: 'error', error: 'Não encontrado' }, 404);
    return json({ status: 'ok', data: doc });
  } catch (e) {
    return json({ status: 'error', error: (e as Error).message }, 500);
  }
}

// PUT - atualizar documento por ID
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return json({ status: 'error', error: auth.error }, 401);

    const body = await req.json().catch(() => ({}));
    const name = (body as { name?: string }).name?.trim();

    if (!name || name.length < 2 || name.length > 100) {
      return json({ status: 'error', error: 'Campo "name" (2–100) obrigatório' }, 400);
    }

    await connectDB();
    const updated = await TestDoc.findByIdAndUpdate(
      id,
      { $set: { name } },
      { new: true, runValidators: true }
    );
    if (!updated) return json({ status: 'error', error: 'Não encontrado' }, 404);

    return json({ status: 'updated', data: updated });
  } catch (e) {
    return json({ status: 'error', error: (e as Error).message }, 500);
  }
}

// DELETE - apagar documento por ID
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return json({ status: 'error', error: auth.error }, 401);

    await connectDB();
    const deleted = await TestDoc.findByIdAndDelete(id);
    if (!deleted) return json({ status: 'error', error: 'Não encontrado' }, 404);

    return json({ status: 'deleted', data: deleted });
  } catch (e) {
    return json({ status: 'error', error: (e as Error).message }, 500);
  }
}
