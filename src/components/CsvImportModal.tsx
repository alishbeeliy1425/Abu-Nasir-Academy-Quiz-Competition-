import React, { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, UploadCloud, AlertCircle, FileSpreadsheet, CheckCircle, Download } from 'lucide-react';
import { db } from '../lib/store';
import Papa from 'papaparse';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function CsvImportModal({ isOpen, onClose, onImportComplete }: CsvImportModalProps) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Map, 3: Success
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, dups: 0, errors: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = [
      ["subject", "examId", "topic", "difficulty", "text", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "explanation"],
      ["English", "", "Grammar", "easy", "What is a noun?", "Action word", "Naming word", "Describing word", "Connecting word", "B", "A noun is a naming word."],
      ["Mathematics", "", "Algebra", "medium", "Solve 2x = 4", "1", "2", "3", "4", "B", "Divide both sides by 2."]
    ];
    const csvContent = template.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cbt_questions_template.csv";
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        setError("Please upload a valid CSV file.");
        return;
      }
      setFile(selected);
      setError(null);
      parseFile(selected);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError("Failed to parse CSV. Please check the format.");
          return;
        }
        if (results.data.length === 0) {
          setError("The CSV file is empty.");
          return;
        }
        setCsvData(results.data);
        setStep(2);
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  const processImport = async () => {
    setStep(3);
    let success = 0;
    let dups = 0;
    let errors = 0;
    const existingQuestions = db.getQuestions();
    
    // Process in batches incrementally to show progress optionally (or just fast)
    for (let i = 0; i < csvData.length; i++) {
       const row = csvData[i];
       setImportProgress(Math.round(((i + 1) / csvData.length) * 100));
       
       if (!row.subject || !row.text || !row.optionA || !row.optionB || !row.correctAnswer) {
         errors++;
         continue;
       }

       // Basic dup check (same subject and exact same question text)
       const isDup = existingQuestions.some(q => q.subject.toLowerCase() === row.subject?.toLowerCase() && q.text.toLowerCase() === row.text?.toLowerCase());
       if (isDup) {
         dups++;
         continue;
       }

       const newQ = {
         id: `q_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
         subject: row.subject,
         examId: row.examId || undefined,
         topic: row.topic || '',
         difficulty: ['easy', 'medium', 'hard'].includes(row.difficulty?.toLowerCase()) ? row.difficulty.toLowerCase() : 'medium',
         text: row.text,
         options: [
           { label: 'A', text: row.optionA },
           { label: 'B', text: row.optionB },
           { label: 'C', text: row.optionC || '' },
           { label: 'D', text: row.optionD || '' }
         ],
         correctAnswer: ['A', 'B', 'C', 'D'].includes(row.correctAnswer?.toUpperCase()) ? row.correctAnswer.toUpperCase() : 'A',
         explanation: row.explanation || ''
       };
       
       db.addQuestion(newQ);
       success++;
    }
    
    setImportStats({ success, dups, errors });
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setError(null);
    setCsvData([]);
    setImportProgress(0);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-3xl shadow-2xl relative overflow-hidden bg-white">
        {(step === 1 || step === 2) && (
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-red-500 z-10 transition-colors bg-white rounded-full shadow-sm hover:shadow">
            <X className="w-5 h-5" />
          </button>
        )}
        
        {step === 1 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Import CSV Questions</h2>
              <p className="text-slate-500 mt-2">Upload a CSV file to bulk import questions into the Question Bank.</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
               <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mb-4 transition-colors" />
               <p className="font-semibold text-slate-700 text-lg mb-1">Click to select CSV file</p>
               <p className="text-xs text-slate-400">Limit 1000 rows per import</p>
               <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <button onClick={handleDownloadTemplate} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto">
                <Download className="w-4 h-4" /> Download Sample CSV Template
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 shrink-0">
               <h2 className="text-xl font-bold text-slate-800">Preview & Confirm</h2>
               <p className="text-sm text-slate-500">Found {csvData.length} records. Please review a sample before importing.</p>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
               <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white shadow-sm">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-slate-100 text-slate-600">
                     <tr>
                       <th className="p-3 font-semibold border-b border-slate-200">Subject</th>
                       <th className="p-3 font-semibold border-b border-slate-200">Question</th>
                       <th className="p-3 font-semibold border-b border-slate-200">Option A</th>
                       <th className="p-3 font-semibold border-b border-slate-200">Cor. Ans</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {csvData.slice(0, 5).map((row, i) => (
                       <tr key={i} className="hover:bg-slate-50">
                         <td className="p-3 text-indigo-700 font-medium">{row.subject || 'Missing'}</td>
                         <td className="p-3 truncate max-w-[200px]" title={row.text}>{row.text || 'Missing'}</td>
                         <td className="p-3 truncate max-w-[150px] text-slate-500">{row.optionA}</td>
                         <td className="p-3 font-bold text-slate-700">{row.correctAnswer}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               {csvData.length > 5 && (
                 <p className="text-center text-xs text-slate-400 mt-3 italic">+ {csvData.length - 5} more rows not shown</p>
               )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-between">
               <Button variant="outline" onClick={reset}>Go Back</Button>
               <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" onClick={processImport}>
                 Import {csvData.length} Questions
               </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-10 text-center">
             {importProgress < 100 ? (
                <div className="py-12">
                   <h3 className="text-xl font-bold text-slate-800 mb-6">Processing...</h3>
                   <div className="w-full max-w-sm bg-slate-100 h-3 rounded-full overflow-hidden mx-auto">
                     <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                   </div>
                   <p className="text-sm font-medium text-slate-500 mt-4">{importProgress}% Complete</p>
                </div>
             ) : (
                <div className="py-6">
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                     <CheckCircle className="w-10 h-10" />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800 mb-2">Import Successful!</h3>
                   <p className="text-slate-500 mb-8 max-w-sm mx-auto">Questions have been added to the Question Bank and are ready to be used in exams.</p>
                   
                   <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                         <div className="text-3xl font-black text-green-600">{importStats.success}</div>
                         <div className="text-xs font-semibold text-slate-500 uppercase">Imported</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                         <div className="text-3xl font-black text-amber-500">{importStats.dups}</div>
                         <div className="text-xs font-semibold text-slate-500 uppercase">Duplicates</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                         <div className="text-3xl font-black text-red-500">{importStats.errors}</div>
                         <div className="text-xs font-semibold text-slate-500 uppercase">Errors</div>
                      </div>
                   </div>
                   
                   <Button onClick={() => { onImportComplete(); onClose(); }} className="w-full max-w-xs bg-slate-800 hover:bg-slate-900 shadow">
                     Return to Manage Questions
                   </Button>
                </div>
             )}
          </div>
        )}

      </Card>
    </div>
  );
}
