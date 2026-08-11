import React, { useState } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { ChevronDown, ChevronRight, Filter, RotateCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FilterPanel: React.FC = () => {
  const { taxonomy, selectedTags, toggleTag, resetFilters } = useCaseStore();
  const [expandedCats, setExpandedCats] = useState<string[]>(Object.keys(taxonomy));

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Filter size={18} />
          <span>Filters</span>
        </div>
        <button 
          onClick={resetFilters}
          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      <div className="flex-1">
        {Object.entries(taxonomy).map(([mainCat, subGroups]) => (
          <div key={mainCat} className="border-b border-slate-100">
            <button 
              onClick={() => toggleCat(mainCat)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <span className="font-bold text-sm text-slate-800 tracking-wider uppercase">{mainCat}</span>
              {expandedCats.includes(mainCat) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {expandedCats.includes(mainCat) && (
              <div className="px-4 pb-4 space-y-4">
                {Object.entries(subGroups).map(([subGroup, tags]) => (
                  <div key={subGroup}>
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">{subGroup}</h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => {
                        const isSelected = selectedTags[subGroup]?.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTag(subGroup, tag)}
                            className={cn(
                              "px-2 py-1 rounded-full text-xs transition-all border",
                              isSelected 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                            )}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
