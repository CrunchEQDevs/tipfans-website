import { NextResponse } from 'next/server';

type UserLite = { id: string; name: string; avatar?: string | null };
type Comment = { id: string; author: UserLite; content: string; createdAt: string };

type Store = Record<string, Comment[]>;

function getStore(): Store {
  const g = globalThis as any;
  if (!g.__COMM_NEWS_COMMENTS__) g.__COMM_NEWS_COMMENTS__ = {};
  return g.__COMM_NEWS_COMMENTS__ as Store;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const items = store[params.id] ?? [];
  return NextResponse.json({ items });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({} as any));
  const content: string = String(body.content || '').trim();
  if (!content || content.length < 2) {
    return NextResponse.json(
      { error: 'Comentário muito curto.' },
      { status: 400 }
    );
  }

  const c: Comment = {
    id: `c${Date.now()}`,
    author: { id: 'guest', name: 'Você', avatar: '/user.png' }, // troque pelo usuário real
    content,
    createdAt: new Date().toISOString(),
  };

  const store = getStore();
  store[params.id] = [...(store[params.id] ?? []), c];

  return NextResponse.json({ item: c }, { status: 201 });
}
