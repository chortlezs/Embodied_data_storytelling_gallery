import React from 'react';
import { FilterPanel } from './components/FilterPanel';
import { CaseGrid } from './components/CaseGrid';
import { DetailModal } from './components/DetailModal';

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <FilterPanel />
      <main className="flex-1 overflow-hidden relative">
        <CaseGrid />
        <DetailModal />
      </main>
    </div>
  );
};

export default App;
