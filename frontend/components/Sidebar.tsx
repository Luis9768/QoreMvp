import React from 'react';
import Image from 'next/image';
import { 
  LineChart, 
  ClipboardList, 
  ListChecks, 
  Video, 
  Users, 
  Table2, 
  Server, 
  Database, 
  Sparkles,
  Shield,
  Building,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Code2,
  Eye,
  GraduationCap
} from 'lucide-react';
import type { NavigationTab, UserRole } from '../types/qa';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: {
    name: string;
    email: string;
    role: UserRole;
    company: string;
  };
  onRoleChange: (role: UserRole) => void;
  backendStatus: {
    online: boolean;
    db: string;
    model: string;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onRoleChange,
  backendStatus,
}) => {
  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LineChart size={20} />,
      badge: 'Visão Geral'
    },
    {
      id: 'commits',
      label: 'Análise de Commits',
      icon: <Code2 size={20} />,
      badge: 'Git Diff & IA'
    },
    {
      id: 'prompt',
      label: 'Geração de Prompts',
      icon: <ClipboardList size={20} />,
      badge: 'Roteiros'
    },
    {
      id: 'consistency',
      label: 'Consistência de DOM',
      icon: <Eye size={20} />,
      badge: 'Self-Healing'
    },
    {
      id: 'detalhes',
      label: 'Detalhes do Teste',
      icon: <Video size={20} />,
      badge: 'Player MP4'
    },
    {
      id: 'listagem',
      label: 'Histórico de Testes',
      icon: <ListChecks size={20} />,
    },
    {
      id: 'rtm',
      label: 'Matriz RTM (ISO 29119)',
      icon: <Table2 size={20} />,
      badge: 'Rastreabilidade'
    },
    {
      id: 'users',
      label: 'Usuários & Permissões',
      icon: <Users size={20} />,
      badge: 'RBAC v3.1'
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-[#2D3133] text-white border-r border-[#3C3F40] min-h-screen shrink-0 sticky top-0 h-screen select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#3C3F40] flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#EA7913] flex items-center justify-center shadow-md shadow-[#EA7913]/30 shrink-0 overflow-hidden relative">
          <Image 
            src="/logo-qore.png" 
            alt="Qore Analytics" 
            width={40} 
            height={40} 
            className="object-cover"
            onError={(e) => {
              // Fallback se imagem não carregar
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-extrabold text-white text-lg tracking-wider">Q</span>
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-base tracking-tight text-white font-sans">QORE</h1>
            <span className="text-[#EA7913] font-bold text-base">ANALYTICS</span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Enterprise QA AI</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase font-sans">
          Navegação Principal
        </p>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-[#EA7913] text-white shadow-md shadow-[#EA7913]/25 font-semibold'
                  : 'text-gray-300 hover:bg-[#3C3F40] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-black/25 text-white' : 'bg-[#3C3F40] text-gray-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Link para Capa Oficial de TCC SENAI */}
        <div className="pt-3 px-1">
          <a
            href="/capa.html"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#61AFF2] bg-[#005DAA]/15 border border-[#005DAA]/40 hover:bg-[#005DAA]/25 transition-all"
            title="Abrir Capa Oficial A4 de TCC com Logo SENAI em Azul"
          >
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-[#61AFF2]" />
              <span>Capa TCC SENAI (A4)</span>
            </div>
            <ExternalLink size={12} className="text-[#61AFF2]/70" />
          </a>
        </div>
      </div>

      {/* System Health Status */}
      <div className="p-3 mx-3 mb-3 bg-[#232729] rounded-lg border border-[#3C3F40] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1.5">
            <Server size={13} className="text-[#EA7913]" /> Backend .NET 10
          </span>
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${backendStatus.online ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>
            {backendStatus.online ? (
              <>
                <CheckCircle2 size={12} /> Online
              </>
            ) : (
              <>
                <XCircle size={12} /> Offline
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <Database size={13} className="text-blue-400" /> Banco
          </span>
          <span className="font-mono text-gray-300 truncate max-w-[120px]" title={backendStatus.db}>
            SQLite Core
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#EA7913]" /> Motor IA
          </span>
          <span className="font-mono text-[#EA7913] font-bold">Quantum AI</span>
        </div>
      </div>

      {/* User & Role Switcher */}
      <div className="p-3.5 border-t border-[#3C3F40] bg-[#232729] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#EA7913]/20 border border-[#EA7913]/40 flex items-center justify-center text-xs font-bold text-[#EA7913] shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
              <Building size={10} /> {currentUser.company}
            </p>
          </div>
        </div>

        {/* Role Badge Dropdown */}
        <select
          value={currentUser.role}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className="bg-[#2D3133] border border-[#3C3F40] text-gray-200 text-[11px] font-semibold rounded px-2 py-1 outline-none focus:border-[#EA7913] cursor-pointer"
          title="Alternar Perfil RBAC"
        >
          <option value="Dev">Dev</option>
          <option value="QA">QA</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
    </aside>
  );
};
