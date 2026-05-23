import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { db } from '../../../lib/store';
import { Exam } from '../../../types';
import { Edit, Trash2, Plus, Play, Pause, Copy, BarChart2, Download, Library } from 'lucide-react';
import { ExportModal } from '../../../components/ExportModal';
import { QuestionBankPicker } from '../../../components/QuestionBankPicker';

export default function AdminExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportExamId, setExportExamId] = useState<string | undefined>(undefined);
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    durationMinutes: 60, 
    subjects: '', 
    gradingSystem: 'WAEC',
    academicSession: '',
    startDate: '',
    endDate: '',
    department: 'All',
    shuffleQuestions: true,
    shuffleOptions: true,
    questionsPerCandidate: 40,
    instructions: ''
  });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  useEffect(() => {
    const loadExams = () => setExams([...db.getExams()]);
    loadExams();
    return db.subscribe(loadExams);
  }, []);

  const confirmDelete = (exam: Exam) => {
    setExamToDelete(exam);
    setDeleteModalOpen(true);
  };

  const executeDelete = () => {
    if (examToDelete) {
      db.deleteExam(examToDelete.id);
      setDeleteModalOpen(false);
      setExamToDelete(null);
    }
  };

  const handleToggleStatus = (exam: Exam) => {
    const updated = { ...exam, status: exam.status === 'active' ? 'inactive' : 'active' } as Exam;
    db.addExam(updated); 
  };
  
  const handleDuplicate = (exam: Exam) => {
    const updated = { ...exam, id: `exam_${Date.now()}`, title: `${exam.title} (Copy)` } as Exam;
    db.addExam(updated); 
  };

  const handleAdd = () => {
    setEditingExam(null);
    setFormData({ 
      title: '', 
      durationMinutes: 60, 
      subjects: '', 
      gradingSystem: 'WAEC',
      academicSession: '',
      startDate: '',
      endDate: '',
      department: 'All',
      shuffleQuestions: true,
      shuffleOptions: true,
      questionsPerCandidate: 40,
      instructions: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({ 
      title: exam.title, 
      durationMinutes: exam.durationMinutes, 
      subjects: exam.subjects.join(', '), 
      gradingSystem: exam.gradingSystem as any || 'WAEC',
      academicSession: exam.academicSession || '',
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : '',
      department: exam.department || 'All',
      shuffleQuestions: exam.shuffleQuestions !== false, // default true
      shuffleOptions: exam.shuffleOptions !== false,
      questionsPerCandidate: exam.questionsPerCandidate || 40,
      instructions: exam.instructions || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title) return alert("Title is required");
    const updated: Exam = {
      id: editingExam ? editingExam.id : `exam_${Date.now()}`,
      title: formData.title,
      durationMinutes: Number(formData.durationMinutes) || 60,
      subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
      status: editingExam ? editingExam.status : 'inactive',
      gradingSystem: formData.gradingSystem as any,
      academicSession: formData.academicSession || undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      department: formData.department,
      shuffleQuestions: formData.shuffleQuestions,
      shuffleOptions: formData.shuffleOptions,
      questionsPerCandidate: Number(formData.questionsPerCandidate) || 40,
      instructions: formData.instructions || ''
    };
    db.addExam(updated);
    if (!editingExam) {
       setEditingExam(updated); // Persist temporary so picker doesn't lose context if save re-opens
    }
    setIsModalOpen(false);
  };
  
  const handleAttachQuestions = (questionIds: string[]) => {
    if (!editingExam) {
      alert("Please save the exam first before attaching questions.");
      return;
    }
    const storeQuestions = db.getQuestions();
    let attachedCount = 0;
    questionIds.forEach(id => {
       const q = storeQuestions.find(sq => sq.id === id);
       if (q) {
         db.addQuestion({ ...q, examId: editingExam.id });
         attachedCount++;
       }
    });
    alert(`Successfully attached ${attachedCount} questions to this exam!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">CBT & Exam Management</h2>
          <p className="text-sm text-slate-500 mt-1">Schedule, monitor, and configure active examinations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={() => { setExportExamId(undefined); setIsExportOpen(true); }}>
            <Download className="w-4 h-4 mr-2" /> Export Data
          </Button>
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Create Exam</Button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-xl my-4 sm:my-8 shrink-0">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{editingExam ? 'Edit Exam' : 'Create Exam'}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Exam Title</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. First Term Exams" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Academic Session</label>
                    <input type="text" value={formData.academicSession} onChange={e => setFormData({ ...formData, academicSession: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. 2026/2027" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Mins)</label>
                    <input type="number" value={formData.durationMinutes || ''} onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grading System</label>
                    <select value={formData.gradingSystem} onChange={e => setFormData({ ...formData, gradingSystem: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="WAEC">WAEC Style (A1 - F9)</option>
                      <option value="JAMB">JAMB Style (400-Point)</option>
                      <option value="CUSTOM">Custom Grading</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="All">All Departments</option>
                      <option value="Science">Science</option>
                      <option value="Arts">Arts</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subjects (Comma separated codes)</label>
                    <input type="text" value={formData.subjects} onChange={e => setFormData({ ...formData, subjects: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="ENG, MTH, BIO" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Exam Instructions & Rules</label>
                  <textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]" placeholder="Enter any specific instructions or anti-cheat warnings..."></textarea>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 border border-indigo-100 bg-indigo-50/50 p-4 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-indigo-900 text-sm uppercase tracking-wide">Question Pool</h4>
                      <p className="text-xs text-indigo-700/70 mt-0.5">Attach existing questions from the bank directly to this exam</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsBankPickerOpen(true)} className="mt-3 sm:mt-0 bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
                      <Library className="w-4 h-4 mr-2"/> Use Existing Questions
                    </Button>
                  </div>
                  
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide mt-6">Question Randomization</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 p-4 rounded-xl bg-slate-50">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Questions/Candidate</label>
                      <input type="number" value={formData.questionsPerCandidate || ''} onChange={e => setFormData({ ...formData, questionsPerCandidate: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" min={1} />
                      <p className="text-[11px] text-slate-500 mt-1">Random subset from pool</p>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="shuffleQ" checked={formData.shuffleQuestions} onChange={e => setFormData({ ...formData, shuffleQuestions: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                      <label htmlFor="shuffleQ" className="text-sm font-medium text-slate-700">Shuffle Questions</label>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="shuffleO" checked={formData.shuffleOptions} onChange={e => setFormData({ ...formData, shuffleOptions: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                      <label htmlFor="shuffleO" className="text-sm font-medium text-slate-700">Shuffle Options</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Save Exam</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {deleteModalOpen && examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border-red-100 ring-4 ring-red-100/50">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110 transition-transform">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Exam?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete <strong className="text-slate-700">{examToDelete.title}</strong>? This will remove all associated statistics, scheduled timers, and candidate access permanently.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="flex-1" onClick={() => { setDeleteModalOpen(false); setExamToDelete(null); }}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20" onClick={executeDelete}>Confirm Delete</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => (
          <Card key={exam.id} className={`border-t-4 transition-shadow hover:shadow-lg ${exam.status === 'active' ? 'border-green-500' : 'border-slate-300'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-slate-800">{exam.title}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${exam.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                   {exam.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                   {exam.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 space-y-2 mb-6">
                <p><strong>Duration:</strong> {exam.durationMinutes} Mins</p>
                <p><strong>Subjects:</strong> {exam.subjects.join(', ')}</p>
                <p><strong>Department:</strong> {exam.department || 'All'}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" className="h-8 shadow-sm flex-1 hover:bg-slate-50 transition-colors" onClick={() => handleToggleStatus(exam)}>
                  {exam.status === 'active' ? <><Pause className="w-3 h-3 mr-1" /> Deactivate</> : <><Play className="w-3 h-3 mr-1" /> Activate</>}
                </Button>
                <Button variant="outline" size="sm" className="h-8 shadow-sm px-2 hover:bg-purple-50 hover:text-purple-600 transition-colors" onClick={() => alert('Detailed stats for ' + exam.title + ' will be shown in the Analytics module.')}>
                   <BarChart2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 shadow-sm px-2 hover:bg-slate-50 transition-colors" onClick={() => handleDuplicate(exam)}>
                   <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 shadow-sm px-2 hover:bg-blue-50 hover:text-blue-600 transition-colors" onClick={() => handleEdit(exam)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 shadow-sm px-2 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => confirmDelete(exam)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {exams.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
             <div className="flex flex-col items-center justify-center">
               <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                 <Copy className="w-8 h-8" />
               </div>
               <p className="text-slate-600 font-medium text-lg">No Exams Found</p>
               <p className="text-sm text-slate-400 mt-1 max-w-sm mb-4">You haven't created any exams yet. Click the button below to get started.</p>
               <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
                 <Plus className="w-4 h-4 mr-2" /> Create Exam
               </Button>
             </div>
          </div>
        )}
      </div>
      
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        examId={exportExamId} 
      />

      <QuestionBankPicker
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        onAttach={handleAttachQuestions}
        examSubjects={editingExam ? editingExam.subjects : []}
      />
    </div>
  );
}
