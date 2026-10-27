import React from 'react';
import Image from 'next/image';
import { Menu, Filter, Shield, Sparkles } from 'lucide-react';
import type { NavigationTab, UserRole } from '../types/qa';

interface MobileHeaderProps {
  onOpenMenu: () => void;
  onOpenFilter?: () => void;
  currentTab: NavigationTab;
  currentUser: {
    role: UserRole;
  };
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenMenu,
  onOpenFilter,
  currentTab,
  currentUser,
}) => {
  return (
    <header className="lg:hidden bg-[#2D3133] text-white px-4 py-3 border-b border-[#3C3F40] sticky top-0 z-40 flex items-center justify-between shadow-md">
      {/* Figma BARS Component #514:934 */}
      <button
        onClick={onOpenMenu}
        aria-label="Abrir Menu de Navegação"
        className="p-2 -ml-1 text-gray-200 hover:text-white rounded-lg hover:bg-[#3C3F40] active:scale-95 transition-all"
      >
        <Menu size={24} />
      </button>

      {/* Center Brand */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-[#EA7913] flex items-center justify-center font-bold text-white text-xs shadow-sm shadow-[#EA7913]/30">
          Q
        </div>
        <div className="flex items-center gap-1 font-sans">
          <span className="font-bold text-sm tracking-tight text-white">QORE</span>
          <span className="text-[#EA7913] font-bold text-sm">ANALYTICS</span>
        </div>
      </div>

      {/* Right Action: Filter or Role indicator */}
      <div className="flex items-center gap-2">
        {onOpenFilter && (
          <button
            onClick={onOpenFilter}
            aria-label="Filtros de Teste"
            className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-[#3C3F40]"
          >
            <Filter size={18} />
          </button>
        )}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EA7913]/20 text-[#EA7913] border border-[#EA7913]/30 uppercase font-mono">
          {currentUser.role}
        </span>
      </div>
    </header>
  );
};
