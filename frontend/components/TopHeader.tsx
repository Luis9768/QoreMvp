import React from 'react';
import { 
  ChevronRight, 
  FileDown, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import type { NavigationTab, UserRole } from '../types/qa';

interface TopHeaderProps {
  currentTab: NavigationTab;
  onNavigateToPrompt: () => void;
  onOpenInviteModal?: () => void;
  onExportAudit?: () => void;
  userRole: UserRole;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onNavigateToPrompt,
  onOpenInviteModal,
  onExportAudit,
  userRole,
}) => {
  const getBreadcrumb = () => {
    switch (currentTab) {
      case 'dashboard':
        return ['Início', 'Visão Geral', 'Dashboard de Telemetria'];
      case 'prompt':
        return ['Início', 'Roteiro de Testes', 'Geração Assistida por IA'];
      case 'detalhes':
        return ['Início', 'Auditoria de Execução', 'Player & Telemetria Playwright'];
      case 'listagem':
        return ['Início', 'Histórico', 'Repositório de Execuções'];
      case 'rtm':
        return ['Início', 'Conformidade', 'Matriz de Rastreabilidade (ISO 29119)'];
      case 'users':
        return ['Início', 'Administração', 'Usuários & Permissões (RBAC)'];
      default:
        return ['Início', 'Qore Analytics'];
    }
  };

  const getTitleAndSubtitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Painel Geral de Qualidade & Telemetria',
          subtitle: 'Métricas consolidadas de testes E2E, taxa de aprovação no Quality Gate e análise de regressão contínua.',
          badge: 'Live Analytics',
        };
      case 'prompt':
        return {
          title: 'Geração de Roteiro & Análise de Commits',
          subtitle: 'Planejamento autônomo com IA Quantum AI: inspeciona git diff, formula critérios mínimos e gera testes E2E.',
          badge: 'Quantum AI Engine',
        };
      case 'detalhes':
        return {
          title: 'Relatório do Fluxo & Telemetria Playwright',
          subtitle: 'Inspeção detalhada de telemetria visual, rastreamento de interação Playwright e validações de estado do DOM.',
          badge: 'High-Fi Recording',
        };
      case 'listagem':
        return {
          title: 'Histórico de Testes & Auditoria Unificada',
          subtitle: 'Repositório unificado de auditoria, execuções automatizadas (Web E2E & APIs) e rastreabilidade contínua.',
          badge: 'Repositório Ativo',
        };
      case 'rtm':
        return {
          title: 'Requirements Traceability Matrix (RTM)',
          subtitle: 'Rastreabilidade bidirecional de ponta a ponta em conformidade com as normas internacionais ISO/IEC/IEEE 29119 e ISTQB.',
          badge: 'ISO/IEC/IEEE 29119',
        };
      case 'users':
        return {
          title: 'Gerenciamento de Usuários & Controle de Acesso',
          subtitle: 'Gestão corporativa de membros da organização, vínculo Dev -> Empresa, assinaturas de QA e perfis operacionais.',
          badge: 'RBAC v3.1',
        };
    }
  };

  const crumbs = getBreadcrumb();
  const info = getTitleAndSubtitle();

  return (
    <div className="bg-[#FFFFFF] border-b border-[#D8DADC] px-4 sm:px-8 py-5 shadow-sm">
      {/* Breadcrumb row */}
      <div className="flex items-center gap-1.5 text-xs text-[#565E74] mb-2 font-medium">
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight size={13} className="text-gray-400 shrink-0" />}
            <span className={idx === crumbs.length - 1 ? 'text-[#191C1E] font-semibold' : ''}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Main title & action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1E] font-sans">
              {info.title}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFE3C9] text-[#944A00] border border-[#EA7913]/30 font-mono uppercase">
              {info.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#565E74] mt-1 max-w-3xl">
            {info.subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onExportAudit && (
            <button
              onClick={onExportAudit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F2F4F6] text-[#2D3133] border border-[#D8DADC] text-xs font-semibold shadow-sm transition-all"
            >
              <FileDown size={14} className="text-[#565E74]" />
              <span>Exportar Auditoria</span>
            </button>
          )}

          {userRole === 'Admin' && onOpenInviteModal && (
            <button
              onClick={onOpenInviteModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3133] hover:bg-[#1F2937] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <UserPlus size={14} />
              <span>+ Novo Usuário</span>
            </button>
          )}

          <button
            onClick={onNavigateToPrompt}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA7913] hover:bg-[#D56A0C] text-white text-xs font-semibold shadow-md shadow-[#EA7913]/25 active:scale-95 transition-all"
          >
            <Sparkles size={14} />
            <span>+ Novo Planejamento IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
