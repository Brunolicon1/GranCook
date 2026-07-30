import React from 'react';
import { ChefHat, LayoutGrid, Settings, LogOut, Bell } from 'lucide-react';

export default function PDVLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col md:flex-row">
      <aside className="w-full md:w-24 bg-slate-900 border-r border-slate-800 flex flex-row md:flex-col items-center justify-between py-6 px-4 md:px-0">
        <div className="flex flex-row md:flex-col items-center gap-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ChefHat className="text-white" size={24} />
          </div>
          
          <nav className="flex flex-row md:flex-col gap-6">
            <button className="p-3 bg-slate-800 text-blue-400 rounded-xl transition-colors shadow-inner border border-slate-700">
              <LayoutGrid size={24} />
            </button>
            <button className="p-3 text-slate-500 hover:text-slate-300 transition-colors">
              <Bell size={24} />
            </button>
            <button className="p-3 text-slate-500 hover:text-slate-300 transition-colors">
              <Settings size={24} />
            </button>
          </nav>
        </div>

        <button className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors mt-0 md:mt-auto">
          <LogOut size={24} />
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="flex-1 overflow-y-auto z-10 p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
