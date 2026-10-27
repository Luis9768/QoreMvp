import React, { useState } from 'react';
import { 
  GitCommit, 
  GitBranch, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Search, 
  Layers, 
  Check, 
  ExternalLink,
  Code2,
  GitFork,
  Sliders
} from 'lucide-react';
import type { 
  ExecutionMode, 
  TestStep, 
  GitHubCommitInfo, 
  TestAuthCredentials, 
  UserRole 
} from '../types/qa';

interface PromptGenerationViewProps {
  mode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  // GitHub States
  githubUrl: string;
  setGithubUrl: (val: string) => void;
  githubBranch: string;
  setGithubBranch: (val: string) => void;
  commitSha: string;
  setCommitSha: (val: string) => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  githubPrompt: string;
  setGithubPrompt: (val: string) => void;
  availableBranches: string[];
  isLoadingBranches: boolean;
  onFetchBranches: () => void;
  onFetchCommits: () => void;
  onValidateToken: () => void;
  isValidatingToken: boolean;
  tokenResult: { valid: boolean; user?: string; error?: string } | null;
  // Web E2E States
  targetUrl: string;
  setTargetUrl: (val: string) => void;
  swaggerUrl: string;
  setSwaggerUrl: (val: string) => void;
  userPrompt: string;
  setUserPrompt: (val: string) => void;
  headless: boolean;
  setHeadless: (val: boolean) => void;
  // Auth
  authCredentials: TestAuthCredentials;
  setAuthCredentials: React.Dispatch<React.SetStateAction<TestAuthCredentials>>;
  // Steps & Planning
  steps: TestStep[];
  isPlanning: boolean;
  planError: string | null;
  onGeneratePlan: () => void;
  onAddStep: () => void;
  onRemoveStep: (idx: number) => void;
  onUpdateStep: (idx: number, field: keyof TestStep, val: any) => void;
  onAddCriterion: (stepIdx: number) => void;
  onUpdateCriterion: (stepIdx: number, critIdx: number, val: string) => void;
  onRemoveCriterion: (stepIdx: number, critIdx: number) => void;
  onMarkAllMinimos: () => void;
  onMarkCriticalMinimos: () => void;
  onClearMinimos: () => void;
  // Execution
  isExecuting: boolean;
  onExecutePlaywright: () => void;
  onExecuteIntegrated: () => void;
  // Branch Creation
  newBranchName: string;
  setNewBranchName: (val: string) => void;
  onCreateBranch: () => void;
  isCreatingBranch: boolean;
  branchCreationResult: { success: boolean; message: string } | null;
}

