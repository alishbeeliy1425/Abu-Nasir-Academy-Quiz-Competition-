import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { db } from '../../../lib/store';
import { Subject } from '../../../types';
import { Book, Edit, Trash2, Plus, Search } from 'lucide-react';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  useEffect(() => {
    const loadSubjects = () => setSubjects(db.getSubjects());
    loadSubjects();
    return db.subscribe(loadSubjects);
  }, []);

  const handleDelete = (id: string) => {
    setSubjectToDelete(id);
  };

  const confirmDelete = () => {
    if (subjectToDelete) {
      db.deleteSubject(subjectToDelete);
      setSubjectToDelete(null);
    }
  };

  const handleEdit = (s: Subject) => {
    setEditingSubject(s);
    setFormData({ name: s.name, code: s.code });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      alert("Name and code are required.");
      return;
    }
    const newSub: Subject = {
      id: editingSubject ? editingSubject.id : `sub_${Date.now()}`,
      name: formData.name,
      code: formData.code.toUpperCase()
    };
    db.saveSubject(newSub);
    setIsModalOpen(false);
  };

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Subjects Management</h2>
          <p className="text-sm text-slate-500 mt-1">Configure subjects and assign them to examination banks.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Subject</Button>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. English Language"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                    placeholder="e.g. ENG"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Save Subject</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-xl border-0">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Subject?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this subject? This action cannot be undone and may affect associated questions.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" className="w-full border-slate-200 text-slate-600" onClick={() => setSubjectToDelete(null)}>Cancel</Button>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Yes, Delete</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="shadow-sm border-0 ring-1 ring-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search subjects..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Subject Name</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Subject Code</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                 <tr>
                   <td colSpan={3} className="p-12 text-center text-slate-500">
                     <div className="flex flex-col items-center justify-center">
                       <Book className="w-12 h-12 text-slate-200 mb-3" />
                       <p className="text-slate-600 font-medium">No subjects found.</p>
                       <p className="text-sm text-slate-400 mt-1">Add a new subject to get started, or change your search filter.</p>
                       <Button onClick={handleAdd} variant="outline" className="mt-4 border-slate-200 text-slate-600">
                         <Plus className="w-4 h-4 mr-2" /> Add Subject
                       </Button>
                     </div>
                   </td>
                 </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                           <Book className="w-4 h-4" />
                         </div>
                         <span className="font-semibold text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold font-mono">{s.code}</span>
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" onClick={() => handleEdit(s)}><Edit className="w-4 h-4" /></button>
                         <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
