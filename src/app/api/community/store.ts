import { NextResponse } from 'next/server';

type Sport = 'futebol' | 'basquete' | 'tenis' | 'esports';

type UserLite = { id: string; name: string; avatar?: string | null };
type Comment = { id: string; author: UserLite; content: string; createdAt: string };
type Post = {
  id: string;
  author: UserLite;
  sport: Sport;
  content: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  comments: Comment[];
};

// Banco em memória
const DB: { posts: Post[] } = {
  posts: [
    {
      id: 'p1',
      author: { id: 'u1', name: 'tipsters teste', avatar: '/user.png' },
      sport: 'esports',
      content: 'Análise curta: time A vem forte, gosto do handicap +1.5.',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      likes: 3,
      commentsCount: 1,
      comments: [
        {
          id: 'c1',
          author: { id: 'u2', name: 'Razor7', avatar: '/user.png' },
          content: 'Concordo! Odd de valor.',
          createdAt: new Date(Date.now() - 1800_000).toISOString(),
        },
      ],
    },
  ],
};

export async function GET() {
  // Em produção, adicione filtros/paginação
  return NextResponse.json({ items: DB.posts });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const content: string = String(body.content || '').trim();
  const sport: Sport = (body.sport || 'futebol') as Sport;

  if (!content || content.length < 3) {
    return NextResponse.json(
      { error: 'Conteúdo muito curto.' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const item: Post = {
    id: `p${Date.now()}`,
    author: { id: 'guest', name: 'Você', avatar: '/user.png' }, // troque pelo usuário real
    sport,
    content,
    createdAt: now,
    likes: 0,
    commentsCount: 0,
    comments: [],
  };

  DB.posts.unshift(item);
  return NextResponse.json({ item }, { status: 201 });
}
