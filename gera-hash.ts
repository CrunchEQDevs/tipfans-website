// gera-hash.ts
import bcrypt from 'bcryptjs'

async function gerar() {
  const senha = 'SenhaSegura123!' // <- troque aqui se quiser
  const hash = await bcrypt.hash(senha, 10)
  console.log('🔐 Hash gerado:', hash)
}

gerar()
