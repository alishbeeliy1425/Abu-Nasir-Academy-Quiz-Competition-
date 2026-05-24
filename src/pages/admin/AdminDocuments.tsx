import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Folder, UploadCloud, FileText, Download, File, Image as ImageIcon, Trash2 } from 'lucide-react';
import { db, useStore } from '../../lib/store';

export default function AdminDocuments() {
  const [dragActive, setDragActive] = useState(false);
  const docs = useStore(state => state.documents || []);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 10MB.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        let type = 'doc';
        if (file.type.includes('pdf')) type = 'pdf';
        else if (file.type.includes('image')) type = 'img';
        
        db.addDocument({
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type,
          date: new Date().toLocaleDateString(),
          content: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this document?")) {
      db.deleteDocument(id);
    }
  };

  const handleDownload = (doc: any) => {
    const link = document.createElement("a");
    link.href = doc.content;
    link.download = doc.name;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Documents Hub</h2>
          <p className="text-sm text-slate-500 mt-1">Organize and distribute school files and reference materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-0 ring-1 ring-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Recent Files</h3>
              <div className="flex gap-2">
                <Button variant="outline" className="h-8 text-xs">Filter</Button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
               {docs.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 text-sm">No documents uploaded yet.</div>
               ) : docs.map((d, i) => (
                 <div key={d.id || i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                   <div className="flex items-center gap-4 truncate">
                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${d.type === 'pdf' ? 'bg-red-50 text-red-500' : d.type === 'img' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                       {d.type === 'pdf' ? <FileText className="w-5 h-5"/> : d.type === 'img' ? <ImageIcon className="w-5 h-5"/> : <File className="w-5 h-5"/>}
                     </div>
                     <div className="min-w-0">
                       <p className="font-semibold text-sm text-slate-800 truncate">{d.name}</p>
                       <p className="text-xs text-slate-500 mt-0.5">{d.size} • Uploaded {d.date}</p>
                     </div>
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownload(d)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Download className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(d.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 </div>
               ))}
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="shadow-sm border-0 ring-1 ring-slate-200 bg-white">
            <CardContent className="p-6">
              <h3 className="font-bold text-slate-700 mb-4">Upload Document</h3>
              <input type="file" className="hidden" ref={fileRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} multiple />
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-800">Drag & drop files here</h4>
                <p className="text-xs text-slate-500 mt-2 mb-6">Supports PDF, DOCX, XLSX, PNG (Max 10MB)</p>
                <Button className="w-full bg-slate-800 hover:bg-slate-900 shadow-md">Browse Files</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-slate-200">
            <div className="p-4 border-b border-slate-100">
               <h3 className="font-bold text-slate-700">Categories</h3>
            </div>
            <div className="p-2">
               {['Administrative', 'Academic Content', 'Financial Records', 'Exam Resources'].map((cat, i) => (
                 <button key={i} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-left text-sm font-medium text-slate-600 transition-colors">
                   <span className="flex items-center gap-2"><Folder className="w-4 h-4 text-blue-400"/> {cat}</span>
                   <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{Math.floor(Math.random() * 20) + 1}</span>
                 </button>
               ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
