import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, EducationContext, EducationStage, RAGSource } from '../types';
import { MathRenderer } from './MathRenderer';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Lightbulb, 
  CheckCircle, 
  Volume2, 
  Copy, 
  RefreshCw,
  BookOpen,
  Mic,
  MicOff,
  GraduationCap,
  Zap,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const STAGE_OPTIONS: { stage: EducationStage; label: string; exam?: string; icon: string }[] = [
  { stage: 'secondary_10', label: 'Class 10 CBSE', icon: '🏫' },
  { stage: 'senior_secondary_12', label: 'Class 12 Science', icon: '🧪' },
  { stage: 'competitive_exam', label: 'UPSC CSE (Civil Services)', exam: 'UPSC_CSE', icon: '🏛️' },
  { stage: 'undergraduate_y2', label: 'Undergraduate CS & IT', icon: '💻' },
  { stage: 'nursery', label: 'Nursery & Primary (K-5)', icon: '🎈' }
];

export const AITutor: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [selectedContext, setSelectedContext] = useState<EducationContext>({
    stage: 'secondary_10',
    board: 'CBSE',
    stream: 'General'
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Hello Scholar! I am your StudyGenie AI Tutor powered by server-side AI classification, RAG curriculum retrieval, and instant caching.',
      timestamp: 'Just now',
      structuredData: {
        mainMessage: 'Welcome! I provide grounded Socratic guidance across all academic levels — from **Nursery & K-5** to **Class 10/12 CBSE**, **Undergraduate Degrees**, and **UPSC CSE Civil Services**.',
        keyConcepts: ['Server-Side AI Classification', 'NCERT & UPSC RAG Grounding', 'Instant Caching'],
        stepByStep: [
          'Select your target academic stage above (e.g., "Class 10 CBSE", "UPSC CSE")',
          'Ask any topic, formula, or exam question below',
          'Review step-by-step Socratic breakdowns with verified sources and citations'
        ],
        memoryAids: ['Learning is most effective when grounded in verified curriculum standards!'],
        encouragement: 'Let\'s make today\'s study session productive!'
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickStarters = [
    { label: '🏛️ Article 21 & Supreme Court', prompt: 'Explain Article 21 Right to Life and Supreme Court landmark judgments' },
    { label: '🧮 2+5', prompt: '2+5' },
    { label: '📐 squareroot(97)', prompt: 'squareroot(97)' },
    { label: '🧪 What is Polymer?', prompt: 'What is polymer and how does polymerization work?' },
    { label: '💻 BFS vs DFS Graph', prompt: 'Explain BFS vs DFS graph traversal algorithms' }
  ];

  const handleListen = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser window.');
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      educationContext: selectedContext
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          educationContext: selectedContext
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: json.data.mainMessage || 'Here is the step-by-step breakdown:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          subject: json.classification?.subject || json.data.subject,
          structuredData: {
            ...json.data,
            cached: json.cached,
            cacheType: json.cacheType,
            sources: json.data.sources || [],
            grounded: json.data.grounded
          }
        };
        setMessages((prev) => [...prev, aiMsg]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Tutor chat API connection error:', err);
    }

    // Client fallback ensures a response is rendered even if network is offline
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `### Academic Analysis: **${query}**\n\nHere is a structured explanation for **${query}**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structuredData: {
        mainMessage: `### Academic Breakdown: **${query}**\n\nHere is the foundational analysis for **${query}**.`,
        keyConcepts: ['Core Analysis', 'Socratic Inquiry'],
        stepByStep: [
          '1. Define foundational terms',
          '2. Analyze structural mechanisms',
          '3. Apply to practical problem solving'
        ],
        checkQuestions: ['What are the core principles behind this concept?'],
        memoryAids: ['Master concepts through active practice!'],
        grounded: false
      }
    };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[\$\#\*]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Modern Top Context Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">StudyGenie AI Tutor</h1>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Server Classification & RAG Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Nursery to Bachelor's & UPSC CSE • Grounded Curriculum Guidance</p>
          </div>
        </div>

        {/* Academic Stage Selector Chip */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Target:</span>
          </span>
          <select
            value={selectedContext.stage}
            onChange={(e) => {
              const opt = STAGE_OPTIONS.find((s) => s.stage === e.target.value);
              setSelectedContext({
                stage: e.target.value as EducationStage,
                board: opt?.stage === 'secondary_10' || opt?.stage === 'senior_secondary_12' ? 'CBSE' : 'University',
                exam: opt?.exam as any
              });
            }}
            className="bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.stage} value={opt.stage}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* User Message */}
            {msg.sender === 'user' && (
              <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-none p-4 shadow-lg space-y-1">
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-end gap-2 text-[10px] text-indigo-200 opacity-80 font-semibold">
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            )}

            {/* AI Socratic Response Card */}
            {msg.sender === 'ai' && (
              <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                
                {/* AI Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">StudyGenie AI Tutor</span>
                        {msg.structuredData?.cached && (
                          <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>⚡ Instant ({msg.structuredData.cacheType === 'exact' ? 'Exact Cache' : 'Semantic Cache'})</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{msg.timestamp} {msg.subject ? `• ${msg.subject}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeak(msg.structuredData?.mainMessage || msg.text)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        isSpeaking
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.structuredData?.mainMessage || msg.text)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs"
                      title="Copy response"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Explanation Message */}
                <div className="text-slate-100 text-sm leading-relaxed space-y-2">
                  <MathRenderer content={msg.structuredData?.mainMessage || msg.text} />
                </div>

                {/* Grounded Citation Source Chips */}
                {msg.structuredData?.sources && msg.structuredData.sources.length > 0 && (
                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verified Curriculum & Syllabus Citations</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.structuredData.sources.map((src: RAGSource, idx: number) => (
                        <a
                          key={idx}
                          href={src.sourceUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Concepts Pills */}
                {msg.structuredData?.keyConcepts && msg.structuredData.keyConcepts.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Key Concepts Covered:</span>
                    <div className="flex flex-wrap gap-2">
                      {msg.structuredData.keyConcepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step-by-Step Breakdown Accordion/List */}
                {msg.structuredData?.stepByStep && msg.structuredData.stepByStep.length > 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Step-by-Step Socratic Breakdown</span>
                    </span>
                    <div className="space-y-2 pt-1">
                      {msg.structuredData.stepByStep.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">
                            <MathRenderer content={step.replace(/^(\d+[\.\)]\s*|step\s*\d+:\s*)/i, '')} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Memory Aids & Encouragement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {msg.structuredData?.memoryAids && msg.structuredData.memoryAids.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-amber-400 block">Memory Aid & Mnemonic</span>
                        <p className="text-xs text-amber-200/90">{msg.structuredData.memoryAids.join(' • ')}</p>
                      </div>
                    </div>
                  )}

                  {msg.structuredData?.encouragement && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 block">Tutor Encouragement</span>
                        <p className="text-xs text-emerald-200/90">{msg.structuredData.encouragement}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-indigo-300 text-xs font-semibold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Classifying inquiry, checking semantic cache & searching curriculum RAG sources...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Starter Suggestion Pills above input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Try Asking:</span>
          {quickStarters.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              className="px-3 py-1.5 bg-slate-950/80 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="sticky bottom-4 bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
          <button
            onClick={handleListen}
            className={`p-2.5 rounded-xl border text-xs transition-all ${
              isListening
                ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Dictate question with voice"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask anything... (e.g., "Article 21 Supreme Court", "2+5", "Polymer definition")`}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
