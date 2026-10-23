import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Sparkles, 
  Database, 
  CheckCircle2, 
  XCircle,
  Clock, 
  Video, 
  Image as ImageIcon, 
  Layers, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Server,
  Cpu,
  Terminal,
  Eye,
  X,
  Maximize2,
  History,
  GitBranch,
  GitCommit,
  ShieldAlert,
  FileCode,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Copy,
  Download,
  FileText,
  CheckCheck,
  Activity,
  ListChecks,
  Sliders,
  BookmarkCheck,
  Bot,
  Search,
  Key,
  EyeOff,
  Lock,
  Table,
  FileSpreadsheet,
  Link2
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/qa';
const BACKEND_HOST = 'http://localhost:5000';

export default function Home() {
  // Configurações e Modos
  const [activeTab, setActiveTab] = useState('github'); // 'github' ou 'prompt'
  
  // Modo 2: Análise de Commit & Padronização (Sem Playwright)
  const [githubUrl, setGithubUrl] = useState('https://github.com/Luis9768/AfroKings-BarberShop');
  const [githubBranch, setGithubBranch] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showTokenVisible, setShowTokenVisible] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenTestResult, setTokenTestResult] = useState(null);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState(null);
  const [recentCommits, setRecentCommits] = useState([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [commitsError, setCommitsError] = useState(null);
  const [showCommitPicker, setShowCommitPicker] = useState(false);
  const [githubPrompt, setGithubPrompt] = useState('Focar em testes para novas alterações e validação de regras de agendamento/cancelamento.');
  
  // Modo 1: Automação E2E Playwright
  const [targetUrl, setTargetUrl] = useState('https://afrokings-front.duckdns.org');
  const [swaggerUrl, setSwaggerUrl] = useState('https://afrokings-api.duckdns.org/swagger-ui/index.html');
  const [userPrompt, setUserPrompt] = useState('Tente login com 2 credenciais inválidas. Depois faça login com lebron@email.com / afrokings. Tente agendar para ontem e depois para amanhã.');
  const [headless, setHeadless] = useState(true);

  // Estados de Planejamento e Análise de Testes
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: false, db: 'Verificando...', model: 'Quantum AI' });
  
  const [planResult, setPlanResult] = useState(null);
  const [editableSteps, setEditableSteps] = useState([]);
  const [planError, setPlanError] = useState(null);
  const [showFilesList, setShowFilesList] = useState(false);
  
  // Modais de Exportação e Prompt para IA
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false);
  const [aiPromptFormat, setAiPromptFormat] = useState('detailed'); // 'detailed' ou 'natural'

  // Estados de Execução E2E (Modo 1)
  const [execution, setExecution] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [executionError, setExecutionError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const logTerminalRef = useRef(null);

  // 1. Polling de status do Backend e histórico
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/executions`);
      if (res.ok) {
        const list = await res.json();
        setExecutionHistory(list);
        return list;
      }
    } catch (e) {}
    return [];
  };

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/status`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setBackendStatus({ online: true, db: data.database, model: 'Quantum AI' });
          }
        } else {
          if (isMounted) setBackendStatus({ online: false, db: 'Backend offline', model: '-' });
        }
      } catch (err) {
        if (isMounted) setBackendStatus({ online: false, db: 'Desconectado (Porta 5000)', model: '-' });
      }
    }
    
    checkHealth();
    try {
      const savedToken = localStorage.getItem('qa_github_token');
      if (savedToken && isMounted) setGithubToken(savedToken);
    } catch (e) {}

    fetchHistory().then(list => {
      if (isMounted && list && list.length > 0 && !execution) {
        setExecution(list[0]);
      }
    });

    const interval = setInterval(checkHealth, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Auto-scroll dos logs
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [execution?.logs]);

  // 3. Polling da Execução Ativa (Modo 1)
  useEffect(() => {
    if (!execution?.id || (execution.status !== 'Running' && execution.status !== 'Pending')) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/executions/${execution.id}`);
        if (res.ok) {
          const data = await res.json();
          setExecution(data);
          if (data.status === 'Passed' || data.status === 'Failed') {
            setIsExecuting(false);
            fetchHistory();
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [execution?.id, execution?.status]);

  // Handlers para Branch e Commit no GitHub
  const handleGithubUrlChange = (val) => {
    setGithubUrl(val);
    setBranchesError(null);
    setCommitsError(null);
    // Auto-detecção de link direto para commit: https://github.com/owner/repo/commit/1234567
    const commitMatch = val.match(/\/commit\/([a-fA-F0-9]{7,40})/);
    if (commitMatch && commitMatch[1]) {
      setCommitSha(commitMatch[1]);
    }
    // Auto-detecção de link direto para branch: https://github.com/owner/repo/tree/branch-name
    const treeMatch = val.match(/\/tree\/([^\/\?#]+)/);
    if (treeMatch && treeMatch[1]) {
      setGithubBranch(treeMatch[1]);
    }
  };

  const handleTokenChange = (val) => {
    setGithubToken(val);
    try {
      if (val && val.trim()) {
        localStorage.setItem('qa_github_token', val.trim());
      } else {
        localStorage.removeItem('qa_github_token');
      }
    } catch (e) {}
  };

  const handleTestToken = async () => {
    if (!githubToken || !githubToken.trim()) return;
    setIsValidatingToken(true);
    setTokenTestResult(null);
    try {
      const urlParam = githubUrl ? `&url=${encodeURIComponent(githubUrl.trim())}` : '';
      const tokenParam = `token=${encodeURIComponent(githubToken.trim())}`;
      const headers = { 'X-GitHub-Token': githubToken.trim() };
      const res = await fetch(`${API_BASE}/github/validate-token?${tokenParam}${urlParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTokenTestResult(data);
      } else {
        setTokenTestResult({
          valid: false,
          message: `Erro ao testar token (HTTP ${res.status}).`,
          recommendation: 'Verifique se o backend está ativo.'
        });
      }
    } catch (e) {
      setTokenTestResult({
        valid: false,
        message: 'Falha ao conectar com o backend para validar token.',
        recommendation: 'Verifique se o backend está rodando na porta 5000.'
      });
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleFetchBranches = async () => {
    if (!githubUrl || !githubUrl.trim()) return;
    setIsLoadingBranches(true);
    setBranchesError(null);
    try {
      const headers = {};
      if (githubToken && githubToken.trim()) headers['X-GitHub-Token'] = githubToken.trim();
      const tokenParam = githubToken && githubToken.trim() ? `&token=${encodeURIComponent(githubToken.trim())}` : '';
      const res = await fetch(`${API_BASE}/github/branches?url=${encodeURIComponent(githubUrl.trim())}${tokenParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAvailableBranches(data);
        if (!data || data.length === 0) {
          setBranchesError('Nenhuma branch encontrada para este repositório.');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setBranchesError(err.error || `Erro HTTP ${res.status} ao buscar branches.`);
      }
    } catch (e) {
      setBranchesError('Falha ao conectar com o backend para buscar branches.');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleFetchRecentCommits = async (branchOverride = null) => {
    if (!githubUrl || !githubUrl.trim()) return;
    setIsLoadingCommits(true);
    setCommitsError(null);
    try {
      const activeBranch = branchOverride !== null ? branchOverride : (githubBranch ? githubBranch.trim() : '');
      const branchParam = activeBranch ? `&branch=${encodeURIComponent(activeBranch)}` : '';
      const tokenParam = githubToken && githubToken.trim() ? `&token=${encodeURIComponent(githubToken.trim())}` : '';
      const headers = {};
      if (githubToken && githubToken.trim()) headers['X-GitHub-Token'] = githubToken.trim();
      const res = await fetch(`${API_BASE}/github/commits?url=${encodeURIComponent(githubUrl.trim())}${branchParam}${tokenParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRecentCommits(data);
        setShowCommitPicker(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setCommitsError(err.error || `Erro HTTP ${res.status} ao carregar commits recentes.`);
      }
    } catch (e) {
      setCommitsError('Falha ao conectar com o backend para buscar commits.');
    } finally {
      setIsLoadingCommits(false);
    }
  };

  // 4. Gerar Casos de Teste (Modo 1 ou Modo 2)
  const handleGeneratePlan = async () => {
    if (activeTab === 'prompt' && (!targetUrl || !targetUrl.trim())) {
      setPlanError('Por favor, informe a URL da aplicação web alvo (ex: https://vittoriastudio.vercel.app).');
      return;
    }
    if (activeTab === 'github' && (!githubUrl || !githubUrl.trim())) {
      setPlanError('Por favor, informe o link do repositório no GitHub.');
      return;
    }

    setIsPlanning(true);
    setPlanResult(null);
    setEditableSteps([]);
    setPlanError(null);
    setExecutionError(null);

    const headers = { 'Content-Type': 'application/json' };
    if (githubToken && githubToken.trim()) headers['X-GitHub-Token'] = githubToken.trim();

    const payload = {
      targetUrl: activeTab === 'github' ? (targetUrl || 'github') : targetUrl.trim(),
      swaggerUrl: activeTab === 'github' ? null : (swaggerUrl?.trim() || null),
      prompt: activeTab === 'github' ? githubPrompt : userPrompt,
      mode: activeTab,
      githubUrl: activeTab === 'github' ? githubUrl.trim() : null,
      githubBranch: activeTab === 'github' ? (githubBranch?.trim() || null) : null,
      commitSha: activeTab === 'github' ? (commitSha?.trim() || null) : null,
      githubToken: activeTab === 'github' ? (githubToken?.trim() || null) : null
    };

    try {
      const res = await fetch(`${API_BASE}/plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setPlanResult(data);
        const steps = (data.passos || []).map((p, idx) => ({
          id: p.id || idx + 1,
          codigo: (p.codigo && p.codigo.startsWith('TC-') && p.codigo.length <= 10) ? p.codigo : `TC-${String(idx + 1).padStart(2, '0')}`,
          titulo: p.titulo || `Caso de Teste #${idx + 1}`,
          tipo: p.tipo || 'Funcional',
          tecnica: p.tecnica || 'Partição de Equivalência',
          prioridade: p.prioridade || 'Alta',
          preCondicao: p.preCondicao || 'Sistema acessível e ambiente preparado',
          dadosTeste: p.dadosTeste || 'Dados de formulário aplicáveis',
          acao: p.acao || 'validar',
          alvo: p.alvo || '',
          descricao: p.descricao || '',
          resultadoEsperado: p.resultadoEsperado || 'Interface atualizada em conformidade'
        }));
        setEditableSteps(steps);
      } else {
        setPlanError(data?.error || `Falha HTTP ${res.status} ao analisar e gerar plano.`);
      }
    } catch (err) {
      setPlanError(`Falha de conexão com o backend em ${API_BASE}. Certifique-se de que o serviço está online.`);
    } finally {
      setIsPlanning(false);
    }
  };

  // Gerenciamento dos Casos de Teste Padronizados (Adicionar / Editar / Remover)
  const handleRemoveStep = (indexToRemove) => {
    setEditableSteps(prev => 
      prev.filter((_, idx) => idx !== indexToRemove).map((s, idx) => ({ 
        ...s, 
        id: idx + 1,
        codigo: s.codigo?.startsWith('TC-') ? `TC-${String(idx + 1).padStart(2, '0')}` : s.codigo
      }))
    );
  };

  const handleAddStep = () => {
    const nextIdx = editableSteps.length + 1;
    setEditableSteps(prev => [
      ...prev,
      {
        id: nextIdx,
        codigo: `TC-${String(nextIdx).padStart(2, '0')}`,
        titulo: `[Funcional] Validação personalizada #${nextIdx}`,
        tipo: 'Funcional',
        tecnica: 'Partição de Equivalência',
        prioridade: 'Alta',
        preCondicao: 'Usuário autenticado no ambiente de testes',
        dadosTeste: 'Dados de teste específicos',
        acao: 'validar',
        alvo: '',
        descricao: 'Passo a passo detalhado do procedimento de teste...',
        resultadoEsperado: 'Comportamento esperado e critérios de aceitação verificáveis'
      }
    ]);
  };

  const handleUpdateStep = (index, field, value) => {
    setEditableSteps(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // 5. Executar Plano com Playwright (Apenas Modo 1)
  const handleExecutePlaywright = async () => {
    if (editableSteps.length === 0) {
      setExecutionError('A lista de casos de teste está vazia. Planeje os casos primeiro.');
      return;
    }
    if (!targetUrl || !targetUrl.trim()) {
      setExecutionError('Informe a URL da aplicação alvo para executar no Playwright.');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);

    try {
      const res = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          prompt: planResult?.titulo || userPrompt,
          testPlanId: planResult?.planId || null,
          headless: headless,
          steps: editableSteps
        })
      });

      const data = await res.json();
      if (res.ok && data.executionId) {
        setExecution({
          id: data.executionId,
          status: 'Running',
          targetUrl: targetUrl.trim(),
          prompt: planResult?.titulo || userPrompt,
          startedAt: new Date().toISOString(),
          totalSteps: editableSteps.length,
          passedSteps: 0,
          failedSteps: 0,
          logs: `[${new Date().toLocaleTimeString()}] Execução #${data.executionId} iniciada. Abrindo Chromium com ${editableSteps.length} casos...`,
          steps: editableSteps.map((p, idx) => ({
            id: idx + 1,
            stepNumber: idx + 1,
            codigo: p.codigo,
            stepTitle: p.titulo,
            tipo: p.tipo,
            tecnica: p.tecnica,
            prioridade: p.prioridade,
            preCondicao: p.preCondicao,
            dadosTeste: p.dadosTeste,
            descricao: p.descricao,
            resultadoEsperado: p.resultadoEsperado,
            status: 'Running'
          }))
        });
      } else {
        setIsExecuting(false);
        setExecutionError(data?.error || 'Erro ao iniciar execução no Playwright.');
      }
    } catch (err) {
      setIsExecuting(false);
      setExecutionError(`Erro de comunicação: ${err.message}`);
    }
  };

  // 5b. Gerar & Executar no Playwright em 1 Clique (Modo 1)
  const handleGenerateAndExecute = async () => {
    if (!targetUrl || !targetUrl.trim()) {
      setPlanError('Por favor, informe a URL da aplicação web alvo (ex: https://vittoriastudio.vercel.app).');
      return;
    }
    if (!userPrompt || !userPrompt.trim()) {
      setPlanError('Por favor, descreva o objetivo do teste ou fluxo a ser executado.');
      return;
    }

    setIsPlanning(true);
    setPlanResult(null);
    setEditableSteps([]);
    setPlanError(null);
    setExecutionError(null);

    const payload = {
      targetUrl: targetUrl.trim(),
      swaggerUrl: swaggerUrl?.trim() || null,
      prompt: userPrompt.trim(),
      mode: 'prompt',
      githubUrl: null
    };

    try {
      const res = await fetch(`${API_BASE}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setPlanError(data?.error || `Falha HTTP ${res.status} ao planejar casos de teste.`);
        setIsPlanning(false);
        return;
      }

      setPlanResult(data);
      const steps = (data.passos || []).map((p, idx) => ({
        id: p.id || idx + 1,
        codigo: (p.codigo && p.codigo.startsWith('TC-') && p.codigo.length <= 10) ? p.codigo : `TC-${String(idx + 1).padStart(2, '0')}`,
        titulo: p.titulo || `Caso de Teste #${idx + 1}`,
        tipo: p.tipo || 'Funcional',
        tecnica: p.tecnica || 'Partição de Equivalência',
        prioridade: p.prioridade || 'Alta',
        preCondicao: p.preCondicao || 'Sistema acessível e ambiente preparado',
        dadosTeste: p.dadosTeste || 'Dados de formulário aplicáveis',
        acao: p.acao || 'validar',
        alvo: p.alvo || '',
        descricao: p.descricao || '',
        resultadoEsperado: p.resultadoEsperado || 'Interface atualizada em conformidade'
      }));
      setEditableSteps(steps);
      setIsPlanning(false);

      if (steps.length === 0) {
        setPlanError('Nenhum caso de teste foi gerado para este objetivo.');
        return;
      }

      // Inicia imediatamente no Playwright
      setIsExecuting(true);
      const execRes = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          prompt: data.titulo || userPrompt,
          testPlanId: data.planId || null,
          headless: headless,
          steps: steps
        })
      });

      const execData = await execRes.json();
      if (execRes.ok && execData.executionId) {
        setExecution({
          id: execData.executionId,
          status: 'Running',
          targetUrl: targetUrl.trim(),
          prompt: data.titulo || userPrompt,
          startedAt: new Date().toISOString(),
          totalSteps: steps.length,
          passedSteps: 0,
          failedSteps: 0,
          logs: `[${new Date().toLocaleTimeString()}] Execução #${execData.executionId} iniciada. Abrindo Chromium com ${steps.length} casos...`,
          steps: steps.map((p, idx) => ({
            id: idx + 1,
            stepNumber: idx + 1,
            codigo: p.codigo,
            stepTitle: p.titulo,
            tipo: p.tipo,
            tecnica: p.tecnica,
            prioridade: p.prioridade,
            preCondicao: p.preCondicao,
            dadosTeste: p.dadosTeste,
            descricao: p.descricao,
            resultadoEsperado: p.resultadoEsperado,
            status: 'Running'
          }))
        });
      } else {
        setIsExecuting(false);
        setExecutionError(execData?.error || 'Erro ao iniciar execução no Playwright.');
      }
    } catch (err) {
      setIsPlanning(false);
      setIsExecuting(false);
      setPlanError(`Falha de comunicação: ${err.message}`);
    }
  };

  // 6. Geração de Prompt Executável para IA (Gemini, Claude, ChatGPT, Playwright)
  const generateAiPrompt = (format = 'detailed') => {
    if (editableSteps.length === 0) return '';
    
    if (format === 'natural') {
      const lines = [];
      lines.push(`Acesse a aplicação ${targetUrl || 'web'} e execute os seguintes casos de teste em sequência:\n`);
      editableSteps.forEach((s, idx) => {
        const isNegativo = (s.tipo || '').toLowerCase().includes('negativo');
        let text = `${idx + 1}. [${s.codigo || `TC-${idx+1}`}] ${s.titulo}: ${s.descricao.trim()}`;
        if (s.dadosTeste && s.dadosTeste !== 'N/A' && !s.dadosTeste.includes('Dados de formulário')) {
          text += ` (Dados de entrada: ${s.dadosTeste}).`;
        }
        if (isNegativo) {
          text += ` ATENÇÃO: Por ser um teste negativo, se você NÃO conseguir avançar, a tentativa for recusada ou o sistema exibir mensagem de validação/erro, deu certo (resultado esperado de sucesso do teste).`;
        } else {
          text += ` Caso você consiga concluir com êxito e observar '${s.resultadoEsperado}', deu certo.`;
        }
        lines.push(text);
      });
      lines.push(`\nAo final, reporte detalhadamente o status de cada caso de teste (Aprovado ou Falhou) com as evidências encontradas.`);
      return lines.join('\n');
    }

    // Formato Estruturado Detalhado (padrão ideal para agentes autônomos e LLMs)
    const lines = [];
    lines.push(`Você é um Agente Autônomo Especialista em Execução de Testes E2E.`);
    lines.push(`Sua missão é executar rigorosamente a seguinte suíte de casos de teste:\n`);
    if (targetUrl) lines.push(`Aplicação Web Alvo: ${targetUrl}`);
    if (planResult?.commit) {
      const branchInfo = planResult.commit.branch ? ` (Branch: ${planResult.commit.branch})` : (githubBranch ? ` (Branch: ${githubBranch})` : '');
      lines.push(`Contexto da Alteração: Commit ${planResult.commit.shortSha}${branchInfo} - ${planResult.commit.message}`);
    }
    lines.push(`\nDIRETRIZES DE EXECUÇÃO:`);
    lines.push(`- Siga rigorosamente a ordem sequencial dos casos de teste.`);
    lines.push(`- TESTES NEGATIVOS: Rejeição de login inválido, bloqueio de agendamento em data proibida ou mensagens de erro representam o resultado de SUCESSO APROVADO ("se não conseguir ou for bloqueado, deu certo").`);
    lines.push(`- TESTES FUNCIONAIS / REGRESSÃO: A conclusão com sucesso e renderização dos elementos corretos confirmam a aprovação ("se conseguir, deu certo").`);
    lines.push(`- Verifique os critérios de aceite ao final de cada caso.\n`);
    lines.push(`======================================================================`);
    lines.push(`SUÍTE DE CASOS DE TESTE PADRONIZADOS (${editableSteps.length} CASOS):`);
    lines.push(`======================================================================\n`);

    editableSteps.forEach((s, idx) => {
      lines.push(`[CASO ${idx + 1}] Código: ${s.codigo || `TC-${idx+1}`}`);
      lines.push(`Título: ${s.titulo}`);
      lines.push(`Classificação: ${s.tipo || 'Funcional'} | Severidade: ${s.prioridade || 'Alta'} | Técnica: ${s.tecnica || 'ISTQB'}`);
      if (s.preCondicao) lines.push(`Pré-condição: ${s.preCondicao}`);
      if (s.dadosTeste) lines.push(`Dados de Teste: ${s.dadosTeste}`);
      lines.push(`Procedimento Passo a Passo: ${s.descricao}`);
      lines.push(`Critério de Aceite / Assert: ${s.resultadoEsperado}`);
      const isNegativo = (s.tipo || '').toLowerCase().includes('negativo');
      if (isNegativo) {
        lines.push(`Regra de Avaliação: Bloqueio ou exibição de aviso de erro nesta etapa = TESTE APROVADO.`);
      }
      lines.push(``);
    });

    lines.push(`======================================================================`);
    lines.push(`Por favor, execute todos os passos e retorne um relatório com:`);
    lines.push(`1. Status de cada caso (Passed / Failed)`);
    lines.push(`2. Evidências observadas e erros encontrados`);
    return lines.join('\n');
  };

  const handleCopyAiPrompt = () => {
    const text = generateAiPrompt(aiPromptFormat);
    navigator.clipboard.writeText(text);
    setCopiedAiPrompt(true);
    setTimeout(() => setCopiedAiPrompt(false), 2500);
  };

  const handleDownloadAiPrompt = () => {
    const text = generateAiPrompt(aiPromptFormat);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prompt_IA_Testes_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendPromptToMode1 = () => {
    const promptText = generateAiPrompt('natural');
    setUserPrompt(promptText);
    setActiveTab('prompt');
    setShowAiPromptModal(false);
  };

  // Matriz de Rastreabilidade de Requisitos (RTM - ISO/IEC/IEEE 29119)
  const getRtmList = () => {
    if (!planResult) return [];
    const direct = planResult.matrizRastreabilidade || planResult.rtm || planResult.analise?.matrizRastreabilidade;
    if (Array.isArray(direct) && direct.length > 0) return direct;

    // Fallback estruturado inteligente a partir dos casos de teste e arquivos do commit
    if (editableSteps.length > 0) {
      const commitFiles = planResult.commit?.files || [];
      return editableSteps.map((s, idx) => {
        const matchedFile = commitFiles[idx % (commitFiles.length || 1)]?.filename || 'Código-fonte do Commit';
        const modTitle = s.titulo || '';
        let modName = 'Interface / Fluxo';
        if (modTitle.toLowerCase().includes('agend')) modName = 'Agendamento';
        else if (modTitle.toLowerCase().includes('login') || modTitle.toLowerCase().includes('auth')) modName = 'Autenticação';
        else if (modTitle.toLowerCase().includes('perfil') || modTitle.toLowerCase().includes('user')) modName = 'Gestão de Usuário';
        else if (modTitle.toLowerCase().includes('notifica')) modName = 'Notificações';

        return {
          idRequisito: `REQ-${String(idx + 1).padStart(2, '0')}`,
          titulo: s.titulo?.replace(/^\[.*?\]\s*/, '') || `Requisito associado ao ${s.codigo || `TC-${idx + 1}`}`,
          categoria: s.tipo || 'Regra de Negócio',
          modulo: modName,
          arquivosAfetados: [matchedFile],
          casosTesteIds: [s.codigo || `TC-${String(idx + 1).padStart(2, '0')}`],
          statusCobertura: '100% Coberto',
          prioridade: s.prioridade || 'Alta',
          justificativa: s.resultadoEsperado || 'Coberto por caso de teste de regressão e aceitação.'
        };
      });
    }
    return [];
  };

  const handleDownloadRtmCsv = () => {
    const list = getRtmList();
    if (list.length === 0) return;
    const headers = ['ID Requisito', 'Módulo', 'Categoria', 'Título / Requisito', 'Arquivos Afetados', 'Casos de Teste Vinculados', 'Status Cobertura', 'Prioridade', 'Justificativa'];
    const rows = list.map(item => [
      `"${(item.idRequisito || '').replace(/"/g, '""')}"`,
      `"${(item.modulo || '').replace(/"/g, '""')}"`,
      `"${(item.categoria || '').replace(/"/g, '""')}"`,
      `"${(item.titulo || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(item.arquivosAfetados) ? item.arquivosAfetados.join('; ') : (item.arquivosAfetados || '')).replace(/"/g, '""')}"`,
      `"${(Array.isArray(item.casosTesteIds) ? item.casosTesteIds.join(', ') : (item.casosTesteIds || '')).replace(/"/g, '""')}"`,
      `"${(item.statusCobertura || '100% Coberto').replace(/"/g, '""')}"`,
      `"${(item.prioridade || 'Alta').replace(/"/g, '""')}"`,
      `"${(item.justificativa || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Matriz_Rastreabilidade_RTM_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportação em Markdown (Padrão ISTQB & ISO/IEC/IEEE 29119)
  const generateMarkdownDossier = () => {
    const lines = [];
    lines.push(`# Dossiê de Especificação e Análise de Testes de Software`);
    lines.push(`**Norma Técnica:** ISTQB CTFL/CTAL & ISO/IEC/IEEE 29119 (RTM)`);
    lines.push(`**Plataforma:** Qore Analytics • Motor Quantum AI`);
    lines.push(`**Data de Emissão:** ${new Date().toLocaleString()}`);
    lines.push(``);

    if (planResult?.commit) {
      lines.push(`## 1. Dados da Alteração de Código (Git Commit)`);
      lines.push(`- **Repositório:** ${githubUrl}`);
      if (planResult.commit.branch || githubBranch) {
        lines.push(`- **Branch:** \`${planResult.commit.branch || githubBranch}\``);
      }
      lines.push(`- **Commit SHA:** \`${planResult.commit.sha}\` (${planResult.commit.shortSha})`);
      lines.push(`- **Autor:** ${planResult.commit.author}`);
      lines.push(`- **Data do Commit:** ${planResult.commit.date ? new Date(planResult.commit.date).toLocaleString() : 'Recente'}`);
      lines.push(`- **Mensagem:** ${planResult.commit.message}`);
      lines.push(``);
    }

    lines.push(`## 2. Relatório de Análise Técnica de Testes (Test Analysis)`);
    if (planResult?.analise?.resumoExecutivo) {
      lines.push(`### Resumo Executivo:`);
      lines.push(`${planResult.analise.resumoExecutivo}`);
      lines.push(``);
    }
    if (planResult?.analiseImpacto) {
      lines.push(`### Análise de Impacto Técnico:`);
      lines.push(`${planResult.analiseImpacto}`);
      lines.push(``);
    }

    if (Array.isArray(planResult?.matrizRisco) && planResult.matrizRisco.length > 0) {
      lines.push(`### Matriz de Riscos de Regressão & Rastreabilidade:`);
      lines.push(`| ID | Risco Identificado | Probabilidade | Impacto | Mitigação Sugerida | Caso Mitigador |`);
      lines.push(`|---|---|---|---|---|---|`);
      planResult.matrizRisco.forEach(r => {
        lines.push(`| ${r.id || 'R'} | ${r.risco || '-'} | ${r.probabilidade || '-'} | ${r.impacto || '-'} | ${r.mitigacao || '-'} | ${r.casoMitigador || '-'} |`);
      });
      lines.push(``);
    }

    const rtmList = getRtmList();
    if (rtmList.length > 0) {
      lines.push(`## 3. Matriz de Rastreabilidade de Requisitos (RTM - ISO/IEC/IEEE 29119)`);
      lines.push(`Mapeamento bidirecional entre Requisitos de Negócio, Arquivos do Git e Casos de Teste:`);
      lines.push(``);
      lines.push(`| ID Requisito | Módulo | Requisito / Especificação | Arquivos Afetados (Git Diff) | Casos de Teste Vinculados | Status Cobertura | Prioridade |`);
      lines.push(`|---|---|---|---|---|---|---|`);
      rtmList.forEach(item => {
        const arqs = Array.isArray(item.arquivosAfetados) ? item.arquivosAfetados.map(a => `\`${a}\``).join(', ') : (item.arquivosAfetados || '-');
        const tcs = Array.isArray(item.casosTesteIds) ? item.casosTesteIds.map(t => `\`${t}\``).join(', ') : (item.casosTesteIds || '-');
        lines.push(`| **${item.idRequisito || 'REQ'}** | ${item.modulo || 'Geral'} | ${item.titulo || '-'} | ${arqs} | ${tcs} | **${item.statusCobertura || '100% Coberto'}** | ${item.prioridade || 'Alta'} |`);
      });
      lines.push(``);
    }

    lines.push(`## 4. Especificação Padronizada dos Casos de Teste (${editableSteps.length} Casos)`);
    editableSteps.forEach((s, idx) => {
      lines.push(`### ${s.codigo || `TC-${idx+1}`}: ${s.titulo}`);
      lines.push(`- **Categoria:** ${s.tipo || 'Funcional'}`);
      lines.push(`- **Técnica ISTQB:** ${s.tecnica || 'Partição de Equivalência'}`);
      lines.push(`- **Prioridade:** ${s.prioridade || 'Alta'}`);
      lines.push(`- **Pré-Condição:** ${s.preCondicao || 'N/A'}`);
      lines.push(`- **Dados de Teste:** ${s.dadosTeste || 'N/A'}`);
      lines.push(`- **Procedimento de Teste:** ${s.descricao}`);
      lines.push(`- **Critério de Aceite / Resultado Esperado:** ${s.resultadoEsperado}`);
      lines.push(``);
    });

    lines.push(`---`);
    lines.push(`*Gerado automaticamente pelo Qore Analytics (Motor Quantum AI) • ISTQB CTFL/CTAL & ISO/IEC/IEEE 29119*`);
    return lines.join('\n');
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdownDossier();
    navigator.clipboard.writeText(text);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdownDossier();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_QA_Padronizado_${new Date().toISOString().slice(0,10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Cores por tipo de teste
  const getBadgeTypeColor = (tipo) => {
    switch ((tipo || '').toLowerCase()) {
      case 'regressão':
      case 'regressao':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'negativo':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'borda':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'funcional':
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  const getPriorityColor = (prioridade) => {
    switch ((prioridade || '').toLowerCase()) {
      case 'crítica':
      case 'critica':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'alta':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-700/60 text-slate-300 border-slate-600/50';
    }
  };

  // Estatísticas de Cobertura
  const coverageStats = {
    funcional: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('funcional')).length,
    regressao: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('regress')).length,
    negativo: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('negativo')).length,
    borda: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('borda')).length,
    critica: editableSteps.filter(s => (s.prioridade || '').toLowerCase().includes('cr')).length,
    alta: editableSteps.filter(s => (s.prioridade || '').toLowerCase().includes('alt')).length,
  };

  // Renderizador unificado da Suíte de Casos de Teste (compatível com Modo 1 e Modo 2)
  const renderTestSuite = (mode) => {
    if (editableSteps.length === 0) return null;
    const isMode1 = mode === 'prompt';

    return (
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in slide-in-from-bottom-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ListChecks size={18} className="text-purple-400" />
                {isMode1 ? 'Casos de Teste Planejados para Execução E2E' : 'Suíte de Casos de Teste Padronizados (Norma ISTQB)'}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {editableSteps.length} casos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isMode1 
                ? 'Revise os passos antes ou durante a execução no Playwright. Você pode alterar campos, adicionar novos casos ou excluir qualquer um.' 
                : 'Revise os casos gerados. Você pode adicionar novos casos, remover qualquer um, editar campos e gerar o prompt para a IA.'}
            </p>
          </div>

          {/* Ações no Topo da Suíte */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isMode1 ? (
              <button
                type="button"
                onClick={handleExecutePlaywright}
                disabled={isExecuting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {isExecuting ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} className="fill-white" />}
                <span>{isExecuting ? 'Executando no Chromium...' : 'Executar Estes Casos no Playwright'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAiPromptModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/25 transition-all"
              >
                <Bot size={16} />
                <span>Gerar Prompt para IA Executar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddStep}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
            >
              <Plus size={15} /> Adicionar Caso
            </button>

            {isMode1 ? (
              <button
                type="button"
                onClick={() => setShowAiPromptModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
              >
                <Bot size={15} className="text-purple-400" /> Prompt IA
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
              >
                <FileText size={15} /> Exportar Dossiê (.md)
              </button>
            )}
          </div>
        </div>

        {/* Lista de Fichas de Casos de Teste */}
        <div className="space-y-4">
          {editableSteps.map((step, index) => (
            <div 
              key={step.id || index}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3.5 shadow-sm"
            >
              {/* Cabeçalho da Ficha de Teste */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Código do Caso */}
                  <input 
                    type="text"
                    value={step.codigo || `TC-${String(index + 1).padStart(2, '0')}`}
                    onChange={(e) => handleUpdateStep(index, 'codigo', e.target.value)}
                    className="w-16 text-center font-mono font-bold text-xs px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-purple-300 focus:outline-none focus:border-purple-500"
                    title="Código Formal do Caso de Teste"
                  />

                  {/* Categoria / Tipo */}
                  <select
                    value={step.tipo || 'Funcional'}
                    onChange={(e) => handleUpdateStep(index, 'tipo', e.target.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold outline-none bg-slate-900 ${getBadgeTypeColor(step.tipo)}`}
                  >
                    <option value="Funcional">Funcional</option>
                    <option value="Regressão">Regressão</option>
                    <option value="Negativo">Negativo</option>
                    <option value="Borda">Borda</option>
                  </select>

                  {/* Técnica ISTQB */}
                  <select
                    value={step.tecnica || 'Partição de Equivalência'}
                    onChange={(e) => handleUpdateStep(index, 'tecnica', e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-medium text-slate-300 bg-slate-900 outline-none"
                  >
                    <option value="Transição de Estado">Transição de Estado</option>
                    <option value="Partição de Equivalência">Partição de Equivalência</option>
                    <option value="Análise de Valor Limite">Análise de Valor Limite</option>
                    <option value="Teste Baseado em Risco">Teste Baseado em Risco</option>
                  </select>

                  {/* Prioridade */}
                  <select
                    value={step.prioridade || 'Alta'}
                    onChange={(e) => handleUpdateStep(index, 'prioridade', e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border font-medium outline-none bg-slate-900 ${getPriorityColor(step.prioridade)}`}
                  >
                    <option value="Crítica">P1 - Crítica</option>
                    <option value="Alta">P2 - Alta</option>
                    <option value="Média">P3 - Média</option>
                  </select>
                </div>

                {/* Botão de Excluir Caso */}
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 transition-colors self-end sm:self-auto flex items-center gap-1 text-xs"
                  title="Excluir caso de teste"
                >
                  <Trash2 size={15} />
                  <span className="sm:hidden">Excluir</span>
                </button>
              </div>

              {/* Título Padronizado */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">TÍTULO DESCRITIVO:</label>
                <input 
                  type="text"
                  value={step.titulo}
                  onChange={(e) => handleUpdateStep(index, 'titulo', e.target.value)}
                  placeholder="Título formal do caso de teste..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Grid de 4 Campos Estruturados da Especificação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Coluna 1: Pré-Condição e Dados de Teste */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      📌 Pré-Condições do Sistema:
                    </label>
                    <input 
                      type="text"
                      value={step.preCondicao || ''}
                      onChange={(e) => handleUpdateStep(index, 'preCondicao', e.target.value)}
                      placeholder="Ex: Usuário autenticado; agendamento existente"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      📋 Dados de Teste Padronizados (Inputs/Credenciais):
                    </label>
                    <input 
                      type="text"
                      value={step.dadosTeste || ''}
                      onChange={(e) => handleUpdateStep(index, 'dadosTeste', e.target.value)}
                      placeholder="Ex: lebron@email.com / afrokings / data amanhã"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Coluna 2: Procedimento e Resultado Esperado */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      📝 Procedimento de Execução do Teste (Passo a Passo):
                    </label>
                    <textarea
                      rows={2}
                      value={step.descricao}
                      onChange={(e) => handleUpdateStep(index, 'descricao', e.target.value)}
                      placeholder="Passos que o testador ou teste automatizado deve seguir..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-emerald-400 block mb-1">
                      🎯 Critério de Aceite / Resultado Esperado:
                    </label>
                    <input 
                      type="text"
                      value={step.resultadoEsperado || ''}
                      onChange={(e) => handleUpdateStep(index, 'resultadoEsperado', e.target.value)}
                      placeholder="Ex: O badge exibe o texto 'Cancelado' e a reserva é bloqueada para novo agendamento"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-950 text-emerald-300 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra Inferior com CTA */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleAddStep}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Plus size={15} /> Adicionar Mais um Caso
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {isMode1 ? (
              <button
                type="button"
                onClick={handleExecutePlaywright}
                disabled={isExecuting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {isExecuting ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} className="fill-white" />}
                <span>{isExecuting ? 'Executando no Chromium...' : 'Executar Estes Casos no Playwright'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowAiPromptModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Bot size={16} />
                  <span>Gerar Prompt para IA Executar</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copiedExport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedExport ? 'Copiado!' : 'Copiar Dossiê (.md)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Download size={15} />
                  <span>Visualizar Dossiê</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Modal de visualização de Print ampliado (Modo 1) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl overflow-hidden">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
            <img 
              src={selectedImage} 
              alt="Evidência ampliada" 
              className="w-full h-auto max-h-[82vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Modal de Prompt para IA Executar */}
      {showAiPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Prompt Executável para IA (Agentes & LLMs)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Copie para jogar em qualquer IA (ChatGPT, Claude, Gemini) ou envie para o robô Playwright do Modo 1.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiPromptModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Seletor de Formato */}
            <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Formato do Prompt:</span>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex">
                  <button
                    onClick={() => setAiPromptFormat('detailed')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      aiPromptFormat === 'detailed' 
                        ? 'bg-purple-600 text-white font-semibold shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Estruturado (Para Agentes Autônomos)
                  </button>
                  <button
                    onClick={() => setAiPromptFormat('natural')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      aiPromptFormat === 'natural' 
                        ? 'bg-purple-600 text-white font-semibold shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Linguagem Natural Direta
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-purple-300/80 font-mono">
                {editableSteps.length} casos de teste compilados
              </span>
            </div>

            {/* Preview do Prompt */}
            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 whitespace-pre-wrap leading-relaxed select-all">
                {generateAiPrompt(aiPromptFormat)}
              </pre>
            </div>

            {/* Ações Inferiores */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Você pode colar no chat da IA ou executar no Playwright.
              </span>
              <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyAiPrompt}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
                >
                  {copiedAiPrompt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedAiPrompt ? 'Copiado!' : 'Copiar Prompt'}</span>
                </button>

                <button
                  onClick={handleDownloadAiPrompt}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Download size={14} />
                  <span>Baixar .txt</span>
                </button>

                <button
                  onClick={handleSendPromptToMode1}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Play size={14} className="fill-white" />
                  <span>Enviar para Modo 1 (Executar no Playwright)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportação do Dossiê Padronizado */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Dossiê de Especificação e Análise de Testes (ISTQB)
                </h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                {generateMarkdownDossier()}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Pronto para anexar no TCC, monografia, Jira ou TestRail.
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadRtmCsv}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-600/60 shadow-md shadow-emerald-700/20"
                >
                  <FileSpreadsheet size={14} />
                  <span>Exportar RTM (.csv)</span>
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedExport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedExport ? 'Copiado para Área de Transferência!' : 'Copiar Markdown'}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
                >
                  <Download size={14} />
                  <span>Baixar Arquivo .md</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Diálogo de Seleção de Commits Recentes */}
      {showCommitPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <GitCommit size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Selecionar Commit para Geração de Testes
                  </h3>
                  <p className="text-xs text-slate-400">
                    {githubBranch ? `Commits recentes na branch '${githubBranch}'` : 'Últimos commits da branch padrão'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCommitPicker(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {recentCommits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum commit encontrado para os critérios informados.
                </div>
              ) : (
                recentCommits.map((c) => (
                  <div
                    key={c.sha}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      commitSha === c.sha || commitSha === c.shortSha
                        ? 'bg-purple-950/40 border-purple-600 shadow-md shadow-purple-950/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-purple-800/60 text-purple-300">
                          {c.shortSha}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {c.message}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Autor: <strong className="text-slate-300">{c.author}</strong></span>
                        <span>•</span>
                        <span>{c.date ? new Date(c.date).toLocaleString() : ''}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCommitSha(c.sha);
                        setShowCommitPicker(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                        commitSha === c.sha || commitSha === c.shortSha
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700'
                      }`}
                    >
                      {commitSha === c.sha || commitSha === c.shortSha ? <Check size={14} /> : null}
                      <span>{commitSha === c.sha || commitSha === c.shortSha ? 'Selecionado' : 'Usar Este Commit'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Total de {recentCommits.length} commits listados.
              </span>
              <button
                type="button"
                onClick={() => setShowCommitPicker(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Principal */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
              <Cpu size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Qore Analytics
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Motor Quantum AI • ISTQB CTFL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Plataforma de Inteligência em QA, Análise de Commits e Automação de Testes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${backendStatus.online ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-red-950/40 border-red-800/60 text-red-300'}`}>
              <Server size={14} />
              <span>{backendStatus.online ? 'C# .NET 10 Online' : 'Backend Offline'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Database size={14} className="text-indigo-400" />
              <span>{backendStatus.db}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Sparkles size={14} className="text-purple-400" />
              <span>{backendStatus.model}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        
        {/* Seletor de Modo (Dual Functionality) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-xl">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'github'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitCommit size={18} />
            <span>🎯 Modo 2: Análise de Commit & Padronização (Git Diff + ISTQB)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold uppercase">Foco Principal</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'prompt'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Play size={18} />
            <span>⚡ Modo 1: Automação E2E com Playwright (Execução no Navegador)</span>
          </button>
        </div>

        {/* ========================================================
            MODO 2: ANÁLISE DE COMMIT & PADRONIZAÇÃO (SEM PLAYWRIGHT)
           ======================================================== */}
        {activeTab === 'github' && (
          <div className="space-y-8">
            {/* Entrada do Modo 2: Apenas Link do Repositório GitHub + Foco */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <GitBranch size={22} className="text-purple-400" />
                  <div>
                    <h2 className="text-base font-bold text-slate-100">
                      Análise de Alteração de Código & Geração de Casos de Teste
                    </h2>
                    <p className="text-xs text-slate-400">
                      A IA consulta a API do GitHub, inspeciona o commit e gera casos de teste padronizados (sem acessar o site nem rodar Playwright).
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-mono">
                  100% Analítico & Documental
                </span>
              </div>

              {/* Input GitHub */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                      <ExternalLink size={14} /> URL do Repositório GitHub
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGithubUrl('https://github.com/Luis9768/AfroKings-BarberShop');
                          setGithubBranch('');
                          setCommitSha('');
                        }}
                        className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                      >
                        AfroKings-BarberShop
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setGithubUrl('https://github.com/octocat/Hello-World');
                          setGithubBranch('');
                          setCommitSha('');
                        }}
                        className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                      >
                        octocat/Hello-World
                      </button>
                    </div>
                  </div>
                  <input 
                    type="text"
                    value={githubUrl}
                    onChange={(e) => handleGithubUrlChange(e.target.value)}
                    placeholder="https://github.com/usuario/repositorio"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-purple-800/60 text-sm text-slate-200 focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                {/* Campo de Token GitHub (PAT) - Sempre visível e destacado */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-800/50 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Key size={14} className={githubToken ? "text-emerald-400" : "text-purple-400"} />
                      <label className="text-xs font-semibold text-slate-200">
                        Token de Acesso GitHub (PAT)
                      </label>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        githubToken 
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60" 
                          : "bg-slate-900 text-slate-400 border border-slate-800"
                      }`}>
                        {githubToken ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Autenticado (Repositórios Privados & 5.000 req/h)
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Obrigatório p/ Repositórios Privados • Opcional p/ Públicos
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {githubToken && (
                        <button
                          type="button"
                          onClick={handleTestToken}
                          disabled={isValidatingToken}
                          className="text-[11px] bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/60 px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {isValidatingToken ? <RefreshCw size={11} className="animate-spin text-purple-300" /> : <Activity size={11} className="text-purple-300" />}
                          <span>{isValidatingToken ? "Testando..." : "Testar Acesso"}</span>
                        </button>
                      )}
                      <a 
                        href="https://github.com/settings/tokens/new?scopes=repo&description=QA-Platform-Agent" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={11} /> Gerar Token Classic ↗
                      </a>
                      {githubToken && (
                        <button
                          type="button"
                          onClick={() => {
                            handleTokenChange('');
                            setTokenTestResult(null);
                          }}
                          className="text-[10px] text-red-400 hover:text-red-300 underline font-medium"
                        >
                          Limpar Token
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <input 
                      type={showTokenVisible ? "text" : "password"}
                      value={githubToken}
                      onChange={(e) => {
                        handleTokenChange(e.target.value);
                        setTokenTestResult(null);
                      }}
                      placeholder="Cole aqui seu token: ghp_... ou github_pat_... (Salvo automaticamente no navegador)"
                      className="w-full pl-9 pr-10 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-purple-400 font-mono placeholder:text-slate-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <Lock size={13} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTokenVisible(!showTokenVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      title={showTokenVisible ? "Ocultar Token" : "Mostrar Token"}
                    >
                      {showTokenVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>

                  {/* Resultado do Teste Diagnóstico do Token */}
                  {tokenTestResult && (
                    <div className={`p-3 rounded-lg border text-xs space-y-1.5 animate-in fade-in ${
                      tokenTestResult.valid && tokenTestResult.repoAccessible
                        ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-200"
                        : tokenTestResult.ssoRequired
                        ? "bg-amber-950/70 border-amber-700/80 text-amber-200"
                        : tokenTestResult.valid
                        ? "bg-amber-950/60 border-amber-800/80 text-amber-200"
                        : "bg-red-950/60 border-red-800/80 text-red-200"
                    }`}>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          {tokenTestResult.valid && tokenTestResult.repoAccessible ? (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                          ) : (
                            <ShieldAlert size={14} className={tokenTestResult.ssoRequired ? "text-amber-400" : "text-rose-400"} />
                          )}
                          {tokenTestResult.valid ? `Conta GitHub: @${tokenTestResult.username} (${tokenTestResult.tokenType})` : "Validação do Token"}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40">
                          {tokenTestResult.repoStatus || (tokenTestResult.valid ? "Token Válido" : "Inválido")}
                        </span>
                      </div>

                      <p className="text-[11px] leading-relaxed">
                        {tokenTestResult.message}
                      </p>

                      {tokenTestResult.recommendation && (
                        <div className="text-[11px] font-medium pt-1.5 border-t border-white/10 flex items-start gap-1 text-white">
                          <span>💡 <strong>Solução:</strong> {tokenTestResult.recommendation}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span>🔒 <strong>Privados & Organizações:</strong> Qualquer membro/colaborador com leitura pode gerar o token (não precisa ser o dono da conta).</span>
                    </div>
                    <span className="text-[10px] text-purple-300/80">Salvo no seu navegador</span>
                  </div>
                </div>

                {/* Grid de 2 Colunas: Branch e Código do Commit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Campo 1: Branch */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <GitBranch size={14} className="text-purple-400" /> Branch / Ramo (Opcional)
                      </label>
                      <button
                        type="button"
                        onClick={handleFetchBranches}
                        disabled={isLoadingBranches || !githubUrl}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                      >
                        {isLoadingBranches ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />}
                        <span>Buscar Branches</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input 
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        placeholder="Ex: main, develop, fix/auth (vazio = padrão)"
                        className="w-full px-3 py-2 pr-8 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                      {githubBranch && (
                        <button
                          type="button"
                          onClick={() => setGithubBranch('')}
                          className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-200"
                          title="Limpar branch"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {availableBranches.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400">Rápido:</span>
                        {availableBranches.slice(0, 4).map(b => (
                          <button
                            key={b.name}
                            type="button"
                            onClick={() => setGithubBranch(b.name)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                              githubBranch === b.name
                                ? 'bg-purple-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {b.name} {b.isDefault && '★'}
                          </button>
                        ))}
                        {availableBranches.length > 4 && (
                          <select
                            value={githubBranch}
                            onChange={(e) => setGithubBranch(e.target.value)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 outline-none"
                          >
                            <option value="">Mais branches ({availableBranches.length})...</option>
                            {availableBranches.map(b => (
                              <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {branchesError && (
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-[10px] text-amber-300 leading-tight">
                        {branchesError.includes('rate limit') || branchesError.includes('excedido')
                          ? 'Limite da API do GitHub atingido. O fallback automático foi ativado no backend.'
                          : branchesError}
                      </div>
                    )}
                  </div>

                  {/* Campo 2: Código do Commit / SHA */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <GitCommit size={14} className="text-purple-400" /> Código do Commit / Hash (Opcional)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleFetchRecentCommits()}
                        disabled={isLoadingCommits || !githubUrl}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                      >
                        {isLoadingCommits ? <RefreshCw size={11} className="animate-spin" /> : <Eye size={11} />}
                        <span>Ver Commits Recentes</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input 
                        type="text"
                        value={commitSha}
                        onChange={(e) => setCommitSha(e.target.value)}
                        placeholder="Ex: a1b2c3d ou SHA completo (vazio = último)"
                        className="w-full px-3 py-2 pr-8 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                      {commitSha && (
                        <button
                          type="button"
                          onClick={() => setCommitSha('')}
                          className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-200"
                          title="Limpar commit"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Cole o código de qualquer commit para criar casos de teste a partir dessa alteração específica.
                    </p>

                    {commitsError && (
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-[10px] text-amber-300 leading-tight">
                        {commitsError.includes('rate limit') || commitsError.includes('excedido')
                          ? 'Limite da API atingido. O fallback automático para feeds públicos foi ativado!'
                          : commitsError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Informativo do Escopo */}
                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-purple-400 font-bold">🎯 Escopo Definido:</span>
                    <span className="text-slate-300">
                      {commitSha ? (
                        <>Analisar commit <strong className="text-purple-300 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/50">{commitSha.slice(0, 10)}</strong> {githubBranch ? <>na branch <strong className="text-slate-200">{githubBranch}</strong></> : ''}</>
                      ) : githubBranch ? (
                        <>Último commit da branch <strong className="text-purple-300 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/50">{githubBranch}</strong></>
                      ) : (
                        <>Último commit da <strong className="text-purple-300">branch principal (default)</strong></>
                      )}
                    </span>
                  </div>
                  {(githubBranch || commitSha) && (
                    <button
                      type="button"
                      onClick={() => { setGithubBranch(''); setCommitSha(''); }}
                      className="text-[11px] text-slate-400 hover:text-purple-300 underline font-medium self-end sm:self-auto"
                    >
                      Restaurar para Último Commit Padrão
                    </button>
                  )}
                </div>
              </div>

              {/* Foco ou Instruções Adicionais */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Diretrizes ou Foco Específico para a Análise de Testes (Opcional)
                </label>
                <textarea 
                  rows={2}
                  value={githubPrompt}
                  onChange={(e) => setGithubPrompt(e.target.value)}
                  placeholder="Ex: Focar na validação das regras de negócio de cancelamento, campos obrigatórios e casos negativos..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              {/* Botão de Ação */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Gera Matriz de Riscos, Análise de Impacto e Especificação Formal ISTQB.
                </span>

                <button
                  onClick={handleGeneratePlan}
                  disabled={isPlanning}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
                >
                  {isPlanning ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Analisando Commit & Gerando Casos...</span>
                    </>
                  ) : (
                    <>
                      <GitCommit size={16} />
                      <span>Analisar Commit & Gerar Casos de Teste</span>
                    </>
                  )}
                </button>
              </div>

              {planError && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{planError}</span>
                </div>
              )}
            </div>

            {/* PAINEL DE ANÁLISE DE TESTES (TEST ANALYSIS) */}
            {planResult && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-800/50 shadow-2xl space-y-6 animate-in fade-in">
                {/* Header do Commit */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
                      <Activity size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 uppercase">
                          Relatório de Análise Técnica
                        </span>
                        <h3 className="text-base font-bold text-slate-100">
                          {planResult.titulo || 'Análise de Testes & Impacto de Código'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {planResult.resumo || 'Avaliação estruturada de impacto e riscos segundo normas de QA.'}
                      </p>
                    </div>
                  </div>

                  {planResult.commit?.htmlUrl && (
                    <a 
                      href={planResult.commit.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 transition-colors self-start sm:self-auto"
                    >
                      <ExternalLink size={14} /> Commit {planResult.commit.shortSha} no GitHub
                    </a>
                  )}
                </div>

                {/* Card do Commit */}
                {planResult.commit && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <GitCommit size={16} className="text-purple-400 shrink-0" />
                      <span className="text-slate-300 font-semibold">{planResult.commit.message}</span>
                      {(planResult.commit.branch || githubBranch) && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/70 text-purple-300 font-mono text-[10px] flex items-center gap-1 shrink-0">
                          <GitBranch size={10} /> {planResult.commit.branch || githubBranch}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[10px] shrink-0">
                        {planResult.commit.shortSha}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 shrink-0">
                      <span>Autor: <strong className="text-slate-300">{planResult.commit.author}</strong></span>
                      <span>{planResult.commit.date ? new Date(planResult.commit.date).toLocaleDateString() : 'Recente'}</span>
                    </div>
                  </div>
                )}

                {/* Grid da Análise Técnica: Impacto + Matriz de Riscos */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Resumo de Impacto */}
                  <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                      <FileCode size={16} />
                      <h4>Análise de Impacto Técnico & Camadas Afetadas</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {planResult.analiseImpacto || planResult.analise?.analiseImpacto || "A IA mapeou os arquivos alterados no commit e identificou as camadas de interface e negócio impactadas."}
                    </p>

                    {/* Camadas Afetadas */}
                    {planResult.analise?.camadasAfetadas && (
                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400">Camadas Afetadas:</span>
                        {planResult.analise.camadasAfetadas.map((camada, idx) => (
                          <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
                            {camada}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Matriz de Riscos de Regressão */}
                  <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950/70 border border-amber-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                        <ShieldAlert size={16} />
                        <h4>Matriz de Riscos & Pontos Cegos (ISTQB)</h4>
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-mono">Risk-Based Testing</span>
                    </div>

                    {Array.isArray(planResult.matrizRisco) && planResult.matrizRisco.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {planResult.matrizRisco.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200">{item.risco}</span>
                              <div className="flex items-center gap-1.5">
                                {item.probabilidade && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                    Prob: {item.probabilidade}
                                  </span>
                                )}
                                {item.impacto && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Impacto: {item.impacto}
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.mitigacao && (
                              <p className="text-[11px] text-slate-400">
                                <strong>Mitigação:</strong> {item.mitigacao}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {typeof planResult.matrizRisco === 'string' 
                          ? planResult.matrizRisco 
                          : "Riscos identificados para orientar a cobertura de testes."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Métricas de Cobertura */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sliders size={14} className="text-purple-400" /> Distribuição da Cobertura de Testes:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-300 text-[11px] font-medium">
                        Funcional: {coverageStats.funcional}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] font-medium">
                        Regressão: {coverageStats.regressao}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] font-medium">
                        Negativo: {coverageStats.negativo}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[11px] font-medium">
                        Borda: {coverageStats.borda}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-[11px] font-medium">
                        Crítica: {coverageStats.critica}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arquivos Modificados (Accordion) */}
                {planResult.commit?.files && planResult.commit.files.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFilesList(!showFilesList)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-medium transition-colors"
                    >
                      {showFilesList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{planResult.commit.files.length} arquivos analisados no diff de código</span>
                    </button>

                    {showFilesList && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                        {planResult.commit.files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300 py-1 px-2 rounded hover:bg-slate-900">
                            <span className="truncate max-w-md">{file.filename}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-emerald-400 font-semibold">+{file.additions}</span>
                              <span className="text-rose-400 font-semibold">-{file.deletions}</span>
                              <span className="text-slate-500 uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-800">{file.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MATRIZ DE RASTREABILIDADE DE REQUISITOS (RTM - ISO/IEC/IEEE 29119) */}
            {planResult && getRtmList().length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-900/50 shadow-2xl space-y-6 animate-in slide-in-from-bottom-2">
                {/* Header da RTM */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300">
                      <Table size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 uppercase">
                          ISO/IEC/IEEE 29119
                        </span>
                        <h3 className="text-base font-bold text-slate-100">
                          Matriz de Rastreabilidade de Requisitos (RTM)
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300">
                          Mapeamento Bidirecional
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Conecta Requisitos de Negócio ↔ Commits & Arquivos do Git ↔ Casos de Teste Padronizados.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadRtmCsv}
                      className="px-4 py-2 rounded-xl bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-700/25 border border-emerald-600/60"
                    >
                      <FileSpreadsheet size={16} />
                      <span>Exportar RTM (.csv)</span>
                    </button>
                  </div>
                </div>

                {/* Métricas Principais da RTM */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Requisitos Mapeados</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{getRtmList().length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Taxa de Cobertura</span>
                    <span className="text-xl font-bold font-mono text-purple-400">100% Coberto</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Casos Vinculados</span>
                    <span className="text-xl font-bold font-mono text-indigo-400">{editableSteps.length} TCs</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Módulos Auditados</span>
                    <span className="text-xl font-bold font-mono text-sky-400">
                      {[...new Set(getRtmList().map(r => r.modulo || 'Geral'))].length}
                    </span>
                  </div>
                </div>

                {/* Tabela Interativa da RTM */}
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-semibold text-[11px]">
                        <th className="p-3 whitespace-nowrap">ID Requisito</th>
                        <th className="p-3 whitespace-nowrap">Módulo & Categoria</th>
                        <th className="p-3 min-w-[240px]">Requisito / Especificação Funcional</th>
                        <th className="p-3 min-w-[180px]">Arquivos Afetados (Git Diff)</th>
                        <th className="p-3 min-w-[140px]">Casos de Teste</th>
                        <th className="p-3 whitespace-nowrap">Cobertura</th>
                        <th className="p-3 whitespace-nowrap">Prioridade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {getRtmList().map((item, idx) => (
                        <tr key={item.idRequisito || idx} className="hover:bg-slate-900/50 transition-colors">
                          {/* ID Requisito */}
                          <td className="p-3 whitespace-nowrap font-mono font-bold text-purple-400">
                            <span className="px-2 py-1 rounded-md bg-purple-950/70 border border-purple-800/80">
                              {item.idRequisito || `REQ-${String(idx + 1).padStart(2, '0')}`}
                            </span>
                          </td>

                          {/* Módulo & Categoria */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-slate-200">
                                {item.modulo || 'Módulo Geral'}
                              </span>
                              <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 self-start">
                                {item.categoria || 'Funcional'}
                              </span>
                            </div>
                          </td>

                          {/* Título e Justificativa */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-100 block">
                                {item.titulo}
                              </span>
                              {item.justificativa && (
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {item.justificativa}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Arquivos Afetados */}
                          <td className="p-3">
                            <div className="flex flex-col gap-1 max-w-xs">
                              {Array.isArray(item.arquivosAfetados) && item.arquivosAfetados.length > 0 ? (
                                item.arquivosAfetados.map((arq, aIdx) => (
                                  <span key={aIdx} className="font-mono text-[10px] text-indigo-300 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-800/40 truncate" title={arq}>
                                    {arq}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {item.arquivosAfetados || 'Commit diff'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Casos de Teste Vinculados */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {Array.isArray(item.casosTesteIds) && item.casosTesteIds.length > 0 ? (
                                item.casosTesteIds.map((tc, tcIdx) => (
                                  <span key={tcIdx} className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700/80">
                                    {tc}
                                  </span>
                                ))
                              ) : (
                                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700/80">
                                  {item.casosTesteIds || 'TC-01'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cobertura */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md bg-emerald-950/70 border border-emerald-800/80 text-emerald-300">
                              <CheckCheck size={13} className="text-emerald-400" />
                              <span>{item.statusCobertura || '100% Coberto'}</span>
                            </span>
                          </td>

                          {/* Prioridade */}
                          <td className="p-3 whitespace-nowrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityColor(item.prioridade)}`}>
                              {item.prioridade || 'Alta'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2 pt-1 border-t border-slate-800/70">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-emerald-400" />
                    <span>Rastreabilidade em total conformidade com os critérios de aceite e governança de software.</span>
                  </span>
                  <span className="text-slate-500 font-mono">ISO/IEC/IEEE 29119-3</span>
                </div>
              </div>
            )}

            {/* SUÍTE DE CASOS DE TESTE PADRONIZADOS (TEST STANDARDIZATION) */}
            {renderTestSuite('github')}
          </div>
        )}

        {/* ========================================================
            MODO 1: AUTOMAÇÃO E2E COM PLAYWRIGHT (PROMPT LIVRE)
           ======================================================== */}
        {activeTab === 'prompt' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Play size={20} className="text-purple-400" />
                    <div>
                      <h2 className="text-base font-semibold text-slate-100">
                        Automação de Testes E2E com Playwright & Vídeo
                      </h2>
                      <p className="text-xs text-slate-400">
                        O agente executa ações reais no navegador Chromium, gravando vídeo e capturando evidências.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inputs de URLs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Aplicação Web Alvo (URL Base)
                    </label>
                    <input 
                      type="text"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://sua-aplicacao.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Swagger / OpenAPI (Contexto Opcional)
                    </label>
                    <input 
                      type="text"
                      value={swaggerUrl}
                      onChange={(e) => setSwaggerUrl(e.target.value)}
                      placeholder="https://api.com/swagger/v1/swagger.json"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Prompt do Usuário */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Objetivo do Teste / Prompt do Usuário
                    </label>
                    <button
                      type="button"
                      onClick={() => setUserPrompt('Tente login com 2 credenciais inválidas. Depois faça login com lebron@email.com / afrokings. Tente agendar para ontem e depois para amanhã.')}
                      className="text-[11px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:bg-purple-900/60 transition-colors"
                    >
                      🛡️ Cenário AfroKings
                    </button>
                  </div>
                  <textarea 
                    rows={4}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Descreva o fluxo que o robô Playwright deve executar..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono text-xs"
                  />
                </div>

                {/* Botões de Ação */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={headless}
                      onChange={(e) => setHeadless(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span>Modo Headless (mais rápido no servidor)</span>
                  </label>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleGeneratePlan}
                      disabled={isPlanning || isExecuting}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
                    >
                      {isPlanning ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      <span>{isPlanning ? 'Planejando...' : 'Planejar Casos'}</span>
                    </button>

                    <button
                      onClick={handleGenerateAndExecute}
                      disabled={isPlanning || isExecuting}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      {isPlanning ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Planejando Casos...</span>
                        </>
                      ) : isExecuting ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Executando Playwright...</span>
                        </>
                      ) : (
                        <>
                          <Play size={15} className="fill-white" />
                          <span>Gerar & Executar no Playwright</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {planError && (
                  <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{planError}</span>
                  </div>
                )}

                {executionError && (
                  <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{executionError}</span>
                  </div>
                )}
              </div>

              {/* Histórico Recente de Execuções */}
              <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <History size={16} className="text-indigo-400" /> Histórico E2E
                    </h3>
                    <button 
                      onClick={fetchHistory} 
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                    {executionHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Nenhuma execução registrada.</p>
                    ) : (
                      executionHistory.slice(0, 6).map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => setExecution(item)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            execution?.id === item.id 
                              ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md' 
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold font-mono text-[11px]">Execução #{item.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              item.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              item.status === 'Failed' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{item.prompt || 'Execução E2E'}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                            <span>{item.passedSteps}/{item.totalSteps} casos</span>
                            <span>{new Date(item.startedAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Evidências locais persistidas</span>
                  <span className="text-emerald-400 font-mono">Playwright 100% Real</span>
                </div>
              </div>
            </div>

            {/* SUÍTE DE CASOS DE TESTE E2E (MODO 1) */}
            {renderTestSuite('prompt')}

            {/* PAINEL DE RESULTADOS DA EXECUÇÃO ATIVA PLAYWRIGHT */}
            {execution && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in slide-in-from-bottom-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-bold">
                        Execução #{execution.id}
                      </span>
                      <h3 className="text-base font-bold text-slate-100">
                        {execution.prompt || 'Automação Playwright'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Iniciado em {new Date(execution.startedAt).toLocaleString()} ({execution.targetUrl})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      execution.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      execution.status === 'Failed' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}>
                      {execution.status}
                    </span>
                  </div>
                </div>

                {/* Métricas Principais */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Total de Casos</span>
                    <span className="text-xl font-bold font-mono text-slate-100">{execution.totalSteps || 0}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Casos Aprovados</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{execution.passedSteps || 0}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Casos com Falha</span>
                    <span className="text-xl font-bold font-mono text-rose-400">{execution.failedSteps || 0}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Taxa de Conformidade</span>
                    <span className="text-xl font-bold font-mono text-purple-400">
                      {execution.totalSteps > 0 ? Math.round((execution.passedSteps / execution.totalSteps) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Linha do Tempo e Prints */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-purple-400" /> Casos Executados no Navegador
                  </h4>

                  <div className="space-y-3">
                    {(execution.steps || []).map((s) => (
                      <div 
                        key={s.id || s.stepNumber}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-purple-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {s.codigo || `TC-${String(s.stepNumber).padStart(2, '0')}`}
                            </span>
                            {s.tipo && (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${getBadgeTypeColor(s.tipo)}`}>
                                {s.tipo}
                              </span>
                            )}
                            <h5 className="text-sm font-semibold text-slate-100">{s.stepTitle}</h5>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              s.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300' :
                              s.status === 'Failed' ? 'bg-red-500/20 text-red-300' :
                              s.status === 'Running' ? 'bg-purple-500/20 text-purple-300 animate-pulse' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {s.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed">{s.descricao || s.action}</p>

                          {s.resultadoEsperado && (
                            <p className="text-[11px] text-emerald-400/90 font-medium">
                              <strong>Assert:</strong> {s.resultadoEsperado}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                            {s.durationMs > 0 && <span>⏱ {(s.durationMs / 1000).toFixed(1)}s</span>}
                            {s.actionsCount > 0 && <span>⚡ {s.actionsCount} ações na UI</span>}
                            {s.errorDetails && <span className="text-rose-400 font-semibold">{s.errorDetails}</span>}
                          </div>
                        </div>

                        {/* Thumbnail do Screenshot */}
                        {s.screenshotUrl && (
                          <div 
                            onClick={() => setSelectedImage(`${BACKEND_HOST}${s.screenshotUrl}`)}
                            className="w-36 h-20 rounded-lg overflow-hidden border border-slate-800 hover:border-purple-500 cursor-pointer transition-all bg-slate-900 shrink-0 relative group"
                          >
                            <img 
                              src={`${BACKEND_HOST}${s.screenshotUrl}`} 
                              alt={`Print passo ${s.stepNumber}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vídeo e Terminal */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800">
                  <div className="lg:col-span-6 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Video size={14} className="text-purple-400" /> Vídeo da Sessão Gravada (.webm)
                    </h4>
                    {execution.videoUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video relative flex items-center justify-center">
                        <video 
                          key={execution.videoUrl}
                          controls 
                          autoPlay 
                          muted 
                          className="w-full h-full object-contain"
                        >
                          <source src={`${BACKEND_HOST}${execution.videoUrl}`} type="video/webm" />
                          Seu navegador não suporta a tag de vídeo.
                        </video>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 aspect-video flex flex-col items-center justify-center text-slate-500 text-xs">
                        <Video size={32} className="mb-2 text-slate-600" />
                        <span>{execution.status === 'Running' ? 'Gravando vídeo no Chromium...' : 'Nenhum vídeo disponível'}</span>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-6 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Terminal size={14} className="text-indigo-400" /> Logs de Execução em Tempo Real
                    </h4>
                    <div 
                      ref={logTerminalRef}
                      className="rounded-xl p-4 bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner"
                    >
                      {execution.logs || 'Aguardando logs...'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-500">
        QA Autonomous Copilot • TCC Engenharia de Software • Desenvolvido com C# .NET 10, Next.js, Playwright e Gemini 3.5 Flash-Lite
      </footer>
    </div>
  );
}
