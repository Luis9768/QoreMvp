import React, { useState } from 'react';
import { 
  Eye, 
  ShieldCheck, 
  Code2, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Laptop,
  Smartphone,
  Maximize2
} from 'lucide-react';
import type { DomSelectorAudit } from '../types/qa';

interface DomConsistencyViewProps {
  targetUrl: string;
}

export const DomConsistencyView: React.FC<DomConsistencyViewProps> = ({
  targetUrl,
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedAuditId, setSelectedAuditId] = useState<string>('AUD-001');

  // Seletores auditados pela IA Quantum AI
  const selectorAudits: DomSelectorAudit[] = [
    {
      id: 'AUD-001',
      elementTag: 'button',
      rawSelector: '#btn-submit-v9823.css-1f9a23',
      resilientSelector: 'button[data-testid="login-submit"], role="button"[name="Entrar"]',
      strategy: 'aria-landmark',
      resilienceScore: 98,
      status: 'Healed',
      recommendation: 'ID randômico dinâmico substituído por accessible role e data-testid.',
    },
    {
      id: 'AUD-002',
      elementTag: 'input',
      rawSelector: 'input[name="user_email_rnd94"]',
      resilientSelector: 'input[type="email"], label:has-text("E-mail") >> input',
      strategy: 'visual-proximity',
      resilienceScore: 94,
      status: 'Healed',
      recommendation: 'Ancoragem espacial relativa ao label semântico do formulário.',
    },
    {
      id: 'AUD-003',
      elementTag: 'span',
      rawSelector: 'div > div.status-row > span.sc-bdVaJa',
      resilientSelector: '.status-badge:has-text("Cancelado")',
      strategy: 'text-content',
      resilienceScore: 92,
      status: 'Robust',
      recommendation: 'Combinação de classe semântica de estado e matching textual.',
    },
    {
      id: 'AUD-004',
      elementTag: 'table',
      rawSelector: '#grid-29482.react-grid-container',
      resilientSelector: '[data-testid="appointments-table"], table[role="grid"]',
      strategy: 'data-testid',
      resilienceScore: 99,
      status: 'Robust',
      recommendation: 'Seletor semântico com data-testid dedicado para automação QA.',
    },
  ];

  const overallResilience = Math.round(
    selectorAudits.reduce((acc, s) => acc + s.resilienceScore, 0) / selectorAudits.length
  );

  return (
    <div className="space-y-6">
      {/* Strategy Banner */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D8DADC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D3133] text-[#EA7913] flex items-center justify-center font-bold shrink-0">
              <Eye size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#191C1E] font-sans">
                  Consistência de DOM & Estratégia Híbrida Visual
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#49CC90]/40 uppercase font-mono">
                  Self-Healing Engine
                </span>
              </div>
              <p className="text-xs text-[#565E74]">
                Solução contra quebras causadas por IDs dinâmicos, classes randômicas de Tailwind/CSS-in-JS e re-renders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] text-center">
              <p className="text-xl font-bold text-[#047857] font-sans">{overallResilience}%</p>
              <p className="text-[10px] text-[#565E74] font-medium uppercase font-mono">Score de Resiliência</p>
            </div>
          </div>
        </div>

        {/* 3 Pillars of the Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-3.5 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] space-y-1.5">
            <span className="font-bold text-[#191C1E] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <ShieldCheck size={13} className="text-[#EA7913]" /> 1. Ancoragem ARIA Semântica
            </span>
            <p className="text-gray-600 leading-relaxed">
              O Playwright prioriza <code className="text-[#944A00]">role</code> e <code className="text-[#944A00]">accessible name</code> antes de IDs ou classes mutáveis.
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] space-y-1.5">
            <span className="font-bold text-[#191C1E] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Layers size={13} className="text-[#EA7913]" /> 2. Proximidade Visual & Bounding Box
            </span>
            <p className="text-gray-600 leading-relaxed">
              Se um elemento tiver classes alteradas, o Quantum AI localiza o alvo pela proximidade espacial com labels estáticos.
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] space-y-1.5">
            <span className="font-bold text-[#191C1E] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Sparkles size={13} className="text-[#EA7913]" /> 3. Self-Healing em Tempo de Execução
            </span>
            <p className="text-gray-600 leading-relaxed">
              Tentativas de fallback automáticas caso o primeiro seletor falhe, registrando sugestão de cura no relatório RTM.
            </p>
          </div>
        </div>
      </div>

      {/* Selectors Audit Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#D8DADC] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#191C1E] font-sans">
            Mapeamento de Seletores Vulneráveis ➔ Seletores Curados ({selectorAudits.length})
          </h3>
          <span className="text-xs text-gray-500">Playwright Selector Telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2D3133] text-white text-[11px] uppercase tracking-wider font-sans">
              <tr>
                <th className="py-3 px-4">Tag</th>
                <th className="py-3 px-4">Seletor Frágil (Original)</th>
                <th className="py-3 px-4">Seletor Resiliente (Quantum AI)</th>
                <th className="py-3 px-4">Estratégia</th>
                <th className="py-3 px-4">Resiliência</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {selectorAudits.map((audit) => (
                <tr key={audit.id} className="hover:bg-[#F7F9FB] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#EA7913]">
                    &lt;{audit.elementTag}&gt;
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#B91C1C] line-through bg-red-50/50">
                    {audit.rawSelector}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#047857] font-semibold bg-emerald-50/50">
                    {audit.resilientSelector}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-700">
                    {audit.strategy}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#191C1E]">
                    {audit.resilienceScore}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] uppercase font-mono">
                      ✓ {audit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HTML Simulation Preview (Figma Web Preview) */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8DADC]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#191C1E] font-sans">
              Pré-Visualização do HTML Renderizado & DOM Inspector
            </h3>
            <span className="text-[10px] font-mono text-gray-500">({targetUrl})</span>
          </div>

          {/* Viewport switch: Desktop vs Mobile */}
          <div className="flex items-center gap-1.5 bg-[#F2F4F6] p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                viewportMode === 'desktop' ? 'bg-[#FFFFFF] text-[#191C1E] shadow-sm' : 'text-[#565E74]'
              }`}
            >
              <Laptop size={14} /> Desktop (1280px)
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                viewportMode === 'mobile' ? 'bg-[#FFFFFF] text-[#191C1E] shadow-sm' : 'text-[#565E74]'
              }`}
            >
              <Smartphone size={14} /> Mobile (390px)
            </button>
          </div>
        </div>

        {/* Interactive Simulated Container */}
        <div className="bg-[#282D2F] p-4 rounded-xl flex items-center justify-center">
          <div
            className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 border border-gray-400 ${
              viewportMode === 'desktop' ? 'w-full max-w-4xl h-[420px]' : 'w-[375px] h-[550px]'
            }`}
          >
            {/* Browser top chrome */}
            <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
              <span className="ml-2 bg-white px-3 py-0.5 rounded border border-gray-200 text-[11px] font-mono flex-1 truncate">
                {targetUrl}
              </span>
            </div>

            {/* Rendered Mock Content with interactive highlighted selectors */}
            <div className="p-6 space-y-4 overflow-y-auto h-[calc(100%-35px)] text-xs text-[#191C1E]">
              <div className="p-3 bg-[#ECFDF5] border border-[#49CC90] rounded-lg">
                <span className="font-bold text-[#047857]">[DOM Highlight]</span> Todos os seletores resilientes estão mapeados e operantes.
              </div>

              <div className="space-y-3 max-w-sm mx-auto border border-gray-200 p-5 rounded-xl shadow-sm bg-[#FAFAFA]">
                <h4 className="font-bold text-sm text-center">Autenticação do Sistema</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    readOnly
                    value="lebron@email.com"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-500 rounded text-xs ring-2 ring-emerald-400/30 font-mono"
                  />
                  <span className="text-[10px] text-emerald-600 font-mono">✓ Seletor Resiliente Detectado</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Senha</label>
                  <input
                    type="password"
                    readOnly
                    value="••••••••"
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono"
                  />
                </div>
                <button
                  type="button"
                  className="w-full py-2 bg-[#EA7913] text-white font-bold rounded shadow hover:bg-[#D56A0C] ring-2 ring-[#EA7913]/30"
                >
                  Entrar no Sistema
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
