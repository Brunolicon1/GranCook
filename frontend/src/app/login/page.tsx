'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (typeof success === 'string') {
        setError(`Erro: ${success}`);
        setIsLoading(false);
      } else if (!success) {
        setError('Usuário ou senha inválidos.');
        setIsLoading(false);
      } else {
        // Redireciona o usuário para a home para que a home direcione para o lugar correto
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(`Erro na requisição: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GranCook PDV</h1>
          <p className="text-slate-400 mt-1">Acesso ao sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuário"
              required
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
           <p className="text-slate-500 text-sm mb-2">Usuários de Teste:</p>
           <div className="flex justify-center gap-4 text-xs font-mono text-slate-400">
             <span>garcom:123</span>
             <span>cozinha:123</span>
             <span>gerente:123</span>
           </div>
        </div>
      </div>
    </div>
  );
}