export const PromptGenerationView: React.FC<PromptGenerationViewProps> = ({
  mode,
  onModeChange,
  githubUrl,
  setGithubUrl,
  githubBranch,
  setGithubBranch,
  commitSha,
  setCommitSha,
  githubToken,
  setGithubToken,
  githubPrompt,
  setGithubPrompt,
  availableBranches,
  isLoadingBranches,
  onFetchBranches,
  onFetchCommits,
  onValidateToken,
  isValidatingToken,
  tokenResult,
  targetUrl,
  setTargetUrl,
  swaggerUrl,
  setSwaggerUrl,
  userPrompt,
  setUserPrompt,
  headless,
  setHeadless,
  authCredentials,
  setAuthCredentials,
  steps,
  isPlanning,
  planError,
  onGeneratePlan,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onAddCriterion,
  onUpdateCriterion,
  onRemoveCriterion,
  onMarkAllMinimos,
  onMarkCriticalMinimos,
  onClearMinimos,
  isExecuting,
  onExecutePlaywright,
  onExecuteIntegrated,
  newBranchName,
  setNewBranchName,
  onCreateBranch,
  isCreatingBranch,
  branchCreationResult,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [showAuthSection, setShowAuthSection] = useState(false);
  const [showBranchSection, setShowBranchSection] = useState(false);

  const mandatoryCount = steps.filter((s) => s.criterioMinimo).length;
  const totalCriterios = steps.reduce(
    (acc, s) => acc + (s.criteriosMinimos ? s.criteriosMinimos.length : (s.criterioMinimo ? 1 : 0)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Mode Selector (Figma Dual Mode) */}
      <div className="bg-[#FFFFFF] p-2 rounded-2xl border border-[#D8DADC] shadow-sm flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onModeChange('github')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm transition-all ${
            mode === 'github'
              ? 'bg-[#2D3133] text-white font-bold shadow-md shadow-black/10'
              : 'text-[#565E74] hover:bg-[#F2F4F6] font-medium'
          }`}
        >
          <GitCommit size={18} className={mode === 'github' ? 'text-[#EA7913]' : ''} />
          <span>🎯 Modo 2: Análise de Commit & Padronização (Git Diff + ISTQB)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EA7913] text-white font-mono uppercase">
            Foco Principal
          </span>
        </button>

        <button
          onClick={() => onModeChange('prompt')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm transition-all ${
            mode === 'prompt'
              ? 'bg-[#2D3133] text-white font-bold shadow-md shadow-black/10'
              : 'text-[#565E74] hover:bg-[#F2F4F6] font-medium'
          }`}
        >
          <Play size={18} className={mode === 'prompt' ? 'text-[#49CC90]' : ''} />
          <span>⚡ Modo 1: Automação E2E com Playwright (Execução no Navegador)</span>
        </button>
      </div>

      {/* Main Form Configuration Container */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-4 sm:p-6 space-y-5">
        {mode === 'github' ? (
          /* MODO 2: GITHUB & COMMIT */
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Repo URL */}
              <div className="md:col-span-2">
                <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px]">
                  Repositório GitHub
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://github.com/usuario/repositorio"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={onFetchBranches}
                    disabled={isLoadingBranches}
                    className="px-3.5 py-2.5 rounded-xl bg-[#2D3133] hover:bg-[#1F2937] text-white font-semibold transition-all shrink-0"
                  >
                    {isLoadingBranches ? 'Buscando...' : 'Carregar Branches'}
                  </button>
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px]">
                  Branch do Repositório
                </label>
                {availableBranches.length > 0 ? (
                  <select
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] font-mono text-xs cursor-pointer"
                  >
                    <option value="">Selecione uma Branch...</option>
                    {availableBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="main ou master"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] font-mono text-xs"
                  />
                )}
              </div>
            </div>

            {/* Commit SHA & Picker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px]">
                  Hash do Commit (Git Diff de Referência)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 2bc4dc5 ou SHA completo (deixe vazio para o mais recente)"
                    value={commitSha}
                    onChange={(e) => setCommitSha(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={onFetchCommits}
                    className="px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8DADC] hover:bg-[#F2F4F6] text-[#2D3133] font-semibold transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Search size={14} className="text-[#EA7913]" />
                    <span>Listar Commits</span>
                  </button>
                </div>
              </div>

              {/* GitHub Token */}
              <div>
                <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>GitHub Token (Privado/Rate Limit)</span>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_..."
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={onValidateToken}
                    disabled={isValidatingToken || !githubToken}
                    className="px-3 py-2.5 rounded-xl bg-[#F2F4F6] hover:bg-[#E2E8F0] text-gray-700 font-medium shrink-0 disabled:opacity-50"
                  >
                    {isValidatingToken ? '...' : 'Validar'}
                  </button>
                </div>
                {tokenResult && (
                  <p className={`mt-1 text-[11px] font-medium ${tokenResult.valid ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
                    {tokenResult.valid ? `✓ Token Válido (${tokenResult.user})` : `✗ ${tokenResult.error}`}
                  </p>
                )}
              </div>
            </div>

            {/* Prompt de Orientação QA */}
            <div className="pt-2">
              <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px]">
                Diretrizes do Teste & Regras de Negócio para o Quantum AI
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Focar na validação de critérios mínimos do formulário de checkout e cálculo de frete..."
                value={githubPrompt}
                onChange={(e) => setGithubPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] text-xs leading-relaxed"
              />
            </div>
          </div>
        ) : (
          /* MODO 1: WEB E2E PLAYWRIGHT */
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px]">
                  URL da Aplicação Web Alvo
                </label>
                <input
                  type="url"
                  placeholder="https://sua-aplicacao.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px]">
                  URL Swagger / OpenAPI (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://sua-api.com/swagger/v1/swagger.json"
                  value={swaggerUrl}
                  onChange={(e) => setSwaggerUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#191C1E] mb-1.5 uppercase tracking-wider text-[11px]">
                Instruções de Navegação e Validação E2E
              </label>
              <textarea
                rows={3}
                placeholder="Descreva o fluxo que o Playwright deve navegar..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#D8DADC] rounded-xl outline-none focus:border-[#EA7913] text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={headless}
                  onChange={(e) => setHeadless(e.target.checked)}
                  className="w-4 h-4 accent-[#EA7913] rounded"
                />
                <span className="text-[#191C1E] font-medium">Modo Headless (Execução rápida em background)</span>
              </label>
            </div>
          </div>
        )}

        {/* Collapsible Sections: Autenticação de Teste e Criação de Novas Branches */}
        <div className="pt-3 border-t border-[#D8DADC] flex items-center gap-4 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setShowAuthSection(!showAuthSection)}
            className="text-[#EA7913] hover:underline font-semibold flex items-center gap-1.5"
          >
            <Key size={14} />
            <span>{showAuthSection ? 'Ocultar Autenticação de Teste' : '+ Autenticação de Teste Dedicada'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBranchSection(!showBranchSection)}
            className="text-[#49607E] hover:underline font-semibold flex items-center gap-1.5"
          >
            <GitFork size={14} />
            <span>{showBranchSection ? 'Ocultar Criação de Branch' : '+ Criar Nova Branch a partir do Teste'}</span>
          </button>
        </div>

        {/* Dedicated Auth Form */}
        {showAuthSection && (
          <div className="p-4 bg-[#FFFDFB] rounded-xl border border-[#EA7913]/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Usuário / Login de Teste</label>
              <input
                type="text"
                placeholder="testuser@empresa.com"
                value={authCredentials.username}
                onChange={(e) => setAuthCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-[#D8DADC] rounded-lg outline-none focus:border-[#EA7913]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Senha de Teste</label>
              <input
                type="password"
                placeholder="••••••••"
                value={authCredentials.password || ''}
                onChange={(e) => setAuthCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-[#D8DADC] rounded-lg outline-none focus:border-[#EA7913]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Bearer Token / JWT (Opcional)</label>
              <input
                type="text"
                placeholder="eyJhbGci..."
                value={authCredentials.bearerToken || ''}
                onChange={(e) => setAuthCredentials(prev => ({ ...prev, bearerToken: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-[#D8DADC] rounded-lg outline-none focus:border-[#EA7913] font-mono text-[11px]"
              />
            </div>
          </div>
        )}

        {/* Create Branch Form */}
        {showBranchSection && (
          <div className="p-4 bg-[#F7F9FB] rounded-xl border border-[#D8DADC] flex flex-col sm:flex-row items-center gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex-1 w-full">
              <label className="block font-semibold text-gray-700 mb-1">Nome da Nova Branch no Repositório</label>
              <input
                type="text"
                placeholder="feature/qa-tested-branch"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D8DADC] rounded-lg outline-none focus:border-[#EA7913] font-mono"
              />
            </div>
            <button
              type="button"
              onClick={onCreateBranch}
              disabled={isCreatingBranch || !newBranchName.trim()}
              className="px-4 py-2 mt-4 sm:mt-0 rounded-lg bg-[#2D3133] hover:bg-[#1F2937] text-white font-semibold transition-all shrink-0 disabled:opacity-50"
            >
              {isCreatingBranch ? 'Criando Branch...' : 'Criar Branch no GitHub'}
            </button>
            {branchCreationResult && (
              <span className={`text-[11px] font-medium ${branchCreationResult.success ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
                {branchCreationResult.message}
              </span>
            )}
          </div>
        )}

        {/* Generate Plan Button */}
        <div className="pt-2">
          {planError && (
            <div className="mb-3 p-3 bg-[#FEF2F2] border border-[#F93E3E]/40 text-[#B91C1C] rounded-xl text-xs flex items-center gap-2">
              <XCircle size={15} />
              <span>{planError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onGeneratePlan}
            disabled={isPlanning}
            className="w-full py-3.5 px-4 rounded-xl bg-[#EA7913] hover:bg-[#D56A0C] text-white font-bold text-sm shadow-md shadow-[#EA7913]/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60"
          >
            <Sparkles size={18} />
            <span>{isPlanning ? 'Analisando e Formulando Roteiro com Quantum AI...' : 'Gerar Roteiro de Testes Padronizado com IA'}</span>
          </button>
        </div>
      </div>

      {/* Generated Test Suite Section with Multiple Minimum Criteria */}
      {steps.length > 0 && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-4 sm:p-6 space-y-5">
          {/* Quality Gate Banner */}
          <div className="bg-[#FFFDFB] border border-[#EA7913]/30 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#191C1E] font-sans">
                  Quality Gate & Critérios Mínimos de Aceitação (DoD)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFE3C9] text-[#944A00] font-mono">
                  {mandatoryCount} de {steps.length} obrigatórios ({totalCriterios} critérios definidos)
                </span>
              </div>
              <p className="text-xs text-[#565E74] mt-0.5">
                Requisitos essenciais para aprovação da suíte e transição para homologação manual
              </p>
            </div>

            {/* Batch actions */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={onMarkAllMinimos}
                className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#D8DADC] hover:bg-gray-100 text-gray-700 font-medium"
              >
                ⭐ Marcar Todos
              </button>
              <button
                type="button"
                onClick={onMarkCriticalMinimos}
                className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#D8DADC] hover:bg-gray-100 text-[#944A00] font-medium"
              >
                ⚡ Apenas Críticos
              </button>
              <button
                type="button"
                onClick={onClearMinimos}
                className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#D8DADC] hover:bg-gray-100 text-gray-500"
              >
                ✕ Limpar
              </button>
              <button
                type="button"
                onClick={onAddStep}
                className="px-3 py-1.5 rounded-lg bg-[#2D3133] hover:bg-[#1F2937] text-white font-semibold flex items-center gap-1"
              >
                <Plus size={13} /> + Adicionar Caso
              </button>
            </div>
          </div>

          {/* Test Case Cards List */}
          <div className="space-y-4">
            {steps.map((step, sIdx) => (
              <div
                key={step.id || sIdx}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  step.criterioMinimo
                    ? 'border-[#EA7913]/40 bg-[#FFFFFF] shadow-sm'
                    : 'border-[#E2E8F0] bg-[#FDFDFD]'
                }`}
              >
                {/* Header of Step */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-[#EA7913] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {step.stepNumber || sIdx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={step.nomeCaso || `Caso de Teste #${sIdx + 1}`}
                          onChange={(e) => onUpdateStep(sIdx, 'nomeCaso', e.target.value)}
                          className="font-bold text-sm text-[#191C1E] bg-transparent border-b border-transparent hover:border-[#D8DADC] focus:border-[#EA7913] outline-none flex-1"
                        />
                        <select
                          value={step.categoria || 'E2E'}
                          onChange={(e) => onUpdateStep(sIdx, 'categoria', e.target.value)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#61AFF2]/40 font-mono"
                        >
                          <option value="E2E">E2E</option>
                          <option value="API">API</option>
                          <option value="INTEGRATED">INTEGRATED</option>
                          <option value="SECURITY">SECURITY</option>
                          <option value="PERFORMANCE">PERFORMANCE</option>
                        </select>
                      </div>

                      {/* Description */}
                      <textarea
                        rows={2}
                        value={step.descricao}
                        onChange={(e) => onUpdateStep(sIdx, 'descricao', e.target.value)}
                        className="w-full text-xs text-[#565E74] bg-[#F7F9FB] p-2 rounded-lg border border-[#E2E8F0] outline-none focus:border-[#EA7913]"
                        placeholder="Procedimento detalhado de execução..."
                      />
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onRemoveStep(sIdx)}
                    title="Remover caso de teste"
                    className="p-1.5 text-gray-400 hover:text-[#B91C1C] rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Expected Result & Data */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#EA7913] uppercase tracking-wider text-[10px] mb-1">
                      Resultado Esperado (Critério Formal)
                    </label>
                    <textarea
                      rows={2}
                      value={step.resultadoEsperado}
                      onChange={(e) => onUpdateStep(sIdx, 'resultadoEsperado', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#D8DADC] rounded-lg outline-none focus:border-[#EA7913]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#565E74] uppercase tracking-wider text-[10px] mb-1">
                      Dados / Massa de Teste
                    </label>
                    <textarea
                      rows={2}
                      value={step.dadosTeste || ''}
                      onChange={(e) => onUpdateStep(sIdx, 'dadosTeste', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#D8DADC] rounded-lg outline-none focus:border-[#EA7913] font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Multiple Minimum Acceptance Criteria (DoD) */}
                <div className="mt-3.5 p-3.5 bg-[#FFFDFB] rounded-xl border border-[#EA7913]/25 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={step.criterioMinimo}
                        onChange={(e) => onUpdateStep(sIdx, 'criterioMinimo', e.target.checked)}
                        className="w-4 h-4 accent-[#EA7913] rounded"
                      />
                      <span className="font-bold text-xs text-[#944A00] uppercase tracking-wider">
                        Critério Mínimo de Aceitação (DoD Obrigatório)
                      </span>
                    </label>
                  </div>

                  {step.criterioMinimo && (
                    <div className="space-y-2 pt-1">
                      {(step.criteriosMinimos || [step.criterioMinimoDescricao || step.resultadoEsperado]).map(
                        (crit, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#FFE3C9] text-[#944A00] flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                              #{cIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={crit}
                              onChange={(e) => onUpdateCriterion(sIdx, cIdx, e.target.value)}
                              className="flex-1 px-2.5 py-1.5 bg-white border border-[#D8DADC] rounded-lg text-xs outline-none focus:border-[#EA7913]"
                              placeholder="Descreva o critério essencial..."
                            />
                            {(step.criteriosMinimos?.length || 1) > 1 && (
                              <button
                                type="button"
                                onClick={() => onRemoveCriterion(sIdx, cIdx)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                                title="Remover critério"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => onAddCriterion(sIdx)}
                        className="text-[11px] font-semibold text-[#EA7913] hover:text-[#D56A0C] flex items-center gap-1 pt-1"
                      >
                        <Plus size={12} /> + Adicionar Mais um Critério Mínimo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Execution Action Footer */}
          <div className="pt-4 border-t border-[#D8DADC] flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onExecuteIntegrated}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F2F4F6] text-[#2D3133] border border-[#D8DADC] text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Code2 size={15} className="text-[#EA7913]" />
              <span>Expandir para Testes Integrados</span>
            </button>

            <button
              type="button"
              onClick={onExecutePlaywright}
              disabled={isExecuting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#EA7913] hover:bg-[#D56A0C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#EA7913]/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60"
            >
              <Play size={16} />
              <span>{isExecuting ? 'Executando no Playwright...' : 'Executar Suíte de Testes no Playwright'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
