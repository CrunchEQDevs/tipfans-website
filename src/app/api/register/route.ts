// ✅ Arquivo: src/app/api/register/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, email, password, idade } = await req.json();

    if (!username || !email || !password || !idade) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const adminToken = process.env.WP_ADMIN_TOKEN;
    if (!adminToken) {
      return NextResponse.json({ message: 'Token de autenticação não configurado.' }, { status: 500 });
    }

    // Cria o usuário no WordPress
    const wpRes = await fetch('https://tipfans.com/wp/wp-json/wp/v2/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ username, email, password })
    });

    const wpData = await wpRes.json();

    if (!wpRes.ok) {
      return NextResponse.json({ message: wpData.message || 'Erro ao criar usuário no WordPress.' }, { status: 400 });
    }

    // Busca o papel (role) do novo usuário
    const meRes = await fetch('https://tipfans.com/wp/wp-json/wp/v2/users/me', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${wpData.token}`,
      },
    });

    const meData = await meRes.json();
    const papel = meData?.roles?.[0] || 'subscriber';

    // Redirecionamento com base no papel
    if (papel === 'administrator') {
      return NextResponse.json({ redirect: 'https://tipfans.com/wp/wp-admin/index.php', role: papel });
    }

    return NextResponse.json({ message: 'Usuário criado com sucesso.', role: papel });
  } catch (error) {
    console.error('[REGISTER_API_ERROR]', error);
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}
