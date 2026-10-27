import React, { useState } from 'react';
import { 
  GitCommit, 
  GitBranch, 
  FileCode, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  Layers, 
  ArrowRight,
  Code2,
  FilePlus,
  FileMinus,
  FileText
} from 'lucide-react';
import type { GitHubCommitDetail, GitHubCommitFile, CommitRiskAssessment } from '../types/qa';

interface CommitAnalysisViewProps {
  commitDetail: GitHubCommitDetail | null;
  isLoading: boolean;
  onSelectCommitToPlan: (sha: string) => void;
  onRefreshCommitDiff: () => void;
  repoUrl: string;
}

export const CommitAnalysisView: React.FC<CommitAnalysisViewProps> = ({
  commitDetail,
  isLoading,
  onSelectCommitToPlan,
  onRefreshCommitDiff,
  repoUrl,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock ou dados reais de commit
  const activeCommit: GitHubCommitDetail = commitDetail || {
    sha: '39e6f391234567890abcdef1234567890abcdef1',
    shortSha: '39e6f39',
    message: 'feat: suporte a multiplos criterios minimos de aceitacao por caso de teste e suite',
    author: 'Luis Fernando',
    date: '2026-10-27T09:24:00Z',
    htmlUrl: 'https://github.com/Luis9768/QoreMvp/commit/39e6f39',
    branch: 'main',
    stats: {
      total: 5,
      additions: 257,
      deletions: 73,
    },
    files: [
      {
        filename: 'backend/Models/Entities.cs',
        status: 'modified',
        additions: 4,
        deletions: 2,
        patch: `@@ -67,7 +67,8 @@ public class TestStepExecution
     public string? DadosTeste { get; set; }
     public string? ResultadoEsperado { get; set; }
     public bool CriterioMinimo { get; set; } = true;
-    public string? CriterioMinimoDescricao { get; set; }
+    public string? CriterioMinimoDescricao { get; set; }
+    public string? CriteriosMinimosJson { get; set; } // Lista JSON com múltiplos critérios
     public string Status { get; set; } = "Pending";
@@ -112,7 +113,8 @@ public class StepItemDto
     public string? DadosTeste { get; set; }
     public string? ResultadoEsperado { get; set; }
     public bool CriterioMinimo { get; set; } = true;
-    public string? CriterioMinimoDescricao { get; set; }
+    public string? CriterioMinimoDescricao { get; set; }
+    public List<string> CriteriosMinimos { get; set; } = new();`,
      },
      {
        filename: 'backend/Services/AgentRunner.cs',
        status: 'modified',
        additions: 15,
        deletions: 2,
        patch: `@@ -48,6 +48,18 @@ public class AgentRunner
         int n = 1;
         foreach (var s in req.Steps)
         {
+            var minList = s.CriteriosMinimos != null && s.CriteriosMinimos.Count > 0
+                ? s.CriteriosMinimos.Where(c => !string.IsNullOrWhiteSpace(c)).ToList()
+                : (!string.IsNullOrWhiteSpace(s.CriterioMinimoDescricao) ? new List<string> { s.CriterioMinimoDescricao } : new List<string>());
+            var minDesc = minList.Count > 0 ? string.Join(" | ", minList) : s.ResultadoEsperado;
+            var minJson = System.Text.Json.JsonSerializer.Serialize(minList);
+
             exec.Steps.Add(new TestStepExecution
             {
                 StepNumber = n++,
+                CriterioMinimoDescricao = minDesc,
+                CriteriosMinimosJson = minJson,
                 Status = "Pending"
             });`,
      },
      {
        filename: 'frontend/pages/index.tsx',
        status: 'modified',
        additions: 142,
        deletions: 48,
        patch: `@@ -470,12 +470,26 @@ export default function Home() {
+  // Múltiplos critérios de aceitação dinâmicos
+  const handleAddCriterionToStep = (stepIndex: number) => {
+    setEditableSteps(prev => {
+      const copy = [...prev];
+      copy[stepIndex].criteriosMinimos.push('Novo critério essencial');
+      return copy;
+    });
+  };`,
      },
      {
        filename: 'backend/Program.cs',
        status: 'modified',
        additions: 1,
        deletions: 0,
        patch: `@@ -79,6 +79,7 @@ using (var scope = app.Services.CreateScope())
+    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN CriteriosMinimosJson TEXT;"); } catch { }`,
      },
    ],
  };

  // Avaliação de risco gerada pelo Quantum AI
  const riskAssessment: CommitRiskAssessment = {
    riskLevel: 'Médio',
    riskScore: 42,
    affectedLayers: ['Backend API', 'Frontend UI', 'Banco de Dados'],
    breakingChangeRisk: false,
    recommendedDoD: [
      'Validar compatibilidade regressiva de bancos SQLite legados (coluna CriteriosMinimosJson)',
      'Garantir serialização JSON válida de múltiplos critérios no payload do AgentRunner',
      'Verificar renderização de cards com mais de 3 critérios mínimos na interface web',
    ],
    summaryAnalysis:
      'As alterações expandem o modelo de dados de critérios mínimos de aceitação sem quebra de contrato prévio. O migration no Program.cs previne erros em bases de dados existentes. Recomenda-se teste de regressão focado na API de execução.',
  };

  const selectedFile = activeCommit.files[selectedFileIndex] || activeCommit.files[0];

  const filteredFiles = activeCommit.files.filter((f) =>
    f.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Commit Overview Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D8DADC]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D3133] text-[#EA7913] flex items-center justify-center font-bold shrink-0">
              <GitCommit size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs bg-[#FFE3C9] text-[#944A00] px-2 py-0.5 rounded">
                  {activeCommit.shortSha}
                </span>
                <span className="text-xs text-gray-500 font-mono">em branch: <strong>{activeCommit.branch || 'main'}</strong></span>
                <a
                  href={activeCommit.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#EA7913] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Abrir no GitHub</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#191C1E] font-sans mt-1">
                {activeCommit.message}
              </h2>
              <p className="text-xs text-[#565E74] mt-0.5">
                Commit de <strong>{activeCommit.author}</strong> em{' '}
                {new Date(activeCommit.date).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onSelectCommitToPlan(activeCommit.sha)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA7913] hover:bg-[#D56A0C] text-white text-xs font-bold shadow-md shadow-[#EA7913]/25 active:scale-95 transition-all"
            >
              <Sparkles size={15} />
              <span>Gerar Testes para Este Commit</span>
            </button>
          </div>
        </div>

        {/* Commit Stats & AI Risk Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Stats */}
          <div className="p-3.5 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
            <span className="font-bold text-[#191C1E] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Layers size={13} className="text-[#EA7913]" /> Estatísticas de Alteração
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-gray-700">
                <strong>{activeCommit.files.length}</strong> arquivos
              </span>
              <span className="font-bold text-[#047857]">
                +{activeCommit.stats?.additions || 257} adições
              </span>
              <span className="font-bold text-[#B91C1C]">
                -{activeCommit.stats?.deletions || 73} exclusões
              </span>
            </div>
          </div>

          {/* AI Risk Level */}
          <div className="p-3.5 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
            <span className="font-bold text-[#191C1E] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-[#EA7913]" /> Avaliação de Risco (Quantum AI)
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded uppercase font-mono ${
                  riskAssessment.riskLevel === 'Baixo'
                    ? 'bg-[#ECFDF5] text-[#047857]'
                    : riskAssessment.riskLevel === 'Médio'
                    ? 'bg-[#FFFBEB] text-[#B45309]'
                    : 'bg-[#FEF2F2] text-[#B91C1C]'
                }`}
              >
                Risco {riskAssessment.riskLevel} ({riskAssessment.riskScore}/100)
              </span>
              <span className="text-[11px] text-gray-500">Sem breaking changes</span>
            </div>
          </div>

          {/* Affected Layers */}
          <div className="p-3.5 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
            <span className="font-bold text-[#191C1E] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Code2 size={13} className="text-[#EA7913]" /> Camadas Impactadas
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {riskAssessment.affectedLayers.map((layer) => (
                <span
                  key={layer}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-[#D8DADC] text-gray-700 font-mono"
                >
                  {layer}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Executive Summary */}
        <div className="p-3.5 bg-[#FFFDFB] rounded-xl border border-[#EA7913]/30 text-xs space-y-1.5">
          <p className="font-bold text-[#944A00] flex items-center gap-1.5">
            <Sparkles size={14} /> Parecer Técnico do Quantum AI:
          </p>
          <p className="text-gray-700 leading-relaxed">{riskAssessment.summaryAnalysis}</p>
        </div>
      </div>

      {/* Visual Git Diff & File Inspector */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side: Files list */}
        <div className="w-full md:w-80 border-r border-[#D8DADC] bg-[#F7F9FB] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#D8DADC] bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar arquivos do diff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-lg text-xs outline-none focus:border-[#EA7913]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] text-xs">
            {filteredFiles.map((file, idx) => {
              const isSelected = selectedFileIndex === idx;
              return (
                <button
                  key={file.filename}
                  type="button"
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full p-3 text-left transition-colors flex items-start justify-between gap-2 ${
                    isSelected ? 'bg-white border-l-4 border-l-[#EA7913] font-semibold text-[#191C1E]' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="overflow-hidden space-y-0.5">
                    <p className="font-mono text-[11px] truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <span className="text-[10px] text-gray-400 capitalize">{file.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                    <span className="text-[#047857]">+{file.additions}</span>
                    <span className="text-[#B91C1C]">-{file.deletions}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Code Diff Viewer with Syntax Highlight */}
        <div className="flex-1 flex flex-col bg-[#111827] text-gray-200 overflow-hidden">
          {/* File Header */}
          <div className="p-3 bg-[#1F2937] border-b border-[#374151] flex items-center justify-between text-xs font-mono">
            <span className="text-gray-300 font-bold truncate">{selectedFile.filename}</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[#10B981]">+{selectedFile.additions}</span>
              <span className="text-[#EF4444]">-{selectedFile.deletions}</span>
              <span className="text-gray-400 text-[10px] uppercase">{selectedFile.status}</span>
            </div>
          </div>

          {/* Unified Diff Patch Lines */}
          <div className="flex-1 p-4 font-mono text-xs overflow-x-auto space-y-0.5 leading-5 select-text">
            {selectedFile.patch ? (
              selectedFile.patch.split('\n').map((line, lIdx) => {
                const isAddition = line.startsWith('+') && !line.startsWith('+++');
                const isDeletion = line.startsWith('-') && !line.startsWith('---');
                const isHeader = line.startsWith('@@');

                return (
                  <div
                    key={lIdx}
                    className={`px-2 py-0.5 rounded ${
                      isAddition
                        ? 'bg-[#047857]/30 text-[#6EE7B7] border-l-2 border-[#10B981]'
                        : isDeletion
                        ? 'bg-[#B91C1C]/30 text-[#FCA5A5] border-l-2 border-[#EF4444]'
                        : isHeader
                        ? 'bg-[#1E293B] text-[#93C5FD] font-bold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="inline-block w-8 text-gray-500 select-none text-[10px]">
                      {lIdx + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-gray-500">
                Nenhum patch textual disponível para este arquivo (possível arquivo binário ou imagem).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
