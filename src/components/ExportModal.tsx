import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, X, FileText, FileSpreadsheet, File } from 'lucide-react';
import { db } from '../lib/store';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId?: string; // Optional: If provided, export data specific to this exam
}

export function ExportModal({ isOpen, onClose, examId }: ExportModalProps) {
  const [exportType, setExportType] = useState('questions'); // questions, candidates, results, analytics
  const [format, setFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const exams = db.getExams();
  const results = db.getResults();
  const users = db.getUsers();
  const questions = db.getQuestions();
  
  const handleExport = async () => {
    setIsExporting(true);
    setProgress(10);
    
    // Simulate generation time
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 90));
    }, 200);

    try {
      let data: any[] = [];
      let filename = `export_${exportType}_${Date.now()}`;
      let targetExam = examId ? exams.find(e => e.id === examId) : null;
      
      if (exportType === 'questions') {
        const filteredQs = targetExam 
          ? questions.filter(q => q.examId === targetExam.id || (targetExam.subjects && targetExam.subjects.includes(q.subject)))
          : questions;
        data = filteredQs.map(q => ({
          ID: q.id,
          Subject: q.subject,
          Topic: q.topic,
          Difficulty: q.difficulty,
          Text: q.text,
          OptionA: q.options.find(o => o.label === 'A')?.text || '',
          OptionB: q.options.find(o => o.label === 'B')?.text || '',
          OptionC: q.options.find(o => o.label === 'C')?.text || '',
          OptionD: q.options.find(o => o.label === 'D')?.text || '',
          Correct: q.correctAnswer,
          ExamID: q.examId || ''
        }));
      } else if (exportType === 'candidates') {
        const candidates = users.filter(u => u.role === 'candidate');
        data = candidates.map(u => ({
          ID: u.id,
          Name: u.name,
          Email: u.email,
          Phone: u.phone || '',
          School: u.schoolName || '',
          State: u.state || ''
        }));
      } else if (exportType === 'results') {
        const filteredResults = targetExam ? results.filter(r => r.examId === targetExam.id) : results;
        data = filteredResults.map(r => {
          const u = users.find(u => u.id === r.candidateId);
          const e = exams.find(e => e.id === r.examId);
          return {
            Candidate: u?.name || 'Unknown',
            Email: u?.email || '',
            Exam: e?.title || r.examId,
            Score: r.score,
            MaxScore: r.maxScore,
            Percentage: ((r.score / r.maxScore) * 100).toFixed(1) + '%',
            Date: new Date(r.timestamp).toLocaleString()
          };
        });
      } else if (exportType === 'analytics') {
        // Aggregate analytics
        data = exams.map(e => {
          const exResults = results.filter(r => r.examId === e.id);
          const avg = exResults.length ? exResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / exResults.length : 0;
          return {
            Exam: e.title,
            TotalCandidates: exResults.length,
            AverageScore: avg.toFixed(1) + '%',
            Subjects: e.subjects.join(', ')
          };
        });
      }

      if (data.length === 0) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => { setIsExporting(false); alert("No data available to export."); }, 300);
        return;
      }

      // Generate File based on format
      if (format === 'csv') {
        const header = Object.keys(data[0]).join(',') + '\n';
        const csvContent = data.map(row => Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
      } else if (format === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, exportType);
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF('landscape');
        const headers = Object.keys(data[0]);
        const body = data.map(row => Object.values(row).map(String));
        
        doc.setFontSize(16);
        doc.text(`Export: ${exportType.toUpperCase()}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
        
        autoTable(doc, { 
          head: [headers], 
          body: body,
          startY: 30,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] }
        });
        doc.save(`${filename}.pdf`);
      }

      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setIsExporting(false);
        onClose();
        alert("Export successful!");
      }, 500);

    } catch (error) {
      console.error(error);
      clearInterval(interval);
      setIsExporting(false);
      alert("An error occurred during export.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl relative overflow-hidden">
        <button onClick={onClose} disabled={isExporting} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" /> Professional Export
          </h2>
          <p className="text-sm text-slate-500 mb-6">Select data type and output format.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data to Export</label>
              <select value={exportType} onChange={e => setExportType(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" disabled={isExporting}>
                <option value="questions">Exam Questions Data</option>
                <option value="candidates">Candidate Data</option>
                <option value="results">All Exam Results</option>
                <option value="analytics">System Analytics</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Format</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setFormat('csv')} 
                  disabled={isExporting}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${format === 'csv' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <FileText className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">CSV</span>
                </button>
                <button 
                  onClick={() => setFormat('xlsx')} 
                  disabled={isExporting}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${format === 'xlsx' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <FileSpreadsheet className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">XLSX</span>
                </button>
                <button 
                  onClick={() => setFormat('pdf')} 
                  disabled={isExporting}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${format === 'pdf' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <File className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">PDF</span>
                </button>
              </div>
            </div>
            
            {isExporting && (
              <div className="pt-2">
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg" onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Generate & Download'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
