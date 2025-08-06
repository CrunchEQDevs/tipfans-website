'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/')
    } else {
      setIsAuthenticated(true)
    }

    setLoading(false)
  }, [router])

  if (loading) return <div className="p-10">Carregando...</div>

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-10 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-6">🎉 Bem-vindo à Área Admin</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <p className="text-lg">Aqui você poderá visualizar dados protegidos, gerenciar conteúdos e muito mais.</p>

        <button
          onClick={() => {
            localStorage.removeItem('token')
            router.push('/')
          }}
          className="mt-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
