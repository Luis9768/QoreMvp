import React, { useState } from 'react';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import type { TestCategory } from '../types/qa';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    category: TestCategory | 'ALL';
    status: string;
    mandatoryOnly: boolean;
  }) => void;
}

export const MobileFilterModal: React.FC<MobileFilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [mandatoryOnly, setMandatoryOnly] = useState(false);

  if (!isOpen) return null;

  const categories: Array<{ id: TestCategory | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'Todos os Tipos' },
    { id: 'E2E', label: 'E2E (End-to-End)' },
    { id: 'API', label: 'API / Contratos' },
    { id: 'INTEGRATED', label: 'Testes Integrados' },
    { id: 'SECURITY', label: 'Segurança & Auth' },
  ];

  const handleSearch = () => {
    onApplyFilters({
      category: selectedCategory,
      status: selectedStatus,
      mandatoryOnly,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Bottom Sheet - Figma #697:718 & #647:1482 */}
      <div className="relative w-full bg-[#2D3133] text-white rounded-t-[20px] p-6 shadow-2xl z-10 border-t border-[#3C3F40] animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between pb-3 border-b border-[#3C3F40]">
          <h3 className="font-bold text-base text-white font-sans">Filtrar Casos de Teste</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Select Tipo 1: Categoria */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
              Tipo / Categoria de Teste
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#EA7913] text-white border-[#EA7913] font-bold shadow-sm'
                      : 'bg-[#232729] text-gray-300 border-[#3C3F40] hover:bg-[#3C3F40]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Select Tipo 2: Status */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
              Status de Execução
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'Passed', label: 'Aprovados' },
                { id: 'Failed', label: 'Reprovados' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStatus(st.id)}
                  className={`p-2 rounded-lg border text-center font-medium ${
                    selectedStatus === st.id
                      ? 'bg-[#EA7913] text-white border-[#EA7913] font-bold'
                      : 'bg-[#232729] text-gray-300 border-[#3C3F40]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle: Apenas Critérios Mínimos (DoD) */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mandatoryOnly}
                onChange={(e) => setMandatoryOnly(e.target.checked)}
                className="w-4 h-4 accent-[#EA7913] rounded"
              />
              <span className="text-gray-200 font-medium">
                Filtrar apenas Critérios Mínimos de Aceitação (DoD)
              </span>
            </label>
          </div>

          {/* Action button: Buscar (Figma #647:1484 & #181:174) */}
          <div className="pt-4 border-t border-[#3C3F40]">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full py-3 rounded-lg bg-[#EA7913] hover:bg-[#D56A0C] text-white font-bold text-sm shadow-md shadow-[#EA7913]/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Search size={16} />
              <span>Buscar Casos de Teste</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
