import React, { useState } from 'react';
import { 
  Table2, 
  Download, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Copy, 
  Check 
} from 'lucide-react';
import type { TestStep, RTMTraceItem } from '../types/qa';

interface RTMViewProps {
  steps: TestStep[];
  commitSha?: string | null;
  onExportCsv: () => void;
  onGenerateDossier: () => void;
}

export const RTMView: React.FC<RTMViewProps> = ({
  steps,
  commitSha,
  onExportCsv,
  onGenerateDossier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedDossier, setCopiedDossier] = useState(false);

  // Mapeamento dos passos para itens rastreáveis RTM
  const rtmItems: RTMTraceItem[] = steps.map((s, idx) => ({
    id: s.id || `REQ-STEP-${idx + 1}`,
    requirementId: `REQ-${String(idx + 1).padStart(3, '0')}`,
    module: s.categoria || 'Geral',
    requirementDesc: s.descricao,
    testCaseId: `TC-${String(idx + 1).padStart(3, '0')}`,
    testCaseTitle: s.nomeCaso || `Caso #${idx + 1}`,
    criteriosMinimos: s.criteriosMinimos && s.criteriosMinimos.length > 0 ? s.criteriosMinimos : [s.criterioMinimoDescricao || s.resultadoEsperado],
    executionStatus: s.status,
    mandatoryDoD: s.criterioMinimo,
    verifiedCommit: commitSha ? commitSha.substring(0, 7) : 'HEAD',
    verifiedDate: new Date().toLocaleDateString('pt-BR'),
  }));

  const filteredItems = rtmItems.filter((item) => {
    const matchesSearch =
      item.requirementDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.testCaseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requirementId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'Passed') return matchesSearch && item.executionStatus === 'Passed';
    if (filterStatus === 'Failed') return matchesSearch && item.executionStatus === 'Failed';
    if (filterStatus === 'Mandatory') return matchesSearch && item.mandatoryDoD;
    return matchesSearch;
  });

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D8DADC]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFE3C9] text-[#944A00] flex items-center justify-center font-bold">
            <Table2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#191C1E] font-sans">
                Matriz de Rastreabilidade de Requisitos (RTM)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#61AFF2]/40 font-mono">
                ISO/IEC/IEEE 29119
              </span>
            </div>
            <p className="text-xs text-[#565E74]">
              Rastreamento bidirecional: Requisitos de Negócio ➔ Casos de Teste ➔ Critérios Mínimos ➔ Execução
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onGenerateDossier}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F2F4F6] text-[#2D3133] border border-[#D8DADC] text-xs font-semibold shadow-sm transition-all"
          >
            <FileText size={14} className="text-[#EA7913]" />
            <span>Gerar Dossiê Markdown</span>
          </button>

          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA7913] hover:bg-[#D56A0C] text-white text-xs font-semibold shadow-md shadow-[#EA7913]/25 active:scale-95 transition-all"
          >
            <Download size={14} />
            <span>Exportar CSV RTM</span>
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F7F9FB] p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por requisito, caso ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#D8DADC] rounded-lg text-xs outline-none focus:border-[#EA7913]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-xs text-[#565E74] font-medium mr-1 flex items-center gap-1">
            <Filter size={13} /> Status:
          </span>
          {['all', 'Passed', 'Failed', 'Mandatory'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-[#2D3133] text-white'
                  : 'bg-[#FFFFFF] text-[#565E74] border border-[#D8DADC] hover:bg-gray-100'
              }`}
            >
              {status === 'all'
                ? 'Todos'
                : status === 'Passed'
                ? 'Aprovados'
                : status === 'Failed'
                ? 'Reprovados'
                : 'Obrigatórios (DoD)'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
        <table className="w-full text-left text-xs text-[#191C1E]">
          <thead className="bg-[#2D3133] text-white text-[11px] uppercase tracking-wider font-sans">
            <tr>
              <th className="py-3 px-3.5">ID Requisito</th>
              <th className="py-3 px-3.5">Módulo</th>
              <th className="py-3 px-3.5">Caso de Teste</th>
              <th className="py-3 px-3.5">Critérios Mínimos (DoD)</th>
              <th className="py-3 px-3.5">Obrigatório</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5">Commit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Nenhum item rastreável encontrado.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#F7F9FB] transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-[#EA7913]">
                    {item.requirementId}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-gray-600">
                    {item.module}
                  </td>
                  <td className="py-3 px-3.5 max-w-xs">
                    <p className="font-semibold text-[#191C1E]">{item.testCaseTitle}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{item.requirementDesc}</p>
                  </td>
                  <td className="py-3 px-3.5 max-w-xs">
                    <ul className="space-y-1">
                      {item.criteriosMinimos.map((crit, cIdx) => (
                        <li key={cIdx} className="text-[11px] text-[#4B5563] flex items-start gap-1">
                          <span className="text-[#EA7913] font-bold">•</span>
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3 px-3.5">
                    {item.mandatoryDoD ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFE3C9] text-[#944A00] font-mono">
                        SIM (DoD)
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-mono">Secundário</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    {item.executionStatus === 'Passed' && (
                      <span className="inline-flex items-center gap-1 font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded text-[11px]">
                        <CheckCircle2 size={12} /> Aprovado
                      </span>
                    )}
                    {item.executionStatus === 'Failed' && (
                      <span className="inline-flex items-center gap-1 font-bold text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded text-[11px]">
                        <XCircle size={12} /> Reprovado
                      </span>
                    )}
                    {item.executionStatus === 'Pending' && (
                      <span className="text-gray-500 text-[11px]">Pendente</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[11px] text-gray-600">
                    {item.verifiedCommit}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
