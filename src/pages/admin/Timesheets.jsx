import React, { useState } from 'react';
import { Layers, Filter, Activity } from 'lucide-react';
import ModernDailyTimesheets from '../../components/timesheets/ModernDailyTimesheets';

import ClassicTimesheets from '../../components/timesheets/ClassicTimesheets';
import TreeTimesheets from '../../components/timesheets/TreeTimesheets';

export default function Timesheets() {
  const [activeTab, setActiveTab] = useState('modern');

  return (
    <div className="w-full min-h-screen bg-slate-100 p-6 flex flex-col gap-4" style={{ zoom: 'var(--page-zoom, 0.9)' }}>
      {/* Header */}
      <div className="timesheet-header flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Timesheets Console</h1>
          <p className="text-sm text-slate-500 mt-1">Review employee timesheets, audit hours, and track team compliance</p>
        </div>
        <div className="timesheet-tabs flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'tree' ? 'text-white shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab === 'tree' ? { backgroundColor: '#0010ae' } : {}}
          >
            <Layers size={16} /> Tree View
          </button>
          <button 
            onClick={() => setActiveTab('classic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'classic' ? 'text-white shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab === 'classic' ? { backgroundColor: '#0010ae' } : {}}
          >
            <Filter size={16} /> Classic
          </button>
          <button 
            onClick={() => setActiveTab('modern')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'modern' ? 'text-white shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab === 'modern' ? { backgroundColor: '#0010ae' } : {}}
          >
            <Activity size={16} /> Modern
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === 'modern' && <ModernDailyTimesheets />}
      {activeTab === 'classic' && <ClassicTimesheets />}
      {activeTab === 'tree' && <TreeTimesheets />}
    </div>
  );
}
