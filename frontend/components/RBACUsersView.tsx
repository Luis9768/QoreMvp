import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Building, 
  Mail, 
  CheckCircle2, 
  X, 
  PenTool, 
  Lock, 
  FileSpreadsheet, 
  Search 
} from 'lucide-react';
import type { RBACMember, UserRole } from '../types/qa';

interface RBACUsersViewProps {
  currentUserRole: UserRole;
  onSignTest?: (signatureText: string) => void;
}

export const RBACUsersView: React.FC<RBACUsersViewProps> = ({
  currentUserRole,
  onSignTest,
}) => {
  const [members, setMembers] = useState<RBACMember[]>([
    {
      id: 'USR-001',
      name: 'Luis Fernando',
      email: 'luis.dev@empresa.com',
      role: 'Dev',
      company: 'TechCorp Solutions',
      status: 'Ativo',
      lastActivity: 'Há 5 minutos',
    },
    {
      id: 'USR-002',
      name: 'Amanda Silveira',
      email: 'amanda.qa@empresa.com',
      role: 'QA',
      company: 'TechCorp Solutions',
      status: 'Ativo',
      lastActivity: 'Há 12 minutos',
    },
    {
      id: 'USR-003',
      name: 'Carlos Mendes',
      email: 'carlos.admin@empresa.com',
      role: 'Admin',
      company: 'TechCorp Solutions',
      status: 'Ativo',
      lastActivity: 'Hoje às 08:30',
    },
    {
      id: 'USR-004',
      name: 'Beatriz Ramos',
      email: 'beatriz.dev@parceira.com',
      role: 'Dev',
      company: 'DevStudio Partners',
      status: 'Ativo',
      lastActivity: 'Ontem',
    },
  ]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Dev');
  const [newUserCompany, setNewUserCompany] = useState('TechCorp Solutions');

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('Amanda Silveira (QA Lead)');
  const [signatureNotes, setSignatureNotes] = useState('Suíte aprovada com 100% dos critérios mínimos de aceitação validados.');
  const [lastSignature, setLastSignature] = useState<{ name: string; date: string } | null>({
    name: 'Amanda Silveira',
    date: '27/10/2026 09:15',
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newMember: RBACMember = {
      id: `USR-${String(members.length + 1).padStart(3, '0')}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      company: newUserCompany.trim() || 'TechCorp Solutions',
      status: 'Ativo',
      lastActivity: 'Agora',
    };

    setMembers([...members, newMember]);
    setNewUserName('');
    setNewUserEmail('');
    setIsInviteModalOpen(false);
  };

  const handleSignTest = () => {
    if (!signatureName.trim()) return;
    setLastSignature({
      name: signatureName,
      date: new Date().toLocaleString('pt-BR'),
    });
    onSignTest?.(`${signatureName} - ${signatureNotes}`);
    setSignatureModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Figma #776:673 style */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D3133] text-white flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#191C1E] font-sans">
                Controle de Acesso RBAC & Organização
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFE3C9] text-[#944A00] font-mono">
                RBAC v3.1
              </span>
            </div>
            <p className="text-xs text-[#565E74]">
              Gestão de membros, isolamento multi-tenant, vínculo Dev ➔ Empresa e assinatura digital de QA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSignatureModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F2F4F6] text-[#2D3133] border border-[#D8DADC] text-xs font-semibold shadow-sm transition-all"
          >
            <PenTool size={14} className="text-[#EA7913]" />
            <span>Assinatura Digital de Teste</span>
          </button>

          {currentUserRole === 'Admin' ? (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA7913] hover:bg-[#D56A0C] text-white text-xs font-semibold shadow-md shadow-[#EA7913]/25 active:scale-95 transition-all"
            >
              <UserPlus size={14} />
              <span>+ Convidar Novo Usuário</span>
            </button>
          ) : (
            <span className="text-xs text-gray-500 italic flex items-center gap-1">
              <Lock size={12} /> Apenas Admin pode criar usuários
            </span>
          )}
        </div>
      </div>

      {/* Signature Banner if present */}
      {lastSignature && (
        <div className="bg-[#ECFDF5] border border-[#49CC90]/40 rounded-xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-[#047857]">
            <CheckCircle2 size={16} />
            <div>
              <span className="font-bold">Teste Assinado Digitalmente:</span> {lastSignature.name}
              <span className="text-gray-500 ml-2">({lastSignature.date})</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#047857] bg-white px-2 py-0.5 rounded border border-[#49CC90]/40 uppercase">
            Autenticado
          </span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8DADC] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#D8DADC] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#191C1E] font-sans">
            Membros da Organização ({members.length})
          </h3>
          <span className="text-xs text-gray-500">Isolamento Multi-tenant Ativo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2D3133] text-white text-[11px] uppercase tracking-wider font-sans">
              <tr>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Papel (RBAC)</th>
                <th className="py-3 px-4">Empresa Vinculada</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Última Atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-[#F7F9FB] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#191C1E]">
                    {member.name}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                    {member.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                        member.role === 'Admin'
                          ? 'bg-[#2D3133] text-white'
                          : member.role === 'QA'
                          ? 'bg-[#FFE3C9] text-[#944A00]'
                          : 'bg-[#EFF6FF] text-[#1D4ED8]'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#191C1E] font-medium flex items-center gap-1.5">
                    <Building size={13} className="text-[#EA7913]" />
                    {member.company}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded">
                      ● {member.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                    {member.lastActivity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Convidar Usuário (Admin Only) */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#191C1E]">Convidar Novo Usuário</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#EA7913]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  placeholder="joao@empresa.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#EA7913]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Perfil (RBAC)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#EA7913]"
                  >
                    <option value="Dev">Dev (Desenvolvedor)</option>
                    <option value="QA">QA (Analista de Testes)</option>
                    <option value="Admin">Admin (Administrador)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    required
                    value={newUserCompany}
                    onChange={(e) => setNewUserCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#EA7913]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#EA7913] hover:bg-[#D56A0C] text-white font-semibold shadow-md"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assinatura Digital do Teste */}
      {signatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#191C1E] flex items-center gap-2">
                <PenTool size={18} className="text-[#EA7913]" /> Assinatura Digital de Teste
              </h3>
              <button onClick={() => setSignatureModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nome do Responsável / QA</label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#EA7913]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Parecer de Homologação</label>
                <textarea
                  rows={3}
                  value={signatureNotes}
                  onChange={(e) => setSignatureNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#EA7913]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSignTest}
                  className="px-4 py-2 rounded-lg bg-[#EA7913] hover:bg-[#D56A0C] text-white font-semibold shadow-md"
                >
                  Assinar e Homologar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
