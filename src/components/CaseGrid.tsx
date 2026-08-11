import React, { useMemo } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { CaseCard } from './CaseCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

export const CaseGrid: React.FC = () => {
  const { getFilteredCases, searchQuery, setSearchQuery, selectedTags } = useCaseStore();
  
  const filteredCases = useMemo(() => getFilteredCases(), [getFilteredCases, selectedTags, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Embodied Data Storytelling Gallery</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-500">Discover innovative research and design cases related to embodied data storytelling</p>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-200">
              Showing {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
            </span>
          </div>
        </div>
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by title, author, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg text-sm transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredCases.map((caseItem) => (
              <motion.div
                key={caseItem.title}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <CaseCard caseItem={caseItem} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredCases.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No matching cases found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
};
