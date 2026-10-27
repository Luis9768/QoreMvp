/**
 * Qore Analytics - Advanced TypeScript Definitions
 * Standards: ISO/IEC/IEEE 29119, ISTQB CTFL, RBAC v3.1
 * Skills Applied: typescript-pro, typescript-advanced-types
 */

export type TestCategory = 'E2E' | 'API' | 'SECURITY' | 'PERFORMANCE' | 'INTEGRATED' | 'REGRESSION';

export type StepStatus = 'Pending' | 'Running' | 'Passed' | 'Failed' | 'Skipped';

export type QualityGateStatus = 'Passed' | 'PassedWithWarnings' | 'Failed';

export type UserRole = 'Dev' | 'QA' | 'Admin';

export type ExecutionMode = 'github' | 'prompt';

export type NavigationTab = 'dashboard' | 'prompt' | 'listagem' | 'detalhes' | 'users' | 'rtm';

/**
 * Caso / Passo de Teste Executável com DoD e múltiplos critérios
 */
export interface TestStep {
  id: string;
  stepNumber: number;
  nomeCaso?: string;
  categoria?: TestCategory;
  descricao: string;
  resultadoEsperado: string;
  criterioMinimo: boolean;
  criterioMinimoDescricao?: string;
  criteriosMinimos: string[];
  dadosTeste?: string;
  status: StepStatus;
  screenshotUrl?: string;
  screenshotFileName?: string;
  executionTimeMs?: number;
  errorMessage?: string;
  validatedDomSelectors?: string[];
  visualComparisonScore?: number;
}

/**
 * Metadados de Commit do GitHub
 */
export interface GitHubCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  branch?: string;
  repoUrl?: string;
}

/**
 * Resumo do Quality Gate e Critérios Mínimos (DoD)
 */
export interface QualityGateSummary {
  totalSteps: number;
  mandatorySteps: number;
  totalCriteriosMinimos: number;
  passedMandatory: number;
  failedMandatory: number;
  passedOptional: number;
  failedOptional: number;
  gatePassed: boolean;
  status: QualityGateStatus;
  approvalRecommendation: string;
}

/**
 * Credenciais e Autenticação de Teste
 */
export interface TestAuthCredentials {
  enabled: boolean;
  username: string;
  password?: string;
  bearerToken?: string;
  roleScope?: string;
}

/**
 * Assinatura Digital e Auditoria (QA / Dev)
 */
export interface TestDigitalSignature {
  signedBy: string;
  role: UserRole;
  company: string;
  signedAt: string;
  signatureHash: string;
  isVerified: boolean;
}

/**
 * Matriz de Rastreabilidade de Requisitos (RTM ISO/IEC/IEEE 29119)
 */
export interface RTMTraceItem {
  id: string;
  requirementId: string;
  module: string;
  requirementDesc: string;
  testCaseId: string;
  testCaseTitle: string;
  criteriosMinimos: string[];
  executionStatus: StepStatus;
  mandatoryDoD: boolean;
  verifiedCommit: string;
  verifiedDate: string;
}

/**
 * Usuário da Organização e Controle de Acesso (RBAC)
 */
export interface RBACMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  status: 'Ativo' | 'Pendente' | 'Inativo';
  lastActivity: string;
  avatarUrl?: string;
}

/**
 * Resposta da Análise e Planejamento da IA
 */
export interface PlanGenerationResult {
  steps: TestStep[];
  commitInfo?: GitHubCommitInfo;
  analysisReport?: string;
  executionTimeMs?: number;
  generatedAt: string;
  model: string;
}

/**
 * Resposta de Execução Playwright
 */
export interface PlaywrightExecutionResult {
  executionId: number;
  suiteStatus: StepStatus;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  executionTimeSeconds: number;
  steps: TestStep[];
  videoUrl?: string | null;
  videoFileName?: string | null;
  qualityGate: QualityGateSummary;
  signature?: TestDigitalSignature;
}

/**
 * Advanced Utility Types
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

export type ValueOf<T> = T[keyof T];

export type ApiResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string; statusCode?: number };

export type FilterPredicate<T> = (item: T) => boolean;
