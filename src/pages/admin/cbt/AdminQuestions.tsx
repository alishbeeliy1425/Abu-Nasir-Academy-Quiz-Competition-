import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { db, useStore } from '../../../lib/store';
import { Question, Subject, Exam } from '../../../types';
import { Search, Plus, Upload, Edit, Trash2, Filter } from 'lucide-react';
import { CsvImportModal } from '../../../components/CsvImportModal';
import { toast } from 'sonner';

export default function AdminQuestions() {
  const questions = useStore(state => state.questions || []);
  const subjects = useStore(state => state.subjects || []);
  const exams = useStore(state => state.exams || []);
  
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  const defaultFormData = { 
    examId: '',
    text: '', 
    subject: '', 
    topic: '', 
    difficulty: 'medium',
    optA: '', optB: '', optC: '', optD: '',
    correct: 'A'
  };
  const [formData, setFormData] = useState(defaultFormData);

  const confirmDelete = (q: Question) => {
    setQuestionToDelete(q);
    setDeleteModalOpen(true);
  };

  const executeDelete = () => {
    if (questionToDelete) {
      db.deleteQuestion(questionToDelete.id);
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      examId: q.examId || '',
      text: q.text,
      subject: q.subject,
      topic: q.topic || '',
      difficulty: q.difficulty || 'medium',
      optA: q.options.find(o => o.label === 'A')?.text || '',
      optB: q.options.find(o => o.label === 'B')?.text || '',
      optC: q.options.find(o => o.label === 'C')?.text || '',
      optD: q.options.find(o => o.label === 'D')?.text || '',
      correct: q.correctAnswer
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.text || !formData.subject || !formData.optA || !formData.optB) {
      toast.error("Please fill in the question text, subject, and at least two options.");
      return;
    }

    const updated: Question = {
      id: editingQuestion ? editingQuestion.id : `q_${Date.now()}`,
      examId: formData.examId || undefined,
      text: formData.text,
      subject: formData.subject,
      topic: formData.topic,
      difficulty: formData.difficulty as any,
      correctAnswer: formData.correct as any,
      options: [
        { label: 'A', text: formData.optA },
        { label: 'B', text: formData.optB },
        { label: 'C', text: formData.optC },
        { label: 'D', text: formData.optD },
      ].filter(o => o.text !== ''),
      explanation: ''
    };
    
    try {
      db.addQuestion(updated);
      toast.success(editingQuestion ? "Question updated successfully" : "Question saved successfully");
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error("Failed to save question");
    }
  };

  const handleUploadCSV = () => {
    setIsCsvModalOpen(true);
  };

  const filteredQuestions = questions.filter(q => {
    const textMatch = q.text.toLowerCase().includes(search.toLowerCase());
    const subjectMatch = subjectFilter ? q.subject.toLowerCase() === subjectFilter.toLowerCase() : true;
    return textMatch && subjectMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Question Bank Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Add, edit, import, and manage assessment questions.</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Button variant="outline" className="bg-white" onClick={handleUploadCSV}><Upload className="w-4 h-4 mr-2"/> Import CSV</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAdd}><Plus className="w-4 h-4 mr-2" /> Add Question</Button>
        </div>
      </div>

      {deleteModalOpen && questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border-red-100 ring-4 ring-red-100/50">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110 transition-transform">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Question?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete this question on <strong className="text-slate-700">{questionToDelete.subject}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="flex-1" onClick={() => { setDeleteModalOpen(false); setQuestionToDelete(null); }}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20" onClick={executeDelete}>Confirm Delete</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-xl my-4 sm:my-8 shrink-0">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Exam</label>
                    <select value={formData.examId} onChange={e => setFormData({ ...formData, examId: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">(Optional) No specific exam</option>
                      {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select...</option>
                      {Array.from(new Set([...subjects.map(s => s.name), ...questions.map(q => q.subject)])).filter(Boolean).sort().map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                    <input type="text" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Algebra" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                    <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                  <textarea rows={3} value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Type the question content here..." />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-slate-400 w-6">A</span>
                    <input type="text" value={formData.optA} onChange={e => setFormData({ ...formData, optA: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Option A" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-slate-400 w-6">B</span>
                    <input type="text" value={formData.optB} onChange={e => setFormData({ ...formData, optB: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Option B" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-slate-400 w-6">C</span>
                    <input type="text" value={formData.optC} onChange={e => setFormData({ ...formData, optC: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Option C" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-slate-400 w-6">D</span>
                    <input type="text" value={formData.optD} onChange={e => setFormData({ ...formData, optD: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Option D" />
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1 border-t border-slate-100 pt-4 mt-2">Correct Answer</label>
                   <div className="flex gap-4">
                     {['A', 'B', 'C', 'D'].map(opt => (
                       <label key={opt} className="flex items-center gap-2 cursor-pointer">
                         <input type="radio" name="correctAnswer" value={opt} checked={formData.correct === opt} onChange={e => setFormData({ ...formData, correct: e.target.value })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                         <span className="font-bold">Option {opt}</span>
                       </label>
                     ))}
                   </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Save Question</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="shadow-sm border-0 ring-1 ring-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search questions..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Filter className="w-4 h-4 text-slate-400" />
             <select 
               className="flex-1 sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={subjectFilter}
               onChange={e => { setSubjectFilter(e.target.value); setPage(1); }}
             >
               <option value="">All Subjects</option>
               {Array.from(new Set([...subjects.map(s => s.name), ...questions.map(q => q.subject)])).filter(Boolean).sort().map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredQuestions.length === 0 ? (
             <div className="p-12 text-center text-slate-500">
               <div className="flex flex-col items-center justify-center">
                 <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-lg flex items-center justify-center mb-3">
                   <Search className="w-6 h-6" />
                 </div>
                 <p className="text-slate-600 font-medium">No questions found.</p>
                 <p className="text-sm text-slate-400 mt-1 max-w-sm">We couldn't find any questions matching your search and filter criteria.</p>
                 <div className="flex gap-3 mt-4">
                   <Button onClick={() => {setSearch(''); setSubjectFilter('');}} variant="outline" className="border-slate-200 text-slate-600">
                     Clear Filters
                   </Button>
                   <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
                     <Plus className="w-4 h-4 mr-2" /> Add Question
                   </Button>
                 </div>
               </div>
             </div>
          ) : (
            <>
            {filteredQuestions.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((q, index) => (
              <div key={q.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-blue-700 bg-blue-100">{q.subject}</span>
                       <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600 bg-slate-100">{q.topic || 'General'}</span>
                       {q.difficulty && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-orange-700 bg-orange-100">{q.difficulty}</span>}
                    </div>
                    <h3 className="font-medium text-slate-800 text-sm sm:text-base leading-relaxed">
                       {index + 1}. {q.text}
                    </h3>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {q.options.map(opt => (
                        <div key={opt.label} className={`flex items-center gap-2 p-2 rounded-md ${opt.label === q.correctAnswer ? 'bg-green-50 text-green-800 font-medium ring-1 ring-green-200/50' : 'text-slate-600'}`}>
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs shadow-sm shrink-0">{opt.label}</span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 justify-end sm:justify-start">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleEdit(q)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50" onClick={() => confirmDelete(q)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredQuestions.length > itemsPerPage && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                 <span className="text-sm text-slate-500">Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length}</span>
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                   <Button variant="outline" size="sm" disabled={page * itemsPerPage >= filteredQuestions.length} onClick={() => setPage(p => p + 1)}>Next</Button>
                 </div>
              </div>
            )}
            </>
          )}
        </div>
      </Card>
      <CsvImportModal 
        isOpen={isCsvModalOpen} 
        onClose={() => setIsCsvModalOpen(false)} 
        onImportComplete={() => {}} 
      />
    </div>
  );
}
