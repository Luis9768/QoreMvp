import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ArrowUpRight 
} from 'lucide-react';

interface KPICardsProps {
  totalSteps: number;
  mandatoryCount: number;
  passedCount: number;
  failedCount: number;
  totalCriteriosDefinidos: number;
  executionTime?: number;
  suiteStatus?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalSteps,
  mandatoryCount,
  passedCount,
  failedCount,
  totalCriteriosDefinidos,
  executionTime = 0,
  suiteStatus,
}) => {
  const successRate = totalSteps > 0 ? Math.round((passedCount / totalSteps) * 100) : 0;
  const mandatoryRate = mandatoryCount > 0 ? Math.min(100, Math.round((passedCount / mandatoryCount) * 100)) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Casos de Teste */}
      <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D8DADC] shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#565E74] uppercase tracking-wider font-sans">
            Casos na Suíte
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
            <Layers size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-[#191C1E] font-sans">
            {totalSteps} <span className="text-sm font-normal text-gray-500">passos</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#565E74]">
            <span className="font-semibold text-[#191C1E]">{mandatoryCount}</span> obrigatórios ({totalCriteriosDefinidos} critérios DoD)
          </div>
        </div>
      </div>

      {/* Card 2: Taxa de Aprovação */}
      <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D8DADC] shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#565E74] uppercase tracking-wider font-sans">
            Taxa de Sucesso
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-[#191C1E] font-sans">
              {successRate}%
            </p>
            {successRate >= 90 ? (
              <span className="text-[10px] font-bold text-[#047857] bg-[#ECFDF5] px-1.5 py-0.5 rounded">Excelente</span>
            ) : (
              <span className="text-[10px] font-bold text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.5 rounded">Em Validação</span>
            )}
          </div>
          <p className="text-xs text-[#565E74] mt-1">
            {passedCount} aprovados / {failedCount} reprovados
          </p>
        </div>
      </div>

      {/* Card 3: Critérios Mínimos (DoD) */}
      <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D8DADC] shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#565E74] uppercase tracking-wider font-sans">
            Quality Gate (DoD)
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FFE3C9] text-[#944A00] flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-[#191C1E] font-sans">
              {mandatoryRate}%
            </p>
            <span className="text-[10px] font-mono font-bold text-[#944A00]">
              {passedCount}/{mandatoryCount} Mínimos
            </span>
          </div>
          <p className="text-xs text-[#565E74] mt-1">
            {suiteStatus === 'Passed' ? 'Aprovado para Homologação' : 'Critérios Essenciais'}
          </p>
        </div>
      </div>

      {/* Card 4: Tempo de Execução */}
      <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D8DADC] shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#565E74] uppercase tracking-wider font-sans">
            Tempo de Execução
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-[#191C1E] font-sans">
            {executionTime > 0 ? `${executionTime.toFixed(1)}s` : '--'}
          </p>
          <p className="text-xs text-[#565E74] mt-1">
            Playwright Headless + Telemetria
          </p>
        </div>
      </div>
    </div>
  );
};
