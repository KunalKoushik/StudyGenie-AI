import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Subject, StudentLevel, SessionType } from '../types';
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
  HelpCircle,
  BrainCircuit,
  Mic,
  MicOff
} from 'lucide-react';

export const AITutor: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Hello Scholar! I am your StudyGenie AI Tutor. Select a subject and session type above, then ask any question or concept you would like to explore!',
      timestamp: 'Just now',
      structuredData: {
        mainMessage: 'Welcome! I use the Socratic method to help you discover deep conceptual understanding through step-by-step guidance.',
        keyConcepts: ['Socratic Inquiry', 'Scaffolding', 'Active Learning'],
        stepByStep: [
          'Ask any topic, homework question, or formula (e.g., "2+5" or "Explain Newton\'s laws")',
          'Review step-by-step breakdowns and analogies',
          'Test your understanding with reflection questions'
        ],
        memoryAids: ['Learning sticks when you explain concepts in your own words!'],
        encouragement: 'Let\'s make today\'s study session productive!'
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [selectedLevel, setSelectedLevel] = useState<StudentLevel>('intermediate');
  const [sessionType, setSessionType] = useState<SessionType>('concept_explanation');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const samplePrompts = [
    '2+5',
    'Explain L\'Hôpital\'s rule with an easy analogy',
    'How do SN1 and SN2 organic chemistry reactions differ?',
    'Explain Newton\'s 2nd law F=ma and give an example problem',
    'What is the difference between BFS and DFS in algorithms?'
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
      subject: selectedSubject
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
          subject: selectedSubject,
          studentLevel: selectedLevel,
          sessionType
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: json.data.mainMessage || 'Here is the step-by-step breakdown:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          subject: selectedSubject,
          structuredData: json.data
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('Tutor chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Apologies, I encountered an issue connecting to the AI tutor service. Please check your network and try again.',
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header & Controls Panel */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Socratic AI Study Tutor</span>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30 font-semibold">
                  Guided Socratic Mode
                </span>
              </h1>
              <p className="text-xs text-slate-400">Personalized educational guidance with structured breakdowns</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Level:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as StudentLevel)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Subject & Mode Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Subject Context</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="History">History</option>
              <option value="General Science">General Science</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tutoring Focus</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="concept_explanation">Concept Explanation</option>
              <option value="problem_solving">Problem Solving</option>
              <option value="homework_help">Homework Help</option>
              <option value="exam_prep">Exam Preparation</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Quick Starters</label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {samplePrompts.slice(0, 2).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-indigo-300 text-[11px] rounded-lg border border-slate-700/60 truncate transition-all whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

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
                <div className="flex items-center justify-end gap-2 text-[10px] text-indigo-200 opacity-80">
                  <span>{msg.subject}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            )}

            {/* AI Socratic Response Card */}
            {msg.sender === 'ai' && (
              <div className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
                
                {/* AI Header */}
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">StudyGenie AI Tutor</span>
                      <p className="text-[10px] text-slate-400">{msg.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeak(msg.structuredData?.mainMessage || msg.text)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        isSpeaking
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.structuredData?.mainMessage || msg.text)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                      title="Copy response"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Explanation Message */}
                <div className="text-slate-100 text-sm leading-relaxed space-y-2">
                  <p>{msg.structuredData?.mainMessage || msg.text}</p>
                </div>

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
                  <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
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
                          <span className="leading-relaxed">{step}</span>
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
                        <span className="text-[11px] font-bold text-amber-400 block">Memory Tip / Analogy</span>
                        <p className="text-xs text-amber-200/90">{msg.structuredData.memoryAids[0]}</p>
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
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 text-indigo-300 text-xs font-semibold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>StudyGenie AI Tutor is reasoning through Socratic steps...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={handleListen}
          className={`p-2 sm:p-2.5 rounded-xl border text-xs transition-all shrink-0 ${
            isListening
              ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
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
          placeholder={`Ask anything... (e.g. "2+5", "Explain calculus")`}
          className="flex-1 bg-transparent px-2 sm:px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none min-w-0"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="px-3 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <span className="hidden sm:inline">Ask</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
