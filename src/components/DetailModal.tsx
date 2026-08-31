import React from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, MapPin, Users, Target, Info } from 'lucide-react';
import { resolveCaseLink } from '../lib/utils';

export const DetailModal: React.FC = () => {
  const { selectedCase, setSelectedCase } = useCaseStore();

  if (!selectedCase) return null;

  const caseLink = resolveCaseLink(selectedCase.link);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedCase(null)}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <span className="text-xs font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded uppercase tracking-widest">
              Case Details
            </span>
            <button 
              onClick={() => setSelectedCase(null)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Media & Title */}
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 leading-tight mb-4">
                  {selectedCase.title}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-slate-400" />
                    {selectedCase.year}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-slate-400" />
                    {selectedCase.venue}
                  </span>
                </div>
                
                <a 
                  href={caseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-200"
                >
                  <ExternalLink size={18} />
                  View Paper / Project Details
                </a>
              </div>

              {/* Right Column: Taxonomy Tags */}
              <div className="space-y-6">
                {Object.entries(selectedCase.tags).map(([mainCat, subGroups]) => {
                  // Check if any subGroup has tags
                  const hasTags = Object.values(subGroups).some(tags => tags.length > 0);
                  if (!hasTags) return null;

                  return (
                    <div key={mainCat} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        {mainCat === 'What' && <Info size={14} />}
                        {mainCat === 'How' && <Target size={14} />}
                        {mainCat === 'Who' && <Users size={14} />}
                        {mainCat}
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(subGroups).map(([subGroup, tags]) => (
                          tags.length > 0 && (
                            <div key={subGroup}>
                              <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">{subGroup}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {tags.map(tag => (
                                  <span 
                                    key={tag}
                                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
