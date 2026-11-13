import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Sparkles,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  Layers,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Server,
  Cpu,
  Terminal,
  Eye,
  X,
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
  Copy,
  Download,
  FileText,
  CheckCheck,
  Activity,
  ListChecks,
  Sliders,
  Bot,
  Search,
  Key,
  EyeOff,
  Lock,
  Table,
  FileSpreadsheet,
  User,
  Users,
  Shield,
  Building,
  CheckSquare,
  Globe,
  Laptop,
  ArrowRight,
  Radio,
  FolderKanban,
  Rocket,
  Plug,
  Wifi,
  WifiOff,
  Edit3,
  Award,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/qa';
const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST || '';

export default function Home() {
  // Navegação Principal (4 Workspaces Intuitivos)
  const [activeWorkspace, setActiveWorkspace] = useState('projects'); // 'projects' | 'github' | 'prompt' | 'governance'

  // Projetos & Shift-Left (Túnel Local)
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectFormMode, setProjectFormMode] = useState('create'); // 'create' | 'edit'
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projName, setProjName] = useState('');
  const [projTargetUrl, setProjTargetUrl] = useState('');
  const [projSwaggerUrl, setProjSwaggerUrl] = useState('');
  const [projGithubUrl, setProjGithubUrl] = useState('');
  const [projEnvType, setProjEnvType] = useState('Cloud / Produção');
  const [projUserIds, setProjUserIds] = useState([1]);
  const [projectError, setProjectError] = useState(null);
  const [projectSuccess, setProjectSuccess] = useState(null);
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Conector de Túnel Reverso (Shift-Left Bridge)
  const [localPort, setLocalPort] = useState('3000');
  const [tunnelProvider, setTunnelProvider] = useState('localtunnel'); // 'localtunnel' | 'ngrok' | 'cloudflared'
  const [tunnelUrlInput, setTunnelUrlInput] = useState('https://meu-app-teste.loca.lt');
  const [copiedTunnelCmd, setCopiedTunnelCmd] = useState(false);
  const [isCheckingTarget, setIsCheckingTarget] = useState(false);
  const [targetCheckResult, setTargetCheckResult] = useState(null);

  // Modo 2: Análise de Commit & Padronização (Git Diff + ISTQB + RTM)
  const [githubUrl, setGithubUrl] = useState('https://github.com/LuisSantos09/TCC_Senai_Front');
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
  const [githubPrompt, setGithubPrompt] = useState('Focar em testes para novas alterações, fluxos críticos e validação de regras de negócio.');

  // Modo 1: Automação E2E Playwright
  const [targetUrl, setTargetUrl] = useState('https://tcc-senai-front-2.vercel.app/');
  const [swaggerUrl, setSwaggerUrl] = useState('https://afrokings.azurewebsites.net/swagger/v1/swagger.json');
  const [userPrompt, setUserPrompt] = useState('Tente login com 2 credenciais inválidas. Depois faça login com lebron@email.com / afrokings. Tente agendar para ontem e depois para amanhã.');
  const [headless, setHeadless] = useState(true);

  // Estados de Planejamento e Análise de Testes
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: false, db: 'Verificando...', model: 'Quantum AI', playwright: null });
  const [liveFrameUrl, setLiveFrameUrl] = useState(null);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const executionPanelRef = useRef(null);
  const videoRef = useRef(null);

  const [planResult, setPlanResult] = useState(null);
  const [editableSteps, setEditableSteps] = useState([]);
  const [planError, setPlanError] = useState(null);
  const [showFilesList, setShowFilesList] = useState(false);

  // Modais de Exportação e Prompt para IA
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false);
  const [aiPromptFormat, setAiPromptFormat] = useState('detailed');

  // Controle de Acesso (RBAC: 1 único perfil obrigatório por usuário)
  const [users, setUsers] = useState([
    { id: 1, name: 'Luis Santos', email: 'luis.qa@qoreanalytics.com', role: 'QA', perfilId: 2, companyName: 'AfroKings Tech' },
    { id: 2, name: 'Carlos Silva', email: 'carlos.dev@afrokings.com', role: 'Dev', perfilId: 1, companyName: 'AfroKings Tech' },
    { id: 3, name: 'Mariana Costa', email: 'mariana.admin@qoreanalytics.com', role: 'Admin', perfilId: 3, companyName: 'Qore Analytics Global' },
    { id: 4, name: 'Lucas Barber', email: 'lucas.dev@studiobarber.com', role: 'Dev', perfilId: 1, companyName: 'Studio Barber Ltda' }
  ]);
  const [currentUser, setCurrentUser] = useState({ id: 1, name: 'Luis Santos', email: 'luis.qa@qoreanalytics.com', role: 'QA', perfilId: 2, companyName: 'AfroKings Tech' });
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Dev');
  const [newUserCompany, setNewUserCompany] = useState('AfroKings Tech');
  const [userCreateError, setUserCreateError] = useState(null);

  // Assinatura Digital do Teste (QA Sign-off)
  const [testSignature, setTestSignature] = useState(null);
  const [signatureDecision, setSignatureDecision] = useState('Aprovado para Teste Manual');
  const [signatureNotes, setSignatureNotes] = useState('100% dos requisitos cobertos com rastreabilidade formal RTM ISO/IEC/IEEE 29119 e testes de regressão aprovados.');
  const [isSigning, setIsSigning] = useState(false);

  // Estados de Execução E2E (Playwright)
  const [execution, setExecution] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [executionError, setExecutionError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const logTerminalRef = useRef(null);

  // Carregar Projetos, Usuários e Histórico
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !activeProject) {
          selectProject(data[0], false);
        }
      }
    } catch (e) {}
    finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      }
    } catch (e) {}
  };

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
            setBackendStatus({
              online: true,
              db: data.database,
              model: 'Quantum AI',
              playwright: data.playwright || null
            });
          }
        } else {
          if (isMounted) setBackendStatus({ online: false, db: 'Backend offline', model: '-', playwright: null });
        }
      } catch (err) {
        if (isMounted) setBackendStatus({ online: false, db: 'Desconectado', model: '-', playwright: null });
      }
    }

    checkHealth();
    fetchProjects();
    fetchUsers();
    try {
      const savedToken = localStorage.getItem('qa_github_token');
      if (savedToken && isMounted) setGithubToken(savedToken);
    } catch (e) {}

    fetchHistory().then(list => {
      if (isMounted && list && list.length > 0 && !execution) {
        setExecution(list[0]);
      }
    });

    const interval = setInterval(checkHealth, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [execution?.logs]);

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
          if (data.status === 'Passed' || data.status === 'Failed' || data.status === 'PassedWithWarnings') {
            setIsExecuting(false);
            fetchHistory();
            clearInterval(interval);
          }
        }
      } catch (err) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [execution?.id, execution?.status]);

  useEffect(() => {
    if (!execution?.id || (execution.status !== 'Running' && execution.status !== 'Pending')) {
      setLiveFrameUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    let tick = 0;

    const pullFrame = async () => {
      try {
        const res = await fetch(`${API_BASE}/executions/${execution.id}/live?t=${Date.now()}_${tick++}`, {
          cache: 'no-store'
        });
        if (!cancelled && res.status === 200) {
          const blob = await res.blob();
          if (!cancelled && blob.size > 0) {
            const objUrl = URL.createObjectURL(blob);
            setLiveFrameUrl(prev => {
              if (prev) URL.revokeObjectURL(prev);
              return objUrl;
            });
          }
        }
      } catch (err) {}
    };

    pullFrame();
    const timer = setInterval(pullFrame, 800);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [execution?.id, execution?.status]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = videoSpeed;
    }
  }, [videoSpeed, execution?.videoUrl]);

  // Selecionar Projeto Ativo e Sincronizar URLs
  const selectProject = (proj, switchTab = false) => {
    setActiveProject(proj);
    if (proj.targetUrl) setTargetUrl(proj.targetUrl);
    if (proj.swaggerUrl !== undefined) setSwaggerUrl(proj.swaggerUrl || '');
    if (proj.githubUrl) setGithubUrl(proj.githubUrl);
    if (switchTab) setActiveWorkspace('prompt');
  };

  // Gerenciamento de Projetos (CRUD + Validações DDD)
  const resetProjectForm = () => {
    setProjectFormMode('create');
    setEditingProjectId(null);
    setProjName('');
    setProjTargetUrl('');
    setProjSwaggerUrl('');
    setProjGithubUrl('');
    setProjEnvType('Cloud / Produção');
    setProjUserIds(currentUser ? [currentUser.id] : [1]);
    setProjectError(null);
  };

  const handleEditProjectClick = (proj) => {
    setProjectFormMode('edit');
    setEditingProjectId(proj.id);
    setProjName(proj.name || '');
    setProjTargetUrl(proj.targetUrl || '');
    setProjSwaggerUrl(proj.swaggerUrl || '');
    setProjGithubUrl(proj.githubUrl || '');
    setProjEnvType(proj.environmentType || 'Cloud / Produção');
    setProjUserIds(Array.isArray(proj.userIds) && proj.userIds.length > 0 ? proj.userIds : [1]);
    setProjectError(null);
    setProjectSuccess(null);
  };

  const toggleProjectUser = (userId) => {
    setProjUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setProjectError(null);
    setProjectSuccess(null);

    if (!projName.trim() || projName.trim().length < 2) {
      setProjectError('O nome do projeto deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!projTargetUrl.trim()) {
      setProjectError('A URL Alvo do projeto é obrigatória.');
      return;
    }
    if (projUserIds.length === 0) {
      setProjectError('Regra de Domínio: Todo projeto precisa estar vinculado a pelo menos 1 usuário.');
      return;
    }

    setIsSavingProject(true);
    try {
      const isEdit = projectFormMode === 'edit' && editingProjectId;
      const endpoint = isEdit ? `${API_BASE}/projects/${editingProjectId}` : `${API_BASE}/projects`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projName.trim(),
          targetUrl: projTargetUrl.trim(),
          swaggerUrl: projSwaggerUrl.trim() || null,
          githubUrl: projGithubUrl.trim() || null,
          environmentType: projEnvType,
          userIds: projUserIds
        })
      });

      const data = await res.json();
      if (res.ok) {
        await fetchProjects();
        selectProject(data, false);
        setProjectSuccess(isEdit ? `Projeto "${data.name}" atualizado com sucesso!` : `Projeto "${data.name}" cadastrado e selecionado!`);
        resetProjectForm();
      } else {
        setProjectError(data?.error || 'Erro ao salvar projeto.');
      }
    } catch (err) {
      setProjectError(`Falha de conexão: ${err.message}`);
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async (projId) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = projects.filter(p => p.id !== projId);
        setProjects(updated);
        if (activeProject?.id === projId) {
          setActiveProject(updated[0] || null);
        }
      }
    } catch (e) {}
  };

  // Shift-Left Tunnel Bridge Helpers
  const getTunnelCommand = () => {
    const port = localPort.trim() || '3000';
    if (tunnelProvider === 'ngrok') return `ngrok http ${port}`;
    if (tunnelProvider === 'cloudflared') return `cloudflared tunnel --url http://localhost:${port}`;
    return `npx localtunnel --port ${port}`;
  };

  const handleCopyTunnelCommand = () => {
    navigator.clipboard.writeText(getTunnelCommand());
    setCopiedTunnelCmd(true);
    setTimeout(() => setCopiedTunnelCmd(false), 2200);
  };

  const handleCheckTargetConnectivity = async (urlToProbe) => {
    const target = (urlToProbe || tunnelUrlInput || '').trim();
    if (!target) return;
    setIsCheckingTarget(true);
    setTargetCheckResult(null);
    try {
      const res = await fetch(`${API_BASE}/check-target?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (res.ok) {
        setTargetCheckResult(data);
      } else {
        setTargetCheckResult({
          reachable: false,
          url: target,
          message: data?.error || 'Falha ao validar URL.'
        });
      }
    } catch (err) {
      setTargetCheckResult({
        reachable: false,
        url: target,
        message: `Erro ao consultar sonda de rede: ${err.message}`
      });
    } finally {
      setIsCheckingTarget(false);
    }
  };

  const handleApplyTunnelUrlAndTest = () => {
    const clean = tunnelUrlInput.trim();
    if (!clean) return;
    setTargetUrl(clean);
    setProjTargetUrl(clean);
    setProjEnvType('Túnel Local (Shift-Left)');
    setActiveWorkspace('prompt');
  };

  // Handlers GitHub
  const handleGithubUrlChange = (val) => {
    setGithubUrl(val);
    setBranchesError(null);
    setCommitsError(null);
    const commitMatch = val.match(/\/commit\/([a-fA-F0-9]{7,40})/);
    if (commitMatch && commitMatch[1]) setCommitSha(commitMatch[1]);
    const treeMatch = val.match(/\/tree\/([^\/\?#]+)/);
    if (treeMatch && treeMatch[1]) setGithubBranch(treeMatch[1]);
  };

  const handleTokenChange = (val) => {
    setGithubToken(val);
    try {
      if (val && val.trim()) localStorage.setItem('qa_github_token', val.trim());
      else localStorage.removeItem('qa_github_token');
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
        setTokenTestResult(await res.json());
      } else {
        setTokenTestResult({ valid: false, message: `Erro ao testar token (HTTP ${res.status}).` });
      }
    } catch (e) {
      setTokenTestResult({ valid: false, message: 'Falha ao conectar com o backend para validar token.' });
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
        if (!data || data.length === 0) setBranchesError('Nenhuma branch encontrada.');
      } else {
        const err = await res.json().catch(() => ({}));
        setBranchesError(err.error || `Erro HTTP ${res.status} ao buscar branches.`);
      }
    } catch (e) {
      setBranchesError('Falha ao conectar com o backend.');
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
        setRecentCommits(await res.json());
        setShowCommitPicker(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setCommitsError(err.error || `Erro HTTP ${res.status} ao carregar commits.`);
      }
    } catch (e) {
      setCommitsError('Falha ao conectar com o backend.');
    } finally {
      setIsLoadingCommits(false);
    }
  };

  // Gerar Plano (GitHub ou E2E Prompt)
  const handleGeneratePlan = async (modeOverride = null) => {
    const mode = modeOverride || (activeWorkspace === 'github' ? 'github' : 'prompt');
    if (mode === 'prompt' && (!targetUrl || !targetUrl.trim())) {
      setPlanError('Informe a URL da aplicação web alvo (ou use o Conector de Túnel Local).');
      return;
    }
    if (mode === 'github' && (!githubUrl || !githubUrl.trim())) {
      setPlanError('Informe o link do repositório no GitHub.');
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
      targetUrl: mode === 'github' ? (targetUrl || 'github') : targetUrl.trim(),
      swaggerUrl: mode === 'github' ? null : (swaggerUrl?.trim() || null),
      prompt: mode === 'github' ? githubPrompt : userPrompt,
      mode,
      githubUrl: mode === 'github' ? githubUrl.trim() : null,
      githubBranch: mode === 'github' ? (githubBranch?.trim() || null) : null,
      commitSha: mode === 'github' ? (commitSha?.trim() || null) : null,
      githubToken: mode === 'github' ? (githubToken?.trim() || null) : null
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
        const steps = (data.passos || []).map((p, idx) => {
          const rawList = Array.isArray(p.criteriosMinimos) && p.criteriosMinimos.length > 0
            ? p.criteriosMinimos
            : (p.criterioMinimoDescricao ? [p.criterioMinimoDescricao] : [p.resultadoEsperado || 'Critério essencial para aprovação e homologação']);
          return {
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
            resultadoEsperado: p.resultadoEsperado || 'Interface atualizada em conformidade',
            criterioMinimo: p.criterioMinimo !== false,
            criterioMinimoDescricao: rawList.join('; '),
            criteriosMinimos: rawList
          };
        });
        setEditableSteps(steps);
      } else {
        setPlanError(data?.error || `Falha HTTP ${res.status} ao analisar e gerar plano.`);
      }
    } catch (err) {
      setPlanError(`Falha de conexão com o backend em ${API_BASE}.`);
    } finally {
      setIsPlanning(false);
    }
  };

  // CRUD dos Passos da Suíte
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
        resultadoEsperado: 'Comportamento esperado e critérios de aceitação verificáveis',
        criterioMinimo: true,
        criterioMinimoDescricao: 'Critério essencial para homologação da funcionalidade',
        criteriosMinimos: ['Critério essencial para homologação da funcionalidade']
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

  const handleAddCriterionToStep = (stepIndex) => {
    setEditableSteps(prev => {
      const copy = [...prev];
      const step = { ...copy[stepIndex] };
      const current = Array.isArray(step.criteriosMinimos) && step.criteriosMinimos.length > 0
        ? [...step.criteriosMinimos]
        : (step.criterioMinimoDescricao ? [step.criterioMinimoDescricao] : ['Critério essencial para homologação']);
      current.push(`Novo critério mínimo #${current.length + 1} para aprovação`);
      step.criteriosMinimos = current;
      step.criterioMinimoDescricao = current.join('; ');
      copy[stepIndex] = step;
      return copy;
    });
  };

  const handleUpdateStepCriterion = (stepIndex, critIndex, value) => {
    setEditableSteps(prev => {
      const copy = [...prev];
      const step = { ...copy[stepIndex] };
      const current = Array.isArray(step.criteriosMinimos) && step.criteriosMinimos.length > 0
        ? [...step.criteriosMinimos]
        : (step.criterioMinimoDescricao ? [step.criterioMinimoDescricao] : ['']);
      current[critIndex] = value;
      step.criteriosMinimos = current;
      step.criterioMinimoDescricao = current.filter(Boolean).join('; ');
      copy[stepIndex] = step;
      return copy;
    });
  };

  const handleRemoveStepCriterion = (stepIndex, critIndex) => {
    setEditableSteps(prev => {
      const copy = [...prev];
      const step = { ...copy[stepIndex] };
      const current = Array.isArray(step.criteriosMinimos) ? [...step.criteriosMinimos] : [];
      const updated = current.filter((_, idx) => idx !== critIndex);
      step.criteriosMinimos = updated.length > 0 ? updated : ['Critério essencial para homologação'];
      step.criterioMinimoDescricao = step.criteriosMinimos.join('; ');
      copy[stepIndex] = step;
      return copy;
    });
  };

  // Executar Playwright
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
          headless,
          steps: editableSteps
        })
      });

      const data = await res.json();
      if (res.ok && data.executionId) {
        setLiveFrameUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setExecution({
          id: data.executionId,
          status: 'Running',
          targetUrl: targetUrl.trim(),
          prompt: planResult?.titulo || userPrompt,
          startedAt: new Date().toISOString(),
          totalSteps: editableSteps.length,
          totalCriteriosMinimos: editableSteps.filter(s => s.criterioMinimo !== false).length,
          passedCriteriosMinimos: 0,
          failedCriteriosMinimos: 0,
          criteriosMinimosAtingidos: false,
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
            criterioMinimo: p.criterioMinimo !== false,
            criterioMinimoDescricao: p.criterioMinimoDescricao || p.resultadoEsperado,
            criteriosMinimos: p.criteriosMinimos || (p.criterioMinimoDescricao ? [p.criterioMinimoDescricao] : []),
            status: idx === 0 ? 'Running' : 'Pending'
          }))
        });
        setTimeout(() => executionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      } else {
        setIsExecuting(false);
        setExecutionError(data?.error || 'Erro ao iniciar execução no Playwright.');
      }
    } catch (err) {
      setIsExecuting(false);
      setExecutionError(`Erro de comunicação: ${err.message}`);
    }
  };

  const handleGenerateAndExecute = async () => {
    if (!targetUrl || !targetUrl.trim()) {
      setPlanError('Informe a URL da aplicação web alvo.');
      return;
    }
    if (!userPrompt || !userPrompt.trim()) {
      setPlanError('Descreva o objetivo do teste ou fluxo a ser executado.');
      return;
    }

    setIsPlanning(true);
    setPlanResult(null);
    setEditableSteps([]);
    setPlanError(null);
    setExecutionError(null);

    try {
      const res = await fetch(`${API_BASE}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          swaggerUrl: swaggerUrl?.trim() || null,
          prompt: userPrompt.trim(),
          mode: 'prompt',
          githubUrl: null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setPlanError(data?.error || `Falha HTTP ${res.status} ao planejar casos de teste.`);
        setIsPlanning(false);
        return;
      }

      setPlanResult(data);
      const steps = (data.passos || []).map((p, idx) => {
        const rawList = Array.isArray(p.criteriosMinimos) && p.criteriosMinimos.length > 0
          ? p.criteriosMinimos
          : (p.criterioMinimoDescricao ? [p.criterioMinimoDescricao] : [p.resultadoEsperado || 'Critério essencial para aprovação e homologação']);
        return {
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
          resultadoEsperado: p.resultadoEsperado || 'Interface atualizada em conformidade',
          criterioMinimo: p.criterioMinimo !== false,
          criterioMinimoDescricao: rawList.join('; '),
          criteriosMinimos: rawList
        };
      });
      setEditableSteps(steps);
      setIsPlanning(false);

      if (steps.length === 0) {
        setPlanError('Nenhum caso de teste foi gerado para este objetivo.');
        return;
      }

      setIsExecuting(true);
      const execRes = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          prompt: data.titulo || userPrompt,
          testPlanId: data.planId || null,
          headless,
          steps
        })
      });

      const execData = await execRes.json();
      if (execRes.ok && execData.executionId) {
        setLiveFrameUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setExecution({
          id: execData.executionId,
          status: 'Running',
          targetUrl: targetUrl.trim(),
          prompt: data.titulo || userPrompt,
          startedAt: new Date().toISOString(),
          totalSteps: steps.length,
          totalCriteriosMinimos: steps.filter(s => s.criterioMinimo !== false).length,
          passedCriteriosMinimos: 0,
          failedCriteriosMinimos: 0,
          criteriosMinimosAtingidos: false,
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
            criterioMinimo: p.criterioMinimo !== false,
            criterioMinimoDescricao: p.criterioMinimoDescricao || p.resultadoEsperado,
            criteriosMinimos: p.criteriosMinimos || (p.criterioMinimoDescricao ? [p.criterioMinimoDescricao] : []),
            status: idx === 0 ? 'Running' : 'Pending'
          }))
        });
        setTimeout(() => executionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
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

  // Prompt IA & Exportações
  const generateAiPrompt = (format = 'detailed') => {
    if (editableSteps.length === 0) return '';
    if (format === 'natural') {
      const lines = [];
      lines.push(`Acesse a aplicação ${targetUrl || 'web'} e execute os seguintes casos de teste em sequência:\n`);
      editableSteps.forEach((s, idx) => {
        const isNegativo = (s.tipo || '').toLowerCase().includes('negativo');
        let text = `${idx + 1}. [${s.codigo || `TC-${idx + 1}`}] ${s.titulo}: ${s.descricao.trim()}`;
        if (s.dadosTeste && s.dadosTeste !== 'N/A' && !s.dadosTeste.includes('Dados de formulário')) {
          text += ` (Dados de entrada: ${s.dadosTeste}).`;
        }
        if (isNegativo) {
          text += ` ATENÇÃO: Por ser um teste negativo, se você NÃO conseguir avançar ou exibir mensagem de erro, deu certo.`;
        } else {
          text += ` Caso conclua com êxito e observe '${s.resultadoEsperado}', deu certo.`;
        }
        lines.push(text);
      });
      lines.push(`\nAo final, reporte o status de cada caso (Aprovado ou Falhou) com evidências.`);
      return lines.join('\n');
    }

    const lines = [];
    lines.push(`Você é um Agente Autônomo Especialista em Execução de Testes E2E.`);
    if (targetUrl) lines.push(`Aplicação Web Alvo: ${targetUrl}`);
    if (planResult?.commit) {
      const branchInfo = planResult.commit.branch ? ` (Branch: ${planResult.commit.branch})` : (githubBranch ? ` (Branch: ${githubBranch})` : '');
      lines.push(`Commit: ${planResult.commit.shortSha}${branchInfo} - ${planResult.commit.message}`);
    }
    lines.push(`\nSUÍTE DE CASOS DE TESTE PADRONIZADOS (${editableSteps.length} CASOS):\n`);
    editableSteps.forEach((s, idx) => {
      lines.push(`[CASO ${idx + 1}] ${s.codigo || `TC-${idx + 1}`} — ${s.titulo}`);
      lines.push(`Classificação: ${s.tipo || 'Funcional'} | Severidade: ${s.prioridade || 'Alta'} | Técnica: ${s.tecnica || 'ISTQB'}`);
      if (s.preCondicao) lines.push(`Pré-condição: ${s.preCondicao}`);
      if (s.dadosTeste) lines.push(`Dados: ${s.dadosTeste}`);
      lines.push(`Procedimento: ${s.descricao}`);
      lines.push(`Assert: ${s.resultadoEsperado}\n`);
    });
    return lines.join('\n');
  };

  const handleCopyAiPrompt = () => {
    navigator.clipboard.writeText(generateAiPrompt(aiPromptFormat));
    setCopiedAiPrompt(true);
    setTimeout(() => setCopiedAiPrompt(false), 2500);
  };

  const handleDownloadAiPrompt = () => {
    const blob = new Blob([generateAiPrompt(aiPromptFormat)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prompt_IA_Testes_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendPromptToMode1 = () => {
    setUserPrompt(generateAiPrompt('natural'));
    setActiveWorkspace('prompt');
    setShowAiPromptModal(false);
  };

  // RTM
  const getRtmList = () => {
    if (!planResult) return [];
    const direct = planResult.matrizRastreabilidade || planResult.rtm || planResult.analise?.matrizRastreabilidade;
    if (Array.isArray(direct) && direct.length > 0) {
      return direct.map((item, idx) => {
        const firstTcId = Array.isArray(item.casosTesteIds) ? item.casosTesteIds[0] : item.casosTesteIds;
        const matchedStep = editableSteps.find(s => s.codigo === firstTcId) || editableSteps[idx];
        const isMin = matchedStep ? matchedStep.criterioMinimo !== false : true;
        return {
          ...item,
          criterioMinimo: isMin ? 'Sim (DoD)' : 'Secundário',
          criterioMinimoDescricao: matchedStep?.criterioMinimoDescricao || item.justificativa
        };
      });
    }
    if (editableSteps.length > 0) {
      const commitFiles = planResult.commit?.files || [];
      return editableSteps.map((s, idx) => {
        const matchedFile = commitFiles[idx % (commitFiles.length || 1)]?.filename || 'Código-fonte do Commit';
        return {
          idRequisito: `REQ-${String(idx + 1).padStart(2, '0')}`,
          titulo: s.titulo?.replace(/^\[.*?\]\s*/, '') || `Requisito associado ao ${s.codigo || `TC-${idx + 1}`}`,
          categoria: s.tipo || 'Regra de Negócio',
          modulo: 'Interface / Fluxo',
          arquivosAfetados: [matchedFile],
          casosTesteIds: [s.codigo || `TC-${String(idx + 1).padStart(2, '0')}`],
          criterioMinimo: s.criterioMinimo !== false ? 'Sim (DoD)' : 'Secundário',
          criterioMinimoDescricao: s.criterioMinimoDescricao || s.resultadoEsperado,
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
    const headers = ['ID Requisito', 'Módulo', 'Categoria', 'Título / Requisito', 'Arquivos Afetados', 'Casos de Teste Vinculados', 'Critério Mínimo (DoD)', 'Status Cobertura', 'Prioridade', 'Justificativa'];
    const rows = list.map(item => [
      `"${(item.idRequisito || '').replace(/"/g, '""')}"`,
      `"${(item.modulo || '').replace(/"/g, '""')}"`,
      `"${(item.categoria || '').replace(/"/g, '""')}"`,
      `"${(item.titulo || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(item.arquivosAfetados) ? item.arquivosAfetados.join('; ') : (item.arquivosAfetados || '')).replace(/"/g, '""')}"`,
      `"${(Array.isArray(item.casosTesteIds) ? item.casosTesteIds.join(', ') : (item.casosTesteIds || '')).replace(/"/g, '""')}"`,
      `"${(item.criterioMinimo || 'Sim (DoD)').replace(/"/g, '""')}"`,
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

  const generateMarkdownDossier = () => {
    const lines = [];
    lines.push(`# Dossiê de Especificação e Análise de Testes de Software`);
    lines.push(`**Norma Técnica:** ISTQB CTFL/CTAL & ISO/IEC/IEEE 29119 (RTM)`);
    lines.push(`**Plataforma:** Qore Analytics • Motor Quantum AI`);
    lines.push(`**Projeto:** ${activeProject?.name || 'Projeto Web'}`);
    lines.push(`**Data de Emissão:** ${new Date().toLocaleString()}`);
    lines.push(``);
    if (planResult?.commit) {
      lines.push(`## 1. Alteração de Código (Git Commit)`);
      lines.push(`- **Repositório:** ${githubUrl}`);
      lines.push(`- **Commit SHA:** \`${planResult.commit.sha}\``);
      lines.push(`- **Mensagem:** ${planResult.commit.message}\n`);
    }
    lines.push(`## 2. Análise Técnica & Casos de Teste (${editableSteps.length})`);
    editableSteps.forEach((s, idx) => {
      lines.push(`### ${s.codigo || `TC-${idx + 1}`}: ${s.titulo}`);
      lines.push(`- **Categoria:** ${s.tipo} | **Técnica:** ${s.tecnica} | **Prioridade:** ${s.prioridade}`);
      lines.push(`- **Procedimento:** ${s.descricao}`);
      lines.push(`- **Resultado Esperado:** ${s.resultadoEsperado}\n`);
    });
    return lines.join('\n');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownDossier());
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([generateMarkdownDossier()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_QA_Padronizado_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sign-off e Usuários
  const handleSignTest = async () => {
    if (currentUser.role === 'Dev') {
      alert('Desenvolvedores (Dev) não possuem permissão para assinar aprovação de release. Alterne para o perfil QA ou Admin.');
      return;
    }
    setIsSigning(true);
    try {
      const res = await fetch(`${API_BASE}/sign-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPlanId: planResult?.planId || null,
          signerName: currentUser.name,
          signerRole: currentUser.role === 'Admin' ? 'QA Director / Admin' : 'QA Lead / ISTQB',
          decision: signatureDecision,
          notes: signatureNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.signature) setTestSignature(data.signature);
      else alert(data.error || 'Erro ao assinar.');
    } catch (err) {
      alert(`Falha ao registrar assinatura: ${err.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    setUserCreateError(null);
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserCreateError('Nome e e-mail são obrigatórios.');
      return;
    }
    const perfilId = newUserRole === 'QA' ? 2 : newUserRole === 'Admin' ? 3 : 1;
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          perfilId,
          companyName: newUserCompany.trim() || 'Qore Analytics Partner'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => [...prev, data]);
        setCurrentUser(data);
        setNewUserName('');
        setNewUserEmail('');
        setShowUserModal(false);
      } else {
        setUserCreateError(data?.error || 'Erro ao criar usuário.');
      }
    } catch (err) {
      setUserCreateError(`Erro: ${err.message}`);
    }
  };

  // Badges Helpers
  const getBadgeTypeColor = (tipo) => {
    switch ((tipo || '').toLowerCase()) {
      case 'regressão':
      case 'regressao':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'integrado':
      case 'integração':
      case 'integracao':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'negativo':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'borda':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
  };

  const getPriorityColor = (prioridade) => {
    switch ((prioridade || '').toLowerCase()) {
      case 'crítica':
      case 'critica':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'alta':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-700/60 text-slate-300 border-slate-600/50';
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'Admin') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    if (role === 'QA') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  };

  const totalCasos = editableSteps.length || 1;
  const coverageStats = {
    total: editableSteps.length,
    funcional: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('funcional')).length,
    regressao: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('regress')).length,
    negativo: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('negativo')).length,
    borda: editableSteps.filter(s => (s.tipo || '').toLowerCase().includes('borda')).length,
    critica: editableSteps.filter(s => (s.prioridade || '').toLowerCase().includes('cr')).length
  };

  // Renderizador Unificado da Suíte de Casos de Teste
  const renderTestSuite = (mode) => {
    if (editableSteps.length === 0) return null;
    const isMode1 = mode === 'prompt';

    return (
      <div className="qore-card rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800/80 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ListChecks size={19} className="text-cyan-400" />
              <h3 className="text-base font-bold text-slate-100">
                {isMode1 ? 'Casos de Teste Planejados para Execução E2E' : 'Suíte de Casos de Teste Padronizados (ISTQB)'}
              </h3>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {editableSteps.length} casos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Revise os passos, ajuste critérios mínimos de aceitação (DoD) ou edite os cenários antes de executar.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isMode1 ? (
              <button
                type="button"
                onClick={handleExecutePlaywright}
                disabled={isExecuting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isExecuting ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} className="fill-slate-950" />}
                <span>{isExecuting ? 'Executando no Chromium...' : 'Executar no Playwright'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAiPromptModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
              >
                <Bot size={16} />
                <span>Gerar Prompt para IA</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddStep}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700/80 transition-colors"
            >
              <Plus size={15} /> Adicionar Caso
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700/80 transition-colors"
            >
              <FileText size={15} /> Exportar Dossiê (.md)
            </button>
          </div>
        </div>

        {/* DoD Quality Gate Bar */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Shield size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-100">Quality Gate — Critérios Mínimos (DoD)</h4>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {editableSteps.filter(s => s.criterioMinimo !== false).length}/{editableSteps.length} bloqueantes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Casos marcados como Critério Mínimo bloqueiam a aprovação caso falhem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setEditableSteps(prev => prev.map(s => ({ ...s, criterioMinimo: true })))}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
            >
              Marcar Todos
            </button>
            <button
              type="button"
              onClick={() => setEditableSteps(prev => prev.map(s => ({ ...s, criterioMinimo: s.prioridade === 'Crítica' || s.prioridade === 'Alta' })))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Apenas Críticos/Altos
            </button>
            <button
              type="button"
              onClick={() => setEditableSteps(prev => prev.map(s => ({ ...s, criterioMinimo: false })))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-medium border border-slate-800 transition-colors"
            >
              Desmarcar
            </button>
          </div>
        </div>

        {/* Lista de Fichas de Teste */}
        <div className="space-y-4">
          {editableSteps.map((step, index) => (
            <div
              key={step.id || index}
              className={`p-4 rounded-xl border transition-all space-y-3.5 ${
                step.criterioMinimo !== false
                  ? 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/40'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-85'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-800/70">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={step.codigo || `TC-${String(index + 1).padStart(2, '0')}`}
                    onChange={(e) => handleUpdateStep(index, 'codigo', e.target.value)}
                    className="w-16 text-center font-mono font-bold text-xs px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={step.tipo || 'Funcional'}
                    onChange={(e) => handleUpdateStep(index, 'tipo', e.target.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold outline-none bg-slate-900 ${getBadgeTypeColor(step.tipo)}`}
                  >
                    <option value="Funcional">Funcional</option>
                    <option value="Regressão">Regressão</option>
                    <option value="Integrado">Integrado</option>
                    <option value="Negativo">Negativo</option>
                    <option value="Borda">Borda</option>
                  </select>
                  <select
                    value={step.tecnica || 'Partição de Equivalência'}
                    onChange={(e) => handleUpdateStep(index, 'tecnica', e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-medium text-slate-300 bg-slate-900 outline-none"
                  >
                    <option value="Transição de Estado">Transição de Estado</option>
                    <option value="Partição de Equivalência">Partição de Equivalência</option>
                    <option value="Análise de Valor Limite">Análise de Valor Limite</option>
                    <option value="Integração de API / Contrato">Integração de API / Contrato</option>
                    <option value="Teste Baseado em Risco">Teste Baseado em Risco</option>
                  </select>
                  <select
                    value={step.prioridade || 'Alta'}
                    onChange={(e) => handleUpdateStep(index, 'prioridade', e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border font-medium outline-none bg-slate-900 ${getPriorityColor(step.prioridade)}`}
                  >
                    <option value="Crítica">P1 - Crítica</option>
                    <option value="Alta">P2 - Alta</option>
                    <option value="Média">P3 - Média</option>
                  </select>
                  {step.criterioMinimo !== false && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      DoD Obrigatório
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors self-end sm:self-auto"
                  title="Excluir caso de teste"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Título Descritivo</label>
                <input
                  type="text"
                  value={step.titulo}
                  onChange={(e) => handleUpdateStep(index, 'titulo', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg qore-input text-sm font-semibold text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Pré-Condições</label>
                    <input
                      type="text"
                      value={step.preCondicao || ''}
                      onChange={(e) => handleUpdateStep(index, 'preCondicao', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg qore-input text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Dados de Teste</label>
                    <input
                      type="text"
                      value={step.dadosTeste || ''}
                      onChange={(e) => handleUpdateStep(index, 'dadosTeste', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg qore-input text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Procedimento Passo a Passo</label>
                    <textarea
                      rows={2}
                      value={step.descricao}
                      onChange={(e) => handleUpdateStep(index, 'descricao', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg qore-input text-slate-300 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-400 block mb-1">Resultado Esperado (Assert)</label>
                    <input
                      type="text"
                      value={step.resultadoEsperado || ''}
                      onChange={(e) => handleUpdateStep(index, 'resultadoEsperado', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-emerald-900/60 text-emerald-300 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Critérios Mínimos Dinâmicos */}
              <div className={`p-3.5 rounded-xl border ${step.criterioMinimo !== false ? 'bg-amber-500/5 border-amber-500/25' : 'bg-slate-900/40 border-slate-800'}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={step.criterioMinimo !== false}
                      onChange={(e) => handleUpdateStep(index, 'criterioMinimo', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-200">Critério Mínimo de Aceitação (Bloqueante para Release)</span>
                  </label>
                </div>

                {step.criterioMinimo !== false && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/70">
                    {(Array.isArray(step.criteriosMinimos) && step.criteriosMinimos.length > 0
                      ? step.criteriosMinimos
                      : [step.criterioMinimoDescricao || step.resultadoEsperado || 'Critério essencial']
                    ).map((crit, cIdx, arr) => (
                      <div key={cIdx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center border border-amber-500/30 shrink-0">
                          {cIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={crit}
                          onChange={(e) => handleUpdateStepCriterion(index, cIdx, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg qore-input text-xs text-slate-200"
                        />
                        {arr.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStepCriterion(index, cIdx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddCriterionToStep(index)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 flex items-center gap-1.5"
                    >
                      <Plus size={13} /> Adicionar Critério Mínimo
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const executionGallery = [];
  if (execution?.initialScreenshotUrl) {
    executionGallery.push({
      url: `${BACKEND_HOST}${execution.initialScreenshotUrl}`,
      title: 'Passo 0 — Tela Inicial Aberta',
      subtitle: execution.targetUrl,
      status: 'Info'
    });
  }
  (execution?.steps || []).forEach(s => {
    if (s.screenshotUrl) {
      executionGallery.push({
        url: `${BACKEND_HOST}${s.screenshotUrl}`,
        title: `${s.codigo || `TC-${s.stepNumber}`} — ${s.stepTitle}`,
        subtitle: s.visitedUrl || execution?.targetUrl,
        status: s.status
      });
    }
  });
  const selectedGalleryIndex = selectedImage
    ? executionGallery.findIndex(item => item.url === selectedImage)
    : -1;
  const selectedGalleryItem = selectedGalleryIndex >= 0 ? executionGallery[selectedGalleryIndex] : null;

  return (
    <div className="min-h-screen qore-ambient-bg text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-100">

      {/* MODAL: Screenshot Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-6xl w-full max-h-[92vh] bg-slate-950 border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-2 pt-1">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedGalleryIndex >= 0 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      Print {selectedGalleryIndex + 1} de {executionGallery.length}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-white truncate">
                    {selectedGalleryItem ? selectedGalleryItem.title : 'Evidência Visual da Execução'}
                  </h4>
                </div>
                {selectedGalleryItem?.subtitle && (
                  <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{selectedGalleryItem.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedImage}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                >
                  <Download size={14} /> Baixar Print
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-2 bg-slate-800/90 hover:bg-slate-700 rounded-full text-slate-200"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center bg-black/70 rounded-xl overflow-hidden min-h-[300px]">
              {selectedGalleryIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedImage(executionGallery[selectedGalleryIndex - 1].url)}
                  className="absolute left-3 z-10 p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-white shadow-lg"
                  title="Print anterior"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <img src={selectedImage} alt="Evidência" className="w-full h-auto max-h-[76vh] object-contain" />
              {selectedGalleryIndex >= 0 && selectedGalleryIndex < executionGallery.length - 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedImage(executionGallery[selectedGalleryIndex + 1].url)}
                  className="absolute right-3 z-10 p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-white shadow-lg"
                  title="Próximo print"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Novo Usuário (1 Único Perfil Obrigatório) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="qore-card rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-700/80">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <UserPlus size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Cadastrar Novo Usuário</h3>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Ana Beatriz"
                  className="w-full px-3.5 py-2 rounded-xl qore-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ana@empresa.com"
                  className="w-full px-3.5 py-2 rounded-xl qore-input text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Perfil Único *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl qore-input text-sm"
                  >
                    <option value="Dev">Dev (Desenvolvedor)</option>
                    <option value="QA">QA (Analista de Testes)</option>
                    <option value="Admin">Admin (Gestor)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Organização</label>
                  <input
                    type="text"
                    value={newUserCompany}
                    onChange={(e) => setNewUserCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl qore-input text-sm"
                  />
                </div>
              </div>

              {userCreateError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                  {userCreateError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Prompt Executável para IA */}
      {showAiPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="qore-card rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Prompt Executável para IA</h3>
                  <p className="text-xs text-slate-400">Copie para ChatGPT, Claude, Gemini ou envie para o Playwright.</p>
                </div>
              </div>
              <button onClick={() => setShowAiPromptModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiPromptFormat('detailed')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium ${aiPromptFormat === 'detailed' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                >
                  Estruturado
                </button>
                <button
                  onClick={() => setAiPromptFormat('natural')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium ${aiPromptFormat === 'natural' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                >
                  Linguagem Natural
                </button>
              </div>
              <span className="text-xs font-mono text-cyan-400">{editableSteps.length} casos</span>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {generateAiPrompt(aiPromptFormat)}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-2.5 flex-wrap">
              <button onClick={handleCopyAiPrompt} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                {copiedAiPrompt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedAiPrompt ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <button onClick={handleDownloadAiPrompt} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Download size={14} /> Baixar .txt
              </button>
              <button onClick={handleSendPromptToMode1} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-slate-950 text-xs font-bold flex items-center gap-1.5">
                <Play size={14} className="fill-slate-950" /> Executar no Playwright
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Exportar Dossiê Markdown */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="qore-card rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={19} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Dossiê ISTQB & RTM (ISO/IEC/IEEE 29119)</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1.5 text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                {generateMarkdownDossier()}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2 flex-wrap">
              <button onClick={handleDownloadRtmCsv} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5">
                <FileSpreadsheet size={14} /> Exportar RTM (.csv)
              </button>
              <button onClick={handleCopyMarkdown} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                {copiedExport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedExport ? 'Copiado!' : 'Copiar Markdown'}</span>
              </button>
              <button onClick={handleDownloadMarkdown} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5">
                <Download size={14} /> Baixar .md
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Seleção de Commits Recentes */}
      {showCommitPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="qore-card rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GitCommit size={19} className="text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">Selecionar Commit</h3>
                  <p className="text-xs text-slate-400">{githubBranch ? `Branch: ${githubBranch}` : 'Branch padrão'}</p>
                </div>
              </div>
              <button onClick={() => setShowCommitPicker(false)} className="p-1.5 text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {recentCommits.map((c) => (
                <div key={c.sha} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300">{c.shortSha}</span>
                      <span className="text-xs font-semibold text-slate-200 truncate">{c.message}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{c.author} • {c.date ? new Date(c.date).toLocaleString() : ''}</div>
                  </div>
                  <button
                    onClick={() => { setCommitSha(c.sha); setShowCommitPicker(false); }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shrink-0"
                  >
                    Selecionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          HEADER GLOBAL DE COMANDO (OBSIDIAN QUANTUM TELEMETRY)
         ============================================================ */}
      <header className="border-b border-slate-800/80 bg-[#060911]/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Brand + Active Project Pill */}
          <div className="flex items-center justify-between lg:justify-start gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Cpu size={21} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-white">Qore Analytics</h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    v2.0 • Quantum AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Engenharia de QA Autônoma • Shift-Left & Easypanel Ready</p>
              </div>
            </div>

            {/* Active Project Selector */}
            {activeProject && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <FolderKanban size={14} className="text-cyan-400 shrink-0" />
                <span className="text-slate-400 hidden sm:inline">Projeto:</span>
                <select
                  value={activeProject.id}
                  onChange={(e) => {
                    const found = projects.find(p => p.id === Number(e.target.value));
                    if (found) selectProject(found, false);
                  }}
                  className="bg-transparent text-slate-100 font-semibold outline-none cursor-pointer max-w-[190px] truncate"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Telemetry & Role Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setActiveWorkspace('projects')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium transition-colors"
              title="Conectar projeto local via Túnel Reverso"
            >
              <Plug size={13} />
              <span>Túnel Local</span>
            </button>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[11px] ${
              backendStatus.online
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{backendStatus.online ? '.NET 10 Online' : 'Offline'}</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              <Database size={13} className="text-indigo-400" />
              <span>{backendStatus.db}</span>
            </div>

            {backendStatus.online && (
              <div
                title={backendStatus.playwright?.message || 'Status do Motor Chromium + Vídeo WebM'}
                className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[11px] ${
                  backendStatus.playwright?.ready
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                    : backendStatus.playwright?.installing
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Video size={13} />
                <span>
                  {backendStatus.playwright?.ready
                    ? 'Chromium + Vídeo Ready'
                    : backendStatus.playwright?.installing
                    ? 'Preparando Chromium...'
                    : 'Chromium Sob Demanda'}
                </span>
              </div>
            )}

            {/* Active User Switcher */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              <User size={13} className="text-cyan-400" />
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const u = users.find(x => x.id === Number(e.target.value));
                  if (u) setCurrentUser(u);
                }}
                className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer text-xs"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeClass(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Workspace Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
          <nav className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
            <button
              onClick={() => setActiveWorkspace('projects')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeWorkspace === 'projects'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FolderKanban size={16} className={activeWorkspace === 'projects' ? 'text-cyan-400' : ''} />
              <span>1. Projetos & Túnel Local</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('github')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeWorkspace === 'github'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <GitCommit size={16} className={activeWorkspace === 'github' ? 'text-cyan-400' : ''} />
              <span>2. Análise Git & RTM</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('prompt')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeWorkspace === 'prompt'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Play size={16} className={activeWorkspace === 'prompt' ? 'text-emerald-400' : ''} />
              <span>3. Automação E2E (Playwright)</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('governance')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeWorkspace === 'governance'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Rocket size={16} className={activeWorkspace === 'governance' ? 'text-indigo-400' : ''} />
              <span>4. Equipe, Sign-Off & Easypanel</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ============================================================
          MAIN CONTENT
         ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 flex-1 w-full space-y-7">

        {/* ========================================================
            WORKSPACE 1: PROJETOS & TÚNEL LOCAL (SHIFT-LEFT BRIDGE)
           ======================================================== */}
        {activeWorkspace === 'projects' && (
          <div className="space-y-7">
            {/* Hero Banner: Como Testar Projeto Local a partir do Easypanel */}
            <div className="qore-card rounded-2xl p-6 border-cyan-500/25 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Shift-Left Testing • Easypanel ↔ Localhost
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    Conector de Túnel Reverso (Testar Alteração Local pelo Qore na Web)
                  </h2>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Mesmo com o Qore Analytics hospedado no <strong>Easypanel</strong>, você consegue testar qualquer sistema rodando no seu PC (<code className="text-cyan-300">localhost</code>) criando um túnel HTTPS seguro. O motor Playwright já envia automaticamente os headers anti-intersticial (<code className="text-emerald-300">Bypass-Tunnel-Reminder</code> e <code className="text-emerald-300">ngrok-skip-browser-warning</code>).
                  </p>
                </div>

                {/* Diagrama Visual de Arquitetura */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shrink-0">
                  <div className="flex flex-col items-center text-center">
                    <Globe size={18} className="text-indigo-400 mb-1" />
                    <span className="font-semibold text-slate-200">Qore Web</span>
                    <span className="text-[10px] text-slate-500">Easypanel</span>
                  </div>
                  <ArrowRight size={14} className="text-cyan-400 animate-pulse" />
                  <div className="flex flex-col items-center text-center px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <Radio size={16} className="text-cyan-400 mb-0.5" />
                    <span className="font-mono text-[10px] text-cyan-300 font-bold">Túnel HTTPS</span>
                  </div>
                  <ArrowRight size={14} className="text-emerald-400 animate-pulse" />
                  <div className="flex flex-col items-center text-center">
                    <Laptop size={18} className="text-emerald-400 mb-1" />
                    <span className="font-semibold text-slate-200">Seu PC</span>
                    <span className="text-[10px] text-slate-500">localhost:{localPort || '3000'}</span>
                  </div>
                </div>
              </div>

              {/* Passo a Passo Interativo do Túnel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Coluna 1: Gerador de Comando */}
                <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Passo 1 — Exponha sua porta local</span>
                    <span className="text-[10px] font-mono text-cyan-400">Zero Deploy</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Porta Local do Projeto</label>
                      <input
                        type="text"
                        value={localPort}
                        onChange={(e) => setLocalPort(e.target.value.replace(/\D/g, ''))}
                        placeholder="3000"
                        className="w-full px-3 py-2 rounded-lg qore-input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Ferramenta de Túnel</label>
                      <select
                        value={tunnelProvider}
                        onChange={(e) => setTunnelProvider(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg qore-input text-xs"
                      >
                        <option value="localtunnel">LocalTunnel (npx)</option>
                        <option value="ngrok">Ngrok (CLI)</option>
                        <option value="cloudflared">Cloudflare Tunnel</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['3000', '5173', '5044', '8080'].map(port => (
                      <button
                        key={port}
                        type="button"
                        onClick={() => setLocalPort(port)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                          localPort === port
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        :{port}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-black/60 border border-slate-800 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-emerald-300 truncate">{getTunnelCommand()}</code>
                    <button
                      type="button"
                      onClick={handleCopyTunnelCommand}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 shrink-0"
                    >
                      {copiedTunnelCmd ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedTunnelCmd ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Coluna 2: Validador de Conectividade ao Vivo */}
                <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Passo 2 — Cole a URL HTTPS gerada e teste a conexão</span>
                    <span className="text-[10px] font-mono text-emerald-400">Probe /api/qa/check-target</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={tunnelUrlInput}
                      onChange={(e) => setTunnelUrlInput(e.target.value)}
                      placeholder="https://meu-app.loca.lt ou https://xxxx.ngrok-free.app"
                      className="flex-1 px-3.5 py-2.5 rounded-xl qore-input text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleCheckTargetConnectivity(tunnelUrlInput)}
                      disabled={isCheckingTarget}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {isCheckingTarget ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
                      <span>{isCheckingTarget ? 'Testando...' : 'Testar Conexão'}</span>
                    </button>
                  </div>

                  {targetCheckResult && (
                    <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      targetCheckResult.reachable
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold flex items-center gap-1.5">
                          {targetCheckResult.reachable ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-amber-400" />}
                          {targetCheckResult.detectedType || 'Diagnóstico de Rede'}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {targetCheckResult.statusCode > 0 && (
                            <span className="px-2 py-0.5 rounded bg-black/40">HTTP {targetCheckResult.statusCode}</span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-black/40">{targetCheckResult.latencyMs}ms</span>
                        </div>
                      </div>
                      <p className="text-[11px]">{targetCheckResult.message}</p>
                      {targetCheckResult.recommendation && (
                        <p className="text-[11px] text-slate-300 pt-1 border-t border-white/10">
                          {targetCheckResult.recommendation}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleApplyTunnelUrlAndTest}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/15"
                    >
                      <Play size={13} className="fill-slate-950" />
                      <span>Aplicar URL & Ir para Automação E2E</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de Projetos Cadastrados + Formulário DDD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Lista de Projetos (7 cols) */}
              <div className="lg:col-span-7 qore-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FolderKanban size={18} className="text-cyan-400" />
                      Projetos Monitorados ({projects.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cada projeto é obrigatoriamente vinculado a 1 ou mais usuários da equipe.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchProjects}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                    title="Atualizar lista"
                  >
                    <RefreshCw size={14} className={isLoadingProjects ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="space-y-3">
                  {projects.map(proj => {
                    const isSelected = activeProject?.id === proj.id;
                    return (
                      <div
                        key={proj.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-950/75 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white truncate">{proj.name}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300">
                                {proj.environmentType || 'Cloud'}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-slate-400 truncate">{proj.targetUrl}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => selectProject(proj, true)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                            >
                              Testar Agora
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditProjectClick(proj)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Editar projeto"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(proj.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                              title="Remover projeto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Usuários Linkados */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/70 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Users size={13} className="text-slate-500" />
                            {(proj.users || []).map(u => (
                              <span
                                key={u.id}
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${getRoleBadgeClass(u.role)}`}
                              >
                                {u.name} ({u.role})
                              </span>
                            ))}
                          </div>
                          {proj.githubUrl && (
                            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
                              {proj.githubUrl.replace('https://github.com/', 'git: ')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formulário Criar / Editar Projeto (5 cols) */}
              <div className="lg:col-span-5 qore-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                  <h3 className="text-base font-bold text-white">
                    {projectFormMode === 'edit' ? 'Editar Projeto' : 'Novo Projeto'}
                  </h3>
                  {projectFormMode === 'edit' && (
                    <button onClick={resetProjectForm} className="text-xs text-cyan-400 hover:underline">
                      + Criar Novo
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProject} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Nome do Projeto * (2–150 caracteres)</label>
                    <input
                      type="text"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      placeholder="Ex: AfroKings Checkout API"
                      className="w-full px-3.5 py-2 rounded-xl qore-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">URL Alvo (HTTP/HTTPS ou Túnel) *</label>
                    <input
                      type="text"
                      value={projTargetUrl}
                      onChange={(e) => setProjTargetUrl(e.target.value)}
                      placeholder="https://meu-app.loca.lt ou https://site.com"
                      className="w-full px-3.5 py-2 rounded-xl qore-input text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Ambiente</label>
                      <select
                        value={projEnvType}
                        onChange={(e) => setProjEnvType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl qore-input text-xs"
                      >
                        <option value="Cloud / Produção">Cloud / Produção</option>
                        <option value="Homologação">Homologação</option>
                        <option value="Túnel Local (Shift-Left)">Túnel Local (Shift-Left)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Swagger (Opcional)</label>
                      <input
                        type="text"
                        value={projSwaggerUrl}
                        onChange={(e) => setProjSwaggerUrl(e.target.value)}
                        placeholder="https://.../swagger.json"
                        className="w-full px-3 py-2 rounded-xl qore-input text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Repositório GitHub (Opcional)</label>
                    <input
                      type="text"
                      value={projGithubUrl}
                      onChange={(e) => setProjGithubUrl(e.target.value)}
                      placeholder="https://github.com/org/repo"
                      className="w-full px-3 py-2 rounded-xl qore-input text-xs font-mono"
                    />
                  </div>

                  {/* Vínculo Obrigatório a 1 ou mais Usuários */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200">
                        Usuários Vinculados * (Mínimo 1)
                      </label>
                      <span className="text-[10px] font-mono text-cyan-400">{projUserIds.length} selecionado(s)</span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {users.map(u => {
                        const checked = projUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-100'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProjectUser(u.id)}
                                className="accent-cyan-500"
                              />
                              <span>{u.name}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRoleBadgeClass(u.role)}`}>
                              {u.role}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {projectError && (
                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                      {projectError}
                    </div>
                  )}
                  {projectSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200">
                      {projectSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingProject}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isSavingProject ? 'Salvando...' : (projectFormMode === 'edit' ? 'Atualizar Projeto' : 'Cadastrar & Vincular Projeto')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            WORKSPACE 2: ANÁLISE GIT & RTM (ISTQB / ISO 29119)
           ======================================================== */}
        {activeWorkspace === 'github' && (
          <div className="space-y-7">
            <div className="qore-card rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <GitBranch size={21} className="text-cyan-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">Análise de Commit & Geração de RTM (ISO/IEC/IEEE 29119)</h2>
                    <p className="text-xs text-slate-400">Inspeciona o Git Diff, calcula riscos de regressão e gera suíte ISTQB padronizada.</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  100% Analítico
                </span>
              </div>

              {/* Repo + Token */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-cyan-300 block mb-1.5">URL do Repositório GitHub</label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => handleGithubUrlChange(e.target.value)}
                    placeholder="https://github.com/usuario/repositorio"
                    className="w-full px-3.5 py-2.5 rounded-xl qore-input text-xs font-mono"
                  />
                </div>

                {/* PAT Token */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Key size={14} className={githubToken ? 'text-emerald-400' : 'text-cyan-400'} />
                      <span className="text-xs font-semibold text-slate-200">Token GitHub (PAT) — Opcional p/ públicos</span>
                    </div>
                    {githubToken && (
                      <button
                        type="button"
                        onClick={handleTestToken}
                        disabled={isValidatingToken}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                      >
                        {isValidatingToken ? 'Validando...' : 'Testar Acesso'}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showTokenVisible ? 'text' : 'password'}
                      value={githubToken}
                      onChange={(e) => { handleTokenChange(e.target.value); setTokenTestResult(null); }}
                      placeholder="ghp_... ou github_pat_..."
                      className="w-full pl-9 pr-10 py-2 rounded-lg qore-input text-xs font-mono"
                    />
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowTokenVisible(!showTokenVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showTokenVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>

                  {tokenTestResult && (
                    <div className={`p-2.5 rounded-lg border text-xs ${tokenTestResult.valid ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200' : 'bg-rose-950/50 border-rose-800 text-rose-200'}`}>
                      {tokenTestResult.message}
                    </div>
                  )}
                </div>

                {/* Branch & Commit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Branch (Opcional)</label>
                      <button type="button" onClick={handleFetchBranches} disabled={isLoadingBranches || !githubUrl} className="text-[11px] text-cyan-400 hover:underline">
                        {isLoadingBranches ? 'Buscando...' : 'Listar Branches'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      placeholder="main, develop..."
                      className="w-full px-3 py-2 rounded-lg qore-input text-xs font-mono"
                    />
                    {availableBranches.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {availableBranches.slice(0, 4).map(b => (
                          <button
                            key={b.name}
                            type="button"
                            onClick={() => setGithubBranch(b.name)}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${githubBranch === b.name ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {branchesError && <p className="text-[10px] text-amber-300">{branchesError}</p>}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Commit SHA (Opcional)</label>
                      <button type="button" onClick={() => handleFetchRecentCommits()} disabled={isLoadingCommits || !githubUrl} className="text-[11px] text-cyan-400 hover:underline">
                        {isLoadingCommits ? 'Carregando...' : 'Ver Commits Recentes'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={commitSha}
                      onChange={(e) => setCommitSha(e.target.value)}
                      placeholder="Hash curto ou completo (vazio = último)"
                      className="w-full px-3 py-2 rounded-lg qore-input text-xs font-mono"
                    />
                    {commitsError && <p className="text-[10px] text-amber-300">{commitsError}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Diretrizes de Foco da Análise</label>
                <textarea
                  rows={2}
                  value={githubPrompt}
                  onChange={(e) => setGithubPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl qore-input text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-400">Gera Matriz RTM, Matriz de Riscos e Casos ISTQB.</span>
                <button
                  onClick={() => handleGeneratePlan('github')}
                  disabled={isPlanning}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isPlanning ? <RefreshCw size={15} className="animate-spin" /> : <GitCommit size={15} />}
                  <span>{isPlanning ? 'Analisando Commit...' : 'Analisar Commit & Gerar RTM'}</span>
                </button>
              </div>

              {planError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle size={15} className="text-rose-400 shrink-0" />
                  <span>{planError}</span>
                </div>
              )}
            </div>

            {/* Painel de Análise & RTM */}
            {planResult && (
              <div className="qore-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{planResult.titulo || 'Relatório de Análise Técnica'}</h3>
                    <p className="text-xs text-slate-400">{planResult.resumo}</p>
                  </div>
                  {planResult.commit?.htmlUrl && (
                    <a href={planResult.commit.htmlUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                      <ExternalLink size={13} /> {planResult.commit.shortSha}
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5"><FileCode size={15} /> Análise de Impacto</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{planResult.analiseImpacto || planResult.analise?.analiseImpacto || 'Impacto mapeado a partir do diff do commit.'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/25 space-y-2">
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5"><ShieldAlert size={15} /> Matriz de Riscos (ISTQB)</h4>
                    {Array.isArray(planResult.matrizRisco) && planResult.matrizRisco.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {planResult.matrizRisco.map((r, i) => (
                          <div key={i} className="p-2 rounded-lg bg-slate-900 text-xs flex justify-between gap-2">
                            <span className="text-slate-200">{r.risco}</span>
                            <span className="text-[10px] text-amber-300 shrink-0">{r.impacto}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Riscos avaliados automaticamente.</p>
                    )}
                  </div>
                </div>

                {/* Tabela RTM */}
                {getRtmList().length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                        <Table size={16} /> Matriz de Rastreabilidade (RTM — ISO/IEC/IEEE 29119)
                      </h4>
                      <button onClick={handleDownloadRtmCsv} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5">
                        <FileSpreadsheet size={14} /> Exportar CSV
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                            <th className="p-3">ID</th>
                            <th className="p-3">Módulo</th>
                            <th className="p-3">Requisito</th>
                            <th className="p-3">Casos</th>
                            <th className="p-3">Cobertura</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {getRtmList().map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="p-3 font-mono font-bold text-cyan-300">{item.idRequisito || `REQ-${idx + 1}`}</td>
                              <td className="p-3 text-slate-300">{item.modulo || 'Geral'}</td>
                              <td className="p-3 text-slate-200">{item.titulo}</td>
                              <td className="p-3 font-mono text-indigo-300">{Array.isArray(item.casosTesteIds) ? item.casosTesteIds.join(', ') : item.casosTesteIds}</td>
                              <td className="p-3 text-emerald-400 font-semibold">{item.statusCobertura || '100% Coberto'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {renderTestSuite('github')}
          </div>
        )}

        {/* ========================================================
            WORKSPACE 3: AUTOMAÇÃO E2E COM PLAYWRIGHT
           ======================================================== */}
        {activeWorkspace === 'prompt' && (
          <div className="space-y-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 qore-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Play size={20} className="text-emerald-400" />
                    <div>
                      <h2 className="text-base font-bold text-white">Automação E2E Real com Playwright & Vídeo</h2>
                      <p className="text-xs text-slate-400">Suporte nativo a URLs Cloud e Túneis Locais (.loca.lt, ngrok, cloudflared).</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-300">URL Alvo (Cloud ou Túnel Local)</label>
                      <button
                        type="button"
                        onClick={() => handleCheckTargetConnectivity(targetUrl)}
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Wifi size={11} /> Testar Alvo
                      </button>
                    </div>
                    <input
                      type="text"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://sua-aplicacao.com ou https://app.loca.lt"
                      className="w-full px-3.5 py-2.5 rounded-xl qore-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Swagger / OpenAPI (Opcional)</label>
                    <input
                      type="text"
                      value={swaggerUrl}
                      onChange={(e) => setSwaggerUrl(e.target.value)}
                      placeholder="https://api.com/swagger/v1/swagger.json"
                      className="w-full px-3.5 py-2.5 rounded-xl qore-input text-xs font-mono"
                    />
                  </div>
                </div>

                {targetCheckResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    targetCheckResult.reachable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}>
                    <span>{targetCheckResult.message}</span>
                    <span className="font-mono text-[11px] shrink-0">{targetCheckResult.latencyMs}ms</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Objetivo do Teste / Prompt</label>
                    <button
                      type="button"
                      onClick={() => setUserPrompt('Tente login com 2 credenciais inválidas. Depois faça login com lebron@email.com / afrokings. Tente agendar para ontem e depois para amanhã.')}
                      className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                    >
                      Cenário AfroKings
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl qore-input text-xs font-mono resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={headless} onChange={(e) => setHeadless(e.target.checked)} className="accent-cyan-500" />
                    <span>Modo Headless (obrigatório em containers/Easypanel)</span>
                  </label>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleGeneratePlan('prompt')}
                      disabled={isPlanning || isExecuting}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
                    >
                      {isPlanning ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      <span>Planejar Casos</span>
                    </button>
                    <button
                      onClick={handleGenerateAndExecute}
                      disabled={isPlanning || isExecuting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {isExecuting || isPlanning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} className="fill-slate-950" />}
                      <span>{isPlanning ? 'Planejando...' : isExecuting ? 'Executando...' : 'Gerar & Executar E2E'}</span>
                    </button>
                  </div>
                </div>

                {(planError || executionError) && (
                  <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                    <span>{planError || executionError}</span>
                  </div>
                )}
              </div>

              {/* Histórico Recente */}
              <div className="lg:col-span-4 qore-card rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <History size={16} className="text-cyan-400" /> Histórico E2E
                    </h3>
                    <button onClick={fetchHistory} className="p-1 text-slate-400 hover:text-slate-200">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                    {executionHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Nenhuma execução registrada.</p>
                    ) : (
                      executionHistory.slice(0, 6).map(item => (
                        <div
                          key={item.id}
                          onClick={() => setExecution(item)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            execution?.id === item.id
                              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-100'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold">#{item.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300' :
                              item.status === 'Failed' ? 'bg-rose-500/20 text-rose-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>{item.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{item.prompt || 'Execução E2E'}</p>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                            <span>{item.passedSteps}/{item.totalSteps} casos</span>
                            <span>{new Date(item.startedAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Motor Real</span>
                  <span className="text-emerald-400 font-mono">Playwright Chromium</span>
                </div>
              </div>
            </div>

            {renderTestSuite('prompt')}

            {/* Resultados da Execução Ativa */}
            {execution && (
              <div ref={executionPanelRef} className="qore-card rounded-2xl p-6 space-y-6 scroll-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-cyan-300 font-bold">#{execution.id}</span>
                      <h3 className="text-base font-bold text-white">{execution.prompt || 'Execução Playwright'}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono break-all">{execution.targetUrl}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                      <Camera size={12} className="text-cyan-400" />
                      {execution.videoUrl ? 'Vídeo + Prints Reais' : execution.status === 'Running' ? 'Capturando ao vivo' : 'Execução'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      execution.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      execution.status === 'PassedWithWarnings' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      execution.status === 'Failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      'bg-amber-500/20 text-amber-300 animate-pulse'
                    }`}>
                      {execution.status}
                    </span>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Total</span>
                    <span className="text-xl font-bold font-mono text-white">{execution.totalSteps || 0}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Aprovados</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{execution.passedSteps || 0}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Falhas</span>
                    <span className="text-xl font-bold font-mono text-rose-400">{execution.failedSteps || 0}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Conformidade</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {execution.totalSteps > 0 ? Math.round((execution.passedSteps / execution.totalSteps) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Print Inicial da Aplicação (Passo 0) */}
                {execution.initialScreenshotUrl && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded">PASSO 0</span>
                        <h5 className="text-sm font-semibold text-white">Tela Inicial Aberta no Chromium</h5>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          Renderização Inicial
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Print real capturado imediatamente após o carregamento completo da aplicação alvo no navegador.</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded break-all">
                        <Globe size={11} /> {execution.targetUrl}
                      </span>
                    </div>
                    <div
                      onClick={() => setSelectedImage(`${BACKEND_HOST}${execution.initialScreenshotUrl}`)}
                      className="w-full md:w-60 h-36 rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 cursor-pointer shrink-0 relative group bg-black"
                    >
                      <img
                        src={`${BACKEND_HOST}${execution.initialScreenshotUrl}`}
                        alt="Print inicial da aplicação"
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-opacity">
                        <Eye size={15} /> Ampliar Print Inicial
                      </div>
                    </div>
                  </div>
                )}

                {/* Passos Executados */}
                <div className="space-y-3">
                  {(execution.steps || []).map(s => (
                    <div key={s.id || s.stepNumber} className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-cyan-400">{s.codigo || `TC-${s.stepNumber}`}</span>
                          <h5 className="text-sm font-semibold text-white">{s.stepTitle}</h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            s.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            s.status === 'Failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            s.status === 'Pending' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}>{s.status}</span>
                        </div>
                        <p className="text-xs text-slate-300">{s.descricao || s.action}</p>
                        {s.visitedUrl && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 bg-cyan-950/30 border border-cyan-500/20 px-2.5 py-1 rounded-lg w-fit max-w-full break-all">
                            <Globe size={12} className="shrink-0" />
                            <span>URL navegada: {s.visitedUrl}</span>
                          </div>
                        )}
                        {s.executedActions && (
                          <div className="rounded-lg bg-slate-900/90 border border-slate-800/90 p-2.5 space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                              Ações Executadas no Navegador Real
                            </span>
                            <div className="text-[11px] font-mono text-slate-200 whitespace-pre-line leading-relaxed">
                              {s.executedActions}
                            </div>
                          </div>
                        )}
                        {s.errorDetails && (
                          <p className={`text-xs font-medium ${s.status === 'Failed' ? 'text-rose-400' : 'text-emerald-300'}`}>
                            {s.errorDetails}
                          </p>
                        )}
                      </div>
                      {s.screenshotUrl ? (
                        <div
                          onClick={() => setSelectedImage(`${BACKEND_HOST}${s.screenshotUrl}`)}
                          className="w-full md:w-60 h-36 rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 cursor-pointer shrink-0 relative group bg-black"
                        >
                          <img
                            src={`${BACKEND_HOST}${s.screenshotUrl}`}
                            alt={`Print ${s.stepNumber}`}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-slate-200 border border-white/10">
                            Passo {s.stepNumber}
                          </div>
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-opacity">
                            <Eye size={16} /> Ampliar Print
                          </div>
                        </div>
                      ) : s.status === 'Running' ? (
                        <div className="w-full md:w-60 h-36 rounded-xl border border-dashed border-amber-500/40 bg-slate-900/70 shrink-0 flex flex-col items-center justify-center gap-1.5 text-amber-300 text-xs px-3 text-center">
                          <Clock size={16} className="animate-spin" />
                          <span>Navegando & capturando print...</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Vídeo / Tela ao Vivo e Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800">
                  <div className="lg:col-span-6 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <Video size={14} className="text-cyan-400" />
                        {execution.videoUrl
                          ? 'Vídeo da Execução (.webm)'
                          : execution.status === 'Running' || execution.status === 'Pending'
                          ? 'Tela do Navegador em Tempo Real (Gravando .webm)'
                          : 'Vídeo da Execução (.webm)'}
                      </h4>
                      {execution.videoUrl && (
                        <div className="flex items-center gap-1.5">
                          {[0.5, 1, 1.5, 2].map(rate => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setVideoSpeed(rate)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                                videoSpeed === rate
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                          <a
                            href={`${BACKEND_HOST}${execution.videoUrl}`}
                            download
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200"
                          >
                            <Download size={12} /> Baixar .webm
                          </a>
                        </div>
                      )}
                    </div>
                    {execution.videoUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video">
                        <video
                          ref={videoRef}
                          key={`${execution.id}-${execution.videoUrl}`}
                          controls
                          autoPlay
                          muted
                          playsInline
                          onLoadedMetadata={() => {
                            if (videoRef.current) videoRef.current.playbackRate = videoSpeed;
                          }}
                          className="w-full h-full object-contain"
                        >
                          <source
                            src={`${BACKEND_HOST}${execution.videoUrl}?v=${encodeURIComponent(execution.finishedAt || execution.id)}`}
                            type="video/webm"
                          />
                        </video>
                      </div>
                    ) : (execution.status === 'Running' || execution.status === 'Pending') ? (
                      <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950 aspect-video flex items-center justify-center">
                        {!liveFrameUrl ? (
                          <div className="text-slate-400 text-xs flex flex-col items-center gap-2 px-4 text-center">
                            <Video size={22} className="text-cyan-400 animate-pulse" />
                            <span>Abrindo Chromium Headless e iniciando gravação WebM...</span>
                          </div>
                        ) : (
                          <>
                            <img
                              src={liveFrameUrl}
                              alt="Execução ao vivo no Chromium"
                              className="w-full h-full object-contain bg-black"
                            />
                            <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-bold tracking-wider uppercase shadow">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              REC • AO VIVO
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 aspect-video flex items-center justify-center text-slate-500 text-xs px-4 text-center">
                        Vídeo não disponível nesta execução (execute novamente após atualizar o backend).
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-6 space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Terminal size={14} className="text-indigo-400" /> Logs em Tempo Real
                    </h4>
                    <div ref={logTerminalRef} className="rounded-xl p-4 bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 h-72 overflow-y-auto whitespace-pre-wrap">
                      {execution.logs || 'Aguardando logs...'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            WORKSPACE 4: GOVERNANÇA, EQUIPE & DEPLOY EASYPANEL
           ======================================================== */}
        {activeWorkspace === 'governance' && (
          <div className="space-y-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gestão de Usuários (1 Único Perfil Obrigatório) */}
              <div className="lg:col-span-6 qore-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users size={18} className="text-cyan-400" /> Usuários & Perfis RBAC
                    </h3>
                    <p className="text-xs text-slate-400">Cada usuário possui 1 único perfil obrigatório (Dev, QA ou Admin).</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUserModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <UserPlus size={14} /> Novo Usuário
                  </button>
                </div>

                <div className="space-y-2.5">
                  {users.map(u => (
                    <div key={u.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{u.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{u.email} • {u.companyName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentUser(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          currentUser.id === u.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {currentUser.id === u.id ? 'Ativo' : 'Assumir'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assinatura Digital QA (Sign-off) */}
              <div className="lg:col-span-6 qore-card rounded-2xl p-6 space-y-4">
                <div className="border-b border-slate-800/80 pb-3.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award size={18} className="text-emerald-400" /> Assinatura Digital de Homologação (QA Sign-Off)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Emite certificado SHA-256 vinculando o responsável técnico (restrito a perfis QA e Admin).
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Parecer Técnico</label>
                    <select
                      value={signatureDecision}
                      onChange={(e) => setSignatureDecision(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl qore-input text-xs"
                    >
                      <option value="Aprovado para Teste Manual">Aprovado para Teste Manual</option>
                      <option value="Aprovado para Produção">Aprovado para Produção</option>
                      <option value="Reprovado - Correção Necessária">Reprovado - Correção Necessária</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Parecer Detalhado</label>
                    <textarea
                      rows={3}
                      value={signatureNotes}
                      onChange={(e) => setSignatureNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl qore-input text-xs resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSignTest}
                    disabled={isSigning}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Shield size={15} />
                    <span>{isSigning ? 'Gerando Hash SHA-256...' : `Assinar como ${currentUser.name} (${currentUser.role})`}</span>
                  </button>

                  {testSignature && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                      <div className="font-bold text-emerald-300">Certificado Emitido: {testSignature.signatureHash}</div>
                      <div className="text-slate-300">Responsável: {testSignature.signerName} ({testSignature.signerRole})</div>
                      <div className="text-slate-400">Parecer: {testSignature.decision}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guia de Deploy no Easypanel */}
            <div className="qore-card rounded-2xl p-6 space-y-4 border-indigo-500/25">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <Rocket size={20} className="text-indigo-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Pronto para Deploy no Easypanel</h3>
                    <p className="text-xs text-slate-400">Arquitetura preparada com proxy reverso Next.js, CORS liberado e Chromium Headless em container.</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Dockerfile Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-cyan-300">1. Proxy API Sem Hardcode</div>
                  <p className="text-slate-400 leading-relaxed">
                    O Frontend usa rotas relativas (<code className="text-slate-200">/api/qa/*</code> e <code className="text-slate-200">/evidencias/*</code>) redirecionadas automaticamente pelo <code className="text-slate-200">next.config.js</code> para o backend.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-300">2. Variáveis de Ambiente</div>
                  <p className="text-slate-400 leading-relaxed">
                    Configure no Easypanel: <code className="text-slate-200">Gemini__ApiKey</code>, <code className="text-slate-200">ConnectionStrings__PostgresConnection</code> e porta exposta <code className="text-slate-200">3000</code>.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-indigo-300">3. Teste Local via Túnel</div>
                  <p className="text-slate-400 leading-relaxed">
                    Após o deploy no Easypanel, use a aba <strong>Projetos & Túnel Local</strong> com <code className="text-slate-200">npx localtunnel --port 3000</code> para testar seu PC na web.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 py-5 border-t border-slate-800/80 bg-[#060911]/80 text-center text-xs text-slate-500">
        Qore Analytics • TCC Engenharia de Software SENAI • .NET 10, PostgreSQL, Next.js, Playwright & Gemini AI
      </footer>
    </div>
  );
}
