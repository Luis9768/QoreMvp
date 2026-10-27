import React, { useState } from 'react';
import { X, Search, GitCommit, Check } from 'lucide-react';
import type { GitHubCommitInfo } from '../types/qa';

interface CommitPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  commits: GitHubCommitInfo[];
  selectedSha: string;
  onSelectCommit: (sha: string) => void;
}

export const CommitPickerModal: React.FC<CommitPickerModalProps> = ({
  isOpen,
  onClose,
  commits,
  selectedSha,
  onSelectCommit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCommits = commits.filter((c) => {
    return (
      c.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sha.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFE3C9] text-[#944A00] flex items-center justify-center font-bold">
              <GitCommit size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#191C1E]">Selecionar Commit do Repositório</h3>
              <p className="text-xs text-[#565E74]">Selecione o commit de referência para gerar o teste pelo diff</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100 bg-[#F7F9FB]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por mensagem, autor ou hash SHA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#D8DADC] rounded-lg text-xs outline-none focus:border-[#EA7913]"
            />
          </div>
        </div>

        {/* Commits List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          {filteredCommits.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Nenhum commit encontrado.</div>
          ) : (
            filteredCommits.map((c) => {
              const isSelected = selectedSha === c.sha || selectedSha === c.shortSha;
              return (
                <div
                  key={c.sha}
                  onClick={() => {
                    onSelectCommit(c.sha);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#FFFDFB] border-[#EA7913] shadow-sm'
                      : 'bg-white border-[#E2E8F0] hover:bg-[#F7F9FB]'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-[#191C1E]">{c.message}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#565E74]">
                      <span className="font-mono font-bold text-[#EA7913] bg-[#FFE3C9] px-1.5 py-0.5 rounded">
                        {c.shortSha || c.sha.substring(0, 7)}
                      </span>
                      <span>Por: {c.author}</span>
                      <span>• {new Date(c.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#EA7913] text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isSelected ? '✓ Selecionado' : 'Usar Commit'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-[#F7F9FB] flex items-center justify-between text-xs text-gray-500">
          <span>Total: {commits.length} commits listados</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
