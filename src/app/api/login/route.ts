
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb' // <--- esta linha estava faltando
import Admin from '@/models/Admin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    await connectToDatabase()
    console.log('🧠 Conexão feita')

    const body = await req.json()
    console.log('🔐 Body recebido:', body)

    const { email, password } = body

    const admin = await Admin.findOne({ email })
    console.log('👤 Admin encontrado:', admin)

    if (!admin) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, admin.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET!, {
      expiresIn: '2h',
    })

    return NextResponse.json({ token })
  } catch (err) {
    console.error('❌ Erro interno no login:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
