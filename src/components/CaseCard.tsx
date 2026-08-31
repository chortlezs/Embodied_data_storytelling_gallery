import React from 'react';
import { Case } from '../types';
import { useCaseStore } from '../store/useCaseStore';
import { ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { resolveCaseLink } from '../lib/utils';

interface CaseCardProps {
  caseItem: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem }) => {
  const setSelectedCase = useCaseStore(state => state.setSelectedCase);
  const caseLink = resolveCaseLink(caseItem.link);
  const hasIllustration = Boolean(caseItem.illustration);

  return (
    <div 
      onClick={() => setSelectedCase(caseItem)}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 bg-slate-50">
        {hasIllustration ? (
          <img
            src={caseItem.illustration}
            alt={`${caseItem.title} first figure`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Figure Preview Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-serif text-base font-semibold text-slate-900 leading-tight mb-3 line-clamp-3 group-hover:text-indigo-600 transition-colors">
          {caseItem.title}
        </h3>
        
        <div className="mt-auto flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {caseItem.year}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {caseItem.venue}
            </span>
          </div>
          <button 
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              window.open(caseLink, '_blank');
            }}
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
