'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

type User = {
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('userRole');
    setToken(null);
    setUser(null);
  }, []);

  const validateToken = useCallback(async (jwt: string) => {
    try {
      const res = await fetch('https://tipfans.com/wp/wp-json/wp/v2/users/me', {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error('⚠️ Erro ao converter resposta da validação em JSON', err);
        logout();
        return;
      }

      if (res.ok) {
        setUser({ email: data.email, name: data.name });

        // ✅ Salva papel do usuário
        if (data.roles?.[0]) {
          localStorage.setItem('userRole', data.roles[0]);
        } else {
          localStorage.setItem('userRole', 'subscriber');
        }
      } else {
        console.warn('⚠️ Token inválido ou expirado.');
        logout();
      }
    } catch (err) {
      console.error('❌ Erro ao validar token:', err);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    if (savedToken) {
      setToken(savedToken);
      validateToken(savedToken);
    }
  }, [validateToken]);

  async function login(username: string, password: string): Promise<boolean> {
    try {
      const res = await fetch('https://tipfans.com/wp/wp-json/jwt-auth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error('⚠️ Resposta não é JSON. Verifique a API do WordPress.', err);
        return false;
      }

      if (res.ok && data.token) {
        localStorage.setItem('jwt_token', data.token);
        setToken(data.token);

        // ⚠️ fallback: se a role vier aqui já, salva (não obrigatório)
        if (data.data?.roles?.[0]) {
          localStorage.setItem('userRole', data.data.roles[0]);
        }

        await validateToken(data.token);
        return true;
      } else {
        console.error('❌ Login falhou:', data?.message || 'Erro desconhecido');
        return false;
      }
    } catch (err) {
      console.error('❌ Erro de conexão no login:', err);
      return false;
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
}
