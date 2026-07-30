'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Map, 
  ChefHat, 
  LogOut,
  Settings,
  ReceiptText
} from 'lucide-react';

export default function GerenteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/gerente', icon: LayoutDashboard },
    { name: 'Cardápio / Produtos', path: '/gerente/produtos', icon: UtensilsCrossed },
    { name: 'Histórico de Vendas', path: '/gerente/historico', icon: ReceiptText },
    { name: 'Mapa de Mesas (PDV)', path: '/pdv', icon: Map, external: true },
    { name: 'Cozinha (KDS)', path: '/cozinha', icon: ChefHat, external: true },
  ];

  return (
    <AuthGuard allowedRoles={['Gerente']}>
      <div className="min-h-screen bg-slate-950 flex text-slate-300 font-sans">
        
        {/* Sidebar Lateral */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl flex-shrink-0 hidden md:flex">
          {/* Logo Area */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Gestão</h1>
              <p className="text-xs text-indigo-400 font-medium tracking-wide">GranCook</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  target={item.external ? '_blank' : '_self'}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout Area */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{user?.username}</span>
                <span className="text-xs text-slate-500">Gerente</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Sair do sistema"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>

      </div>
    </AuthGuard>
  );
}
