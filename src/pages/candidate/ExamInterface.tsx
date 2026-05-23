import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, MonitorX, Flag, Menu, X, CheckCircle2, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { db } from '../../lib/store';
import { Question } from '../../types';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../components/AuthProvider';
import { formatTime, cn } from '../../lib/utils';
import { Card } from '../../components/ui/card';

export default function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [examObj, setExamObj] = useState<any>(null);
  
  // Submit Modal & States
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'confirming' | 'submitting'>('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load Exam
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, videoRef]);

  useEffect(() => {
    if (!examId) return;
    const exam = db.getExams().find(e => e.id === examId);
    if (!exam) {
      alert("Exam not found!");
      navigate('/candidate/exams');
      return;
    }
    setExamObj(exam);
    
    let existingSession = db.getSessions().find(s => s.examId === examId && s.candidateId === user?.id && s.status === 'in_progress');
    let sessionQuestions: Question[] = [];

    if (existingSession && existingSession.shuffledQuestions && existingSession.shuffledQuestions.length > 0) {
      sessionQuestions = existingSession.shuffledQuestions;
      if (existingSession.answers) {
        setAnswers(existingSession.answers);
      }
    } else {
      sessionQuestions = db.generateShuffledQuestions(examId);
      if (sessionQuestions.length === 0) {
        alert("No questions available for this exam. Please contact the administrator to assign questions.");
        navigate('/candidate/exams');
        return;
      }
      
      const newSession = {
        id: `sess_${Date.now()}`,
        examId: examId,
        candidateId: user?.id || 'unknown',
        startTime: new Date().toISOString(),
        answers: {},
        status: 'in_progress' as any,
        shuffledQuestions: sessionQuestions
      };
      db.saveSession(newSession);
    }
    
    setQuestions(sessionQuestions);
    setTimeLeft(exam.durationMinutes * 60);

    // Instead of auto-starting, remain in init state (hasReadInstructions = false)
    setExamStarted(true); // Technically questions are ready, but we use hasReadInstructions to gate the UI.
    
    const handleBlur = () => {
      if (!hasReadInstructions || db.getSettings().antiCheatingEnabled === false) return;
      
      db.saveViolation({
        id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        candidateId: user?.id || 'unknown',
        examId: examId,
        timestamp: new Date().toISOString(),
        type: 'blur',
        description: 'Candidate switched tabs or minimized the browser'
      });
    };

    const handleVisibilityChange = () => {
      if (!hasReadInstructions || document.visibilityState === 'visible' || db.getSettings().antiCheatingEnabled === false) return;
        db.saveViolation({
          id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          candidateId: user?.id || 'unknown',
          examId: examId,
          timestamp: new Date().toISOString(),
          type: 'visibility_hidden',
          description: 'Candidate minimized the browser or switched to another app'
        });
    };

    const handleFullscreenChange = () => {
      if (!hasReadInstructions || db.getSettings().antiCheatingEnabled === false) return;
      if (!document.fullscreenElement) {
        db.saveViolation({
          id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          candidateId: user?.id || 'unknown',
          examId: examId,
          timestamp: new Date().toISOString(),
          type: 'fullscreen_exited',
          description: 'Candidate exited fullscreen mode'
        });
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [examId, navigate, user?.id, hasReadInstructions]);

  useEffect(() => {
    if (!hasReadInstructions || !examStarted || timeLeft <= 0 || submitStatus === 'submitting') {
      if (timeLeft <= 0 && examStarted && hasReadInstructions && submitStatus === 'idle') {
        handleSubmit();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examStarted, hasReadInstructions, submitStatus]);

  const handleSubmit = useCallback(async () => {
    setSubmitStatus('submitting');
    
    // Simulate auto-save delay
    await new Promise(r => setTimeout(r, 1000));

    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score++;
    });

    const percentage = Math.round((score / Math.max(1, questions.length)) * 100);
    let remarks = "More practice and revision are recommended for better performance.";
    if (percentage >= 75) {
      remarks = "Excellent performance. Keep maintaining this outstanding result.";
    } else if (percentage >= 50) {
      remarks = "Good effort. More focus on weaker subjects can improve overall performance.";
    }

    const result = {
      id: `res_${Date.now()}`,
      sessionId: `sess_${Date.now()}`,
      candidateId: user?.id || 'unknown',
      examId: examId!,
      score: score * 10,
      total: questions.length * 10,
      grade: `${percentage}%`,
      percentage,
      remarks,
      date: new Date().toISOString()
    };
    
    let existingSession = db.getSessions().find(s => s.examId === examId && s.candidateId === user?.id && s.status === 'in_progress');
    if (existingSession) {
      existingSession.status = 'completed';
      existingSession.endTime = new Date().toISOString();
      existingSession.answers = answers;
      result.sessionId = existingSession.id;
      db.saveSession(existingSession);
    }
    db.saveResult(result);
    navigate('/candidate/results');
  }, [answers, questions, user, examId, navigate]);

  if (!examStarted) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Initializing Secure Exam Environment...</div>;

  if (examStarted && !hasReadInstructions && examObj) {
    const handleStart = async () => {
      // Prompt for camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        setWebcamEnabled(true);
        setStream(stream);

        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        }
        setHasReadInstructions(true);
      } catch (err) {
         alert("Camera access is required for this examination. Please allow camera permissions and try again.");
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl overflow-hidden shadow-2xl border-0 ring-1 ring-slate-200">
          <div className="bg-slate-900 border-b border-slate-800 text-white p-6 md:p-8 text-center">
            <h1 className="text-3xl font-black tracking-tight mb-2 uppercase text-white">{examObj.title}</h1>
            <p className="text-slate-400 font-medium">{examObj.subjects.join(', ')}</p>
          </div>
          <div className="p-6 md:p-10 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Duration</p>
                <p className="text-lg font-black text-slate-800">{examObj.durationMinutes} Mins</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Questions</p>
                <p className="text-lg font-black text-slate-800">{questions.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Marks</p>
                <p className="text-lg font-black text-slate-800">{questions.length * 10}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Format</p>
                <p className="text-lg font-black text-slate-800">{examObj.gradingSystem}</p>
              </div>
            </div>

            <div className="mb-8">
               <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Exam Instructions & Rules</h2>
               <div className="prose prose-sm max-w-none text-slate-600 space-y-3">
                 {examObj.instructions ? (
                    <p className="whitespace-pre-wrap">{examObj.instructions}</p>
                 ) : (
                    <>
                      <p>1. Camera and microphone access are mandatory. You are being recorded and monitored live.</p>
                      <p>2. Do not refresh the page or attempt to minimize the browser window.</p>
                      <p>3. This exam is strictly proctored. AI-driven anti-cheating engines are active silently.</p>
                      <p>4. You can navigate between questions using the numbers on the side panel.</p>
                      <p>5. Time will be automatically tracked in the top center.</p>
                    </>
                 )}
               </div>
            </div>
            
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 mb-8 text-red-800">
               <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
               <p className="text-sm">Once you begin, the timer cannot be paused. Make sure you are completely ready. Closing this tab will terminate your session and submit your current answers automatically.</p>
            </div>

            <Button onClick={handleStart} className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
              START EXAM (REQUIRES CAMERA)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return <div className="p-8">No questions assigned to this exam.</div>;

  const toggleFlag = () => {
    const newFlags = new Set(flags);
    if (newFlags.has(currentQ.id)) newFlags.delete(currentQ.id);
    else newFlags.add(currentQ.id);
    setFlags(newFlags);
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white p-3 md:p-4 flex justify-between items-center z-20 shrink-0 shadow-sm relative">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-300 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt="Candidate" className="w-10 h-10 md:w-12 md:h-12 rounded object-cover border-2 border-white/20" />
          <div className="hidden sm:block">
            <h2 className="font-bold text-sm md:text-base leading-tight">{user?.name}</h2>
            <p className="text-xs text-amber-400 font-mono tracking-wider">{user?.serialNumber || user?.id.split('_')[1]}</p>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center px-4 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 w-32 md:w-auto">
           <h1 className="text-sm md:text-lg font-extrabold uppercase tracking-widest text-white truncate max-w-full text-center">
             {db.getExams().find(e => e.id === examId)?.title}
           </h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex flex-col items-end md:items-center">
            <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-0.5">Time Left</span>
            <div className={cn(
              "text-lg md:text-2xl font-mono px-3 md:px-4 py-0.5 md:py-1 rounded font-bold border-2 min-w-[70px] text-center",
              timeLeft < 300 ? "text-red-400 border-red-500/50 bg-red-950/30 animate-pulse" : "text-white border-indigo-500/30 bg-slate-800"
            )}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <Button 
            className="hidden sm:flex bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border-0 shadow-md shadow-red-900/20" 
            onClick={() => setSubmitStatus('confirming')}
          >
            SUBMIT EXAM
          </Button>
        </div>
      </header>
      
      {/* Mobile Submit Button (Sticky) */}
      <div className="sm:hidden w-full bg-slate-900 p-2 border-t border-slate-800 z-10 shrink-0">
        <Button 
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500" 
          onClick={() => setSubmitStatus('confirming')}
        >
          SUBMIT EXAM
        </Button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Navigation Sidebar (Drawer on Mobile, Fixed on Desktop) */}
        <div className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-[280px] md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 shadow-2xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-800 text-sm">Navigation Matrix</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Answered: {answeredCount} / {questions.length}</p>
            </div>
            <button className="md:hidden text-slate-400 p-1" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5"/>
            </button>
          </div>
          
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex gap-3 justify-center text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Done</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Empty</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Flag</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlagged = flags.has(q.id);
                const isCurrent = idx === currentIndex;
                
                let btnClass = "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50";
                if (isCurrent) btnClass = "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-200 ring-offset-1";
                else if (isFlagged) btnClass = "bg-orange-50 border-orange-300 text-orange-700 font-semibold";
                else if (isAnswered) btnClass = "bg-green-50 border-green-300 text-green-700 font-semibold";

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={cn("h-10 w-full rounded-lg border flex items-center justify-center text-sm transition-all relative", btnClass)}
                  >
                    {idx + 1}
                    {isFlagged && <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-l-[10px] border-t-orange-500 border-l-transparent rounded-tr-md"></div>}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Proctoring Active
              </span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            <div className="w-full h-32 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-slate-300 text-xs border border-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-600 to-rose-600 w-full animate-[progress_2s_ease-in-out_infinite] opacity-50 z-10"></div>
                {!stream && (
                  <>
                    <Video className="w-6 h-6 mb-2 opacity-50 text-indigo-400" />
                    <span className="text-indigo-200">Starting Stream...</span>
                  </>
                )}
            </div>
          </div>
        </div>
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Right Side: Question Display */}
        <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden h-full">
          
          <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col min-h-full">
              
              {/* Question Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="inline-flex px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-wider rounded-md border border-indigo-200">
                  {currentQ.subject}
                </div>
                <button 
                  onClick={toggleFlag}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border", 
                    flags.has(currentQ.id) 
                      ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Flag className={cn("w-4 h-4", flags.has(currentQ.id) ? "fill-orange-500 text-orange-500" : "")} /> 
                  <span className="hidden sm:inline">{flags.has(currentQ.id) ? 'Review Flagged' : 'Flag Question'}</span>
                  <span className="sm:hidden">Flag</span>
                </button>
              </div>

              {/* Question Content */}
              <Card className="shadow-sm border border-slate-200 mb-6 bg-white overflow-visible">
                <div className="p-5 md:p-8 flex gap-3 md:gap-5">
                  <div className="text-2xl md:text-3xl font-extrabold text-indigo-900/30 shrink-0 select-none pt-0.5 md:pt-0">
                    Q{currentIndex + 1}.
                  </div>
                  <div className="text-base md:text-xl leading-relaxed text-slate-800 font-medium">
                    {currentQ.text}
                  </div>
                </div>
              </Card>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-3 md:gap-4 pb-8 flex-1">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => {
                        const newAnswers = { ...answers, [currentQ.id]: opt.label };
                        setAnswers(newAnswers);
                        // Save to session immediately
                        let existingSession = db.getSessions().find(s => s.examId === examId && s.candidateId === user?.id && s.status === 'in_progress');
                        if (existingSession) {
                          existingSession.answers = newAnswers;
                          db.saveSession(existingSession);
                        }
                      }}
                      className={cn(
                        "flex items-start text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 w-full group",
                        isSelected 
                          ? "bg-indigo-50/50 border-indigo-500 shadow-[0_2px_10px_-3px_rgba(99,102,241,0.2)]" 
                          : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm"
                      )}
                    >
                      <span className={cn(
                        "flex flex-col items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 text-sm md:text-base font-bold mr-4 md:mr-5 shrink-0 transition-colors",
                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-300 text-slate-500 group-hover:border-indigo-300 group-hover:text-indigo-600"
                      )}>
                        {opt.label}
                      </span>
                      <span className="text-sm md:text-base text-slate-700 leading-relaxed mt-1 md:mt-2 font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Bottom Navigation */}
          <div className="bg-white border-t border-slate-200 p-3 md:p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10 w-full">
            <div className="max-w-4xl mx-auto flex justify-between items-center w-full">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(i => i - 1)}
                className="w-[100px] md:w-32 text-slate-600 h-10 md:h-12"
              >
                <ChevronLeft className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Previous</span>
              </Button>
              <div className="text-xs md:text-sm font-semibold text-slate-400 tabular-nums">
                {currentIndex + 1} / {questions.length}
              </div>
              <Button
                disabled={currentIndex === questions.length - 1}
                onClick={() => {
                  setCurrentIndex(i => i + 1);
                  // Optional: if it is the last question, we could replace 'Next' with 'Submit' 
                  // but we already have Submit globally in header.
                }}
                className="w-[100px] md:w-32 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-10 md:h-12"
              >
                <span className="hidden md:inline">Next</span> <ChevronRight className="w-4 h-4 ml-1 md:ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {submitStatus !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl relative overflow-hidden bg-white border-0">
             {submitStatus === 'confirming' ? (
                <div className="p-6 md:p-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-100 text-red-600 flex items-center justify-center rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Submit?</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-[260px]">
                    You have answered <strong className="text-slate-800">{answeredCount}</strong> out of <strong className="text-slate-800">{questions.length}</strong> questions. Time remaining: {formatTime(timeLeft)}.
                  </p>
                  
                  <div className="flex gap-3 w-full">
                     <Button 
                       variant="outline" 
                       className="flex-1" 
                       onClick={() => setSubmitStatus('idle')}
                     >
                       Return to Exam
                     </Button>
                     <Button 
                       className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow" 
                       onClick={handleSubmit}
                     >
                       Confirm Submit
                     </Button>
                  </div>
                </div>
             ) : (
                <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <h3 className="text-lg font-bold text-slate-800">Processing Submission</h3>
                  <p className="text-slate-500 text-sm mt-2">Please do not close this window...</p>
                </div>
             )}
          </Card>
        </div>
      )}

    </div>
  );
}

