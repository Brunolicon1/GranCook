'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles?: string[]; // Ex: ['Garçom', 'Gerente']
};

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && allowedRoles.length > 0) {
        // Verifica se o usuário tem pelo menos um dos grupos permitidos
        const hasAccess = user.grupos.some(grupo => allowedRoles.includes(grupo));
        if (!hasAccess) {
          // Redireciona para a página principal baseada no cargo dele se não tiver acesso
          if (user.grupos.includes('Cozinha')) {
            router.push('/cozinha');
          } else if (user.grupos.includes('Garçom')) {
            router.push('/pdv');
          } else {
            router.push('/login'); // Ou tela de "Acesso Negado"
          }
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se tem required roles, mas o user não tem, não renderiza nada até o redirect
  if (allowedRoles && user) {
    const hasAccess = user.grupos.some(grupo => allowedRoles.includes(grupo));
    if (!hasAccess) return null;
  }

  return <>{children}</>;
}
