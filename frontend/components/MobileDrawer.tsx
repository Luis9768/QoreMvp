import React from 'react';
import { 
  X, 
  LineChart, 
  ClipboardList, 
  ListChecks, 
  Video, 
  Users, 
  Table2, 
  Server, 
  Database, 
  Sparkles,
  Building 
} from 'lucide-react';
import type { NavigationTab, UserRole } from '../types/qa';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: {
    name: string;
    email: string;
    role: UserRole;
    company: string;
  };
  onRoleChange: (role: UserRole) => void;
  backendOnline: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onTabChange,
  currentUser,
  onRoleChange,
  backendOnline,
}) => {
  if (!isOpen) return null;

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LineChart size={20} /> },
    { id: 'prompt', label: 'Geração de Prompts', icon: <ClipboardList size={20} /> },
    { id: 'detalhes', label: 'Detalhes do Teste (Player)', icon: <Video size={20} /> },
    { id: 'listagem', label: 'Histórico de Testes', icon: <ListChecks size={20} /> },
    { id: 'rtm', label: 'Matriz RTM (ISO 29119)', icon: <Table2 size={20} /> },
    { id: 'users', label: 'Usuários & Permissões', icon: <Users size={20} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer Panel - Figma #688:740 style */}
      <div className="relative w-4/5 max-w-xs bg-[#2D3133] text-white h-full flex flex-col z-10 shadow-2xl border-r border-[#3C3F40] animate-in slide-in-from-left duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-[#3C3F40] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EA7913] flex items-center justify-center font-bold text-white text-sm">
              Q
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight">QORE ANALYTICS</p>
              <p className="text-[10px] text-gray-400">Plataforma Mobile QA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#3C3F40]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#EA7913] text-white font-semibold shadow-md'
                    : 'text-gray-300 hover:bg-[#3C3F40] hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User and Role */}
        <div className="p-4 border-t border-[#3C3F40] bg-[#232729] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Building size={10} /> {currentUser.company}
              </p>
            </div>
            <select
              value={currentUser.role}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-[#2D3133] border border-[#3C3F40] text-gray-200 text-xs rounded px-2 py-1"
            >
              <option value="Dev">Dev</option>
              <option value="QA">QA</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#3C3F40]/60">
            <span className="text-gray-400">Status .NET 10:</span>
            <span className={`font-semibold ${backendOnline ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>
              {backendOnline ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
