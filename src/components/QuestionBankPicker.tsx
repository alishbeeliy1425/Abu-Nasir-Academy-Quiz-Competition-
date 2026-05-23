import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Search, X, CheckSquare, Square, Filter } from 'lucide-react';
import { db } from '../lib/store';
import { Question } from '../types';

export interface QuestionBankPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (selectedQuestionIds: string[]) => void;
  examSubjects?: string[]; // optionally pre-filter
}

export function QuestionBankPicker({ isOpen, onClose, onAttach, examSubjects }: QuestionBankPickerProps) {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const questions = db.getQuestions();
  const subjects = db.getSubjects();

  if (!isOpen) return null;

  const filtered = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(search.toLowerCase()) || 
                          (q.topic && q.topic.toLowerCase().includes(search.toLowerCase()));
    const matchesSubject = subjectFilter ? q.subject === subjectFilter : true;
    return matchesSearch && matchesSubject;
  });

  const toggleAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(q => q.id)));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAttach = () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one question.");
      return;
    }
    const arr = Array.from(selectedIds);
    onAttach(arr);
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-4xl shadow-2xl relative bg-white flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Question Bank Library</h2>
            <p className="text-sm text-slate-500">Pick from existing questions to attach to this exam.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-white rounded-full shadow-sm hover:shadow">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by text or topic..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="w-full sm:w-48 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          <div className="space-y-3">
            {filtered.map(q => (
              <div 
                key={q.id} 
                onClick={() => toggleRow(q.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md flex gap-4 ${
                  selectedIds.has(q.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="mt-1">
                  {selectedIds.has(q.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                      {q.subject}
                    </span>
                    {q.topic && (
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                        {q.topic}
                      </span>
                    )}
                    {q.difficulty && (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    )}
                    {q.examId && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium rounded">
                        Already Attached
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-2">{q.text}</p>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No questions match your search.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={toggleAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <><CheckSquare className="w-4 h-4 mr-1.5" /> Deselect All</>
              ) : (
                <><CheckSquare className="w-4 h-4 mr-1.5" /> Select All ({filtered.length})</>
              )}
            </button>
            <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">{selectedIds.size} Selected</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAttach} disabled={selectedIds.size === 0}>
              Attach Selected to Exam
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
