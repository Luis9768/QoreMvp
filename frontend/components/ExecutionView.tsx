import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Maximize2,
  Terminal,
  Activity,
  ListChecks,
  Check,
  Video as VideoIcon
} from 'lucide-react';
import type { TestStep, QualityGateSummary, StepStatus } from '../types/qa';

interface ExecutionViewProps {
  steps: TestStep[];
  videoUrl?: string | null;
  videoFileName?: string | null;
  qualityGate?: QualityGateSummary;
  targetUrl: string;
  executionTime?: number;
  suiteStatus: StepStatus;
  onShareReport?: () => void;
  onOpenStepScreenshot?: (url: string) => void;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  steps,
  videoUrl,
  videoFileName,
  qualityGate,
  targetUrl,
  executionTime = 0,
  suiteStatus,
  onShareReport,
  onOpenStepScreenshot,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<'all' | 'mandatory' | 'failed'>('all');

  const filteredSteps = steps.filter((step) => {
    if (activeStepTab === 'mandatory') return step.criterioMinimo;
    if (activeStepTab === 'failed') return step.status === 'Failed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* SECTION 1: High-Fi Player & Execution Playback (Figma #459:1989 & #459:2679) */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm overflow-hidden">
        {/* Top Header of the Player */}
        <div className="p-4 sm:p-5 border-b border-[#D8DADC] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FDFDFD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE3C9] text-[#944A00] flex items-center justify-center font-bold">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#191C1E] font-sans">
                  Gravação Contínua & Telemetria Playwright
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#49CC90]/40 uppercase font-mono">
                  Full Session MP4
                </span>
              </div>
              <p className="text-xs text-[#565E74]">
                Captura unificada em alta resolução dos fluxos, interações e DOM do navegador
              </p>
            </div>
          </div>

          {/* Action buttons (Figma #459:2691 & #459:2695) */}
          <div className="flex items-center gap-2.5">
            {onShareReport && (
              <button
                onClick={onShareReport}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F2F4F6] text-[#49607E] border border-[#D8DADC] text-xs font-semibold shadow-sm transition-all"
              >
                <Share2 size={14} />
                <span>Compartilhar</span>
              </button>
            )}

            {videoUrl ? (
              <a
                href={videoUrl}
                download={videoFileName || 'execucao-playwright.mp4'}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA7913] hover:bg-[#D56A0C] text-white text-xs font-semibold shadow-md shadow-[#EA7913]/25 active:scale-95 transition-all"
              >
                <Download size={14} />
                <span>Vídeo (.mp4)</span>
              </a>
            ) : (
              <button
                disabled
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-200 text-gray-400 text-xs font-semibold cursor-not-allowed"
              >
                <Download size={14} />
                <span>Vídeo (.mp4)</span>
              </button>
            )}
          </div>
        </div>

        {/* Video Canvas & Browser Chrome Mockup (Figma #459:2000) */}
        <div className="p-4 sm:p-6 bg-[#282D2F]">
          {/* Browser Top Chrome */}
          <div className="bg-[#1F2937] px-4 py-2 rounded-t-xl border border-[#3C3F40] flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F93E3E] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FCA130] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#49CC90] inline-block" />
              <span className="ml-2 font-mono text-gray-400 text-[11px] truncate max-w-xs sm:max-w-md">
                {targetUrl}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">1280x720 • 60fps</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {suiteStatus}
              </span>
            </div>
          </div>

          {/* Video Player Box */}
          <div className="relative bg-[#111827] border-x border-b border-[#3C3F40] rounded-b-xl overflow-hidden aspect-video flex items-center justify-center">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                poster="/logo-qore.png"
              >
                Seu navegador não suporta a tag de vídeo.
              </video>
            ) : (
              <div className="text-center p-8 text-gray-400">
                <VideoIcon size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-300">Nenhum vídeo gravado disponível no momento</p>
                <p className="text-xs text-gray-500 mt-1">Execute a suíte com o Playwright no modo de automação para registrar o vídeo da sessão.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Timeline de Passos & Funcionalidades Avaliadas (Figma #459:2700 & #459:2012) */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D8DADC] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFE3C9] text-[#944A00] flex items-center justify-center">
              <ListChecks size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191C1E] font-sans">
                Timeline de Passos & Funcionalidades Avaliadas
              </h3>
              <p className="text-xs text-[#565E74]">
                Detalhamento dos casos executados, validações de DOM e critérios mínimos cumpridos
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 bg-[#F2F4F6] p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveStepTab('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeStepTab === 'all' ? 'bg-[#FFFFFF] text-[#191C1E] shadow-sm' : 'text-[#565E74] hover:text-[#191C1E]'
              }`}
            >
              Todos ({steps.length})
            </button>
            <button
              onClick={() => setActiveStepTab('mandatory')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeStepTab === 'mandatory' ? 'bg-[#FFFFFF] text-[#944A00] shadow-sm' : 'text-[#565E74] hover:text-[#191C1E]'
              }`}
            >
              Obrigatórios ({steps.filter((s) => s.criterioMinimo).length})
            </button>
            <button
              onClick={() => setActiveStepTab('failed')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeStepTab === 'failed' ? 'bg-[#FFFFFF] text-[#B91C1C] shadow-sm' : 'text-[#565E74] hover:text-[#191C1E]'
              }`}
            >
              Falhas ({steps.filter((s) => s.status === 'Failed').length})
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="mt-5 space-y-4">
          {filteredSteps.length === 0 ? (
            <div className="text-center py-12 text-[#565E74] text-xs">
              Nenhum passo encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredSteps.map((step, idx) => (
              <div
                key={step.id || idx}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  step.status === 'Passed'
                    ? 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#49CC90]/60'
                    : step.status === 'Failed'
                    ? 'border-[#F93E3E]/40 bg-[#FFF5F5]'
                    : 'border-[#E2E8F0] bg-[#FFFFFF]'
                }`}
              >
                {/* Step Top Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Number Badge (Figma #459:2710) */}
                    <div className="w-8 h-8 rounded-full bg-[#EA7913] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-[#EA7913]/30">
                      {step.stepNumber || idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#191C1E] font-sans">
                          {step.nomeCaso || `Caso de Teste #${step.stepNumber || idx + 1}`}
                        </h4>
                        {step.criterioMinimo && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFE3C9] text-[#944A00] font-mono uppercase">
                            Critério Mínimo (DoD)
                          </span>
                        )}
                        {step.categoria && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-mono">
                            {step.categoria}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#565E74] mt-1 leading-relaxed">
                        {step.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge (Figma #459:2715) */}
                  <div className="shrink-0">
                    {step.status === 'Passed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-[#ECFDF5] text-[#047857] border border-[#49CC90]/40">
                        <CheckCircle2 size={13} /> Sucesso
                      </span>
                    )}
                    {step.status === 'Failed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-[#FEF2F2] text-[#B91C1C] border border-[#F93E3E]/40">
                        <XCircle size={13} /> Falha
                      </span>
                    )}
                    {step.status === 'Running' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-[#EFF6FF] text-[#1D4ED8] animate-pulse">
                        <Clock size={13} /> Executando...
                      </span>
                    )}
                    {step.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-600">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Details & Multiple Minimum Criteria (DoD) */}
                <div className="mt-4 pt-4 border-t border-[#F2F4F6] grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Expected Result & Telemetry */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[#EA7913] uppercase tracking-wider text-[10px]">
                        Resultado Esperado:
                      </span>
                      <p className="text-[#191C1E] mt-0.5 bg-[#F7F9FB] p-2.5 rounded-lg border border-[#E2E8F0]">
                        {step.resultadoEsperado}
                      </p>
                    </div>

                    {step.dadosTeste && (
                      <div>
                        <span className="font-bold text-[#565E74] uppercase tracking-wider text-[10px]">
                          Dados / Massa de Teste:
                        </span>
                        <p className="font-mono text-[#4B5563] text-[11px] bg-[#F7F9FB] p-2 rounded border border-[#E2E8F0]">
                          {step.dadosTeste}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Multiple Minimum Acceptance Criteria Checklist */}
                  <div className="bg-[#FFFDFB] p-3 rounded-lg border border-[#EA7913]/20 space-y-2">
                    <span className="font-bold text-[#944A00] uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <ShieldCheck size={13} /> Checklist de Critérios Mínimos (DoD):
                    </span>

                    {step.criteriosMinimos && step.criteriosMinimos.length > 0 ? (
                      <ul className="space-y-1.5">
                        {step.criteriosMinimos.map((crit, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-2 text-xs text-[#191C1E]">
                            <span className="w-4 h-4 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              ✓
                            </span>
                            <span className="leading-snug">{crit}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        {step.criterioMinimoDescricao || step.resultadoEsperado || 'Critério padrão: ausência de falha 500 no DOM.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Screenshot Thumb if available */}
                {step.screenshotUrl && (
                  <div className="mt-3 pt-3 border-t border-[#F2F4F6] flex items-center justify-between">
                    <span className="text-xs text-[#565E74] flex items-center gap-1.5">
                      <ExternalLink size={12} /> Evidência Visual Capturada
                    </span>
                    <button
                      onClick={() => onOpenStepScreenshot?.(step.screenshotUrl!)}
                      className="text-xs font-semibold text-[#EA7913] hover:underline"
                    >
                      Visualizar Screenshot
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
