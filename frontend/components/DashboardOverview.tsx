import React from 'react';
import { 
  LineChart, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Play, 
  ExternalLink 
} from 'lucide-react';
import type { NavigationTab } from '../types/qa';

interface DashboardOverviewProps {
  onNavigate: (tab: NavigationTab) => void;
  recentSuitesCount: number;
  successRate: number;
  totalCriteriosDefinidos: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  recentSuitesCount,
  successRate,
  totalCriteriosDefinidos,
}) => {
  return (
    <div className="space-y-6">
      {/* Telemetry and Latency Card - Figma #539:1611 */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8DADC]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#191C1E] font-sans">
                Histórico de Execuções e Latência de Rede
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-mono">
                p90 Latency
              </span>
            </div>
            <p className="text-xs text-[#565E74]">
              Volume horário de requisições ponderado contra picos de latência (ms) e estabilidade de DOM
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#191C1E]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#49CC90]" />
              <span>Execuções Bem-Sucedidas (48.638)</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[#565E74]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F93E3E]" />
              <span>Falhas / Timeouts (282)</span>
            </div>
          </div>
        </div>

        {/* Visual Simulated Telemetry Chart */}
        <div className="bg-[#F7F9FB] rounded-xl p-4 border border-[#E2E8F0]">
          <div className="h-44 w-full flex items-end justify-between gap-2 px-2 pt-6">
            {[45, 60, 52, 78, 65, 88, 92, 84, 76, 95, 89, 98].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div 
                  style={{ height: `${val}%` }} 
                  className="w-full bg-[#EA7913] rounded-t-md hover:bg-[#D56A0C] transition-all relative flex justify-center shadow-sm"
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[10px] font-bold font-mono bg-[#2D3133] text-white px-1.5 py-0.5 rounded transition-opacity">
                    {val * 10}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">
                  {String(idx * 2).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#565E74] gap-2">
            <span className="font-mono text-[11px]">
              Capacidade máxima aferida: <strong className="text-[#191C1E]">4.820 req/min</strong>
            </span>
            <span className="font-mono text-[11px]">
              Taxa de descarte de pacotes (Packet Drop): <strong className="text-[#047857]">0.001%</strong>
            </span>
            <span className="font-mono text-[11px]">
              Latência Média p90: <strong className="text-[#191C1E]">18.4ms</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Launch & Module Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Health */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-sm text-[#191C1E] font-sans flex items-center justify-between">
            <span>Status dos Módulos Integrados</span>
            <span className="text-[10px] font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded">Operacional</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#F7F9FB] rounded-lg border border-[#E2E8F0]">
              <span className="font-medium text-[#191C1E]">Automação Web Playwright</span>
              <span className="text-[#047857] font-bold">100% Online</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#F7F9FB] rounded-lg border border-[#E2E8F0]">
              <span className="font-medium text-[#191C1E]">Análise Git Diff & Commits</span>
              <span className="text-[#047857] font-bold">Ativo (v2.4)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#F7F9FB] rounded-lg border border-[#E2E8F0]">
              <span className="font-medium text-[#191C1E]">Matriz de Rastreabilidade (ISO 29119)</span>
              <span className="text-[#047857] font-bold">Conforme</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#F7F9FB] rounded-lg border border-[#E2E8F0]">
              <span className="font-medium text-[#191C1E]">Quality Gate & Critérios Mínimos (DoD)</span>
              <span className="text-[#EA7913] font-bold">Ativo ({totalCriteriosDefinidos} critérios)</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#2D3133] text-white rounded-2xl p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg bg-[#EA7913] flex items-center justify-center font-bold text-white text-sm">
                Q
              </span>
              <h3 className="font-bold text-base tracking-tight font-sans">
                Pronto para Homologar Novos Commits?
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              O motor Quantum AI inspeciona suas alterações de código diretamente no GitHub, identifica elementos inconsistentes de DOM e formula critérios mínimos com rigor ISTQB.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => onNavigate('prompt')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#EA7913] hover:bg-[#D56A0C] text-white font-bold text-xs shadow-md shadow-[#EA7913]/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Play size={15} />
              <span>Novo Roteiro de Testes</span>
            </button>
            <button
              onClick={() => onNavigate('rtm')}
              className="py-3 px-4 rounded-xl bg-[#3C3F40] hover:bg-[#4A4D52] text-gray-200 font-semibold text-xs transition-all"
            >
              Ver RTM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
