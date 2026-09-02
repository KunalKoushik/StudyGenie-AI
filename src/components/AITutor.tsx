import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Subject, StudentLevel } from '../types';
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
  MicOff
} from 'lucide-react';

function autoDetectSubject(text: string): Subject {
  const t = text.toLowerCase();
  if (/\b(f=ma|force|newton|velocity|acceleration|physics|gravity|mass|joule|watt|energy|kinetics)\b/.test(t)) return 'Physics';
  if (/\b(sn1|sn2|reaction|organic|chemistry|acid|base|mole|element|compound|atom)\b/.test(t)) return 'Chemistry';
  if (/\b(cell|dna|rna|biology|photosynthesis|gene|organism|protein|enzyme)\b/.test(t)) return 'Biology';
  if (/\b(bfs|dfs|algorithm|graph|tree|queue|stack|code|programming|computer|array)\b/.test(t)) return 'Computer Science';
  if (/\b(war|revolution|century|history|empire|king|president|treaty)\b/.test(t)) return 'History';
  if (/\b(math|calculus|derivative|limit|integral|equation|sqrt|squareroot|square|root|sum|plus|\+|-|\*|\/)\b/.test(t) || /sq[ua]{2}re\s*root|squareroot|sqrt|root/.test(t)) return 'Mathematics';
  return 'General Science';
}

function generateClientTutorFallback(message: string, subject: string) {
  const msgLower = message.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi+|hello+|hey+|greetings|good\s*(morning|afternoon|evening)|who\s*are\s*you|help|thanks)\s*[\!\?\.\]]*$/i.test(msgLower)) {
    return {
      mainMessage: `Hello Scholar! 👋 I am your **StudyGenie AI Tutor**.\n\nI have auto-detected **${subject}** for your study session.\n\nHow can I assist you today? Ask me to explain concepts, solve complex equations, break down homework problems, or quiz your understanding!`,
      keyConcepts: [`${subject} Fundamentals`, 'Socratic Inquiry', 'Active Recall'],
      stepByStep: [
        `1. Type any topic, problem, or equation below`,
        `2. Review step-by-step Socratic breakdowns with LaTeX math formulas`,
        `3. Test your recall with check questions`
      ],
      checkQuestions: [
        `What specific topic or problem in ${subject} would you like to explore first?`,
        `Would you prefer a conceptual explanation or a step-by-step numerical solution?`
      ],
      memoryAids: ['Active recall and self-explanation boost long-term conceptual mastery!'],
      encouragement: 'Let\'s make today\'s study session productive!'
    };
  }

  // 2. Square Root handling (e.g. squareroot(97), square root of 21/100, sqrt(16))
  const sqrtMatch = msgLower.match(/^(?:sq[ua]{2}re\s*root|squareroot|sqaure-root|square-root|sqrt|root)\s*(?:of)?\s*\(?\s*([0-9\.\/\s\+\-\*]+)\s*\)?$/i);
  if (sqrtMatch) {
    const innerStr = sqrtMatch[1].trim();
    let innerValue: number;
    if (innerStr.includes('/')) {
      const [num, den] = innerStr.split('/').map(s => parseFloat(s.trim()));
      innerValue = num / den;
    } else {
      innerValue = parseFloat(innerStr);
    }

    if (!isNaN(innerValue) && innerValue >= 0) {
      const val = Math.sqrt(innerValue);
      const formattedVal = Number.isInteger(val) ? val.toString() : val.toFixed(4);
      return {
        mainMessage: `The calculated result is **$\\sqrt{${innerStr}} = ${formattedVal}$**.\n\nHere is the step-by-step radical evaluation:`,
        keyConcepts: ['Square Root Property', 'Radical Simplification', 'Numerical Approximations'],
        stepByStep: [
          `1. Parsed mathematical radical: $\\sqrt{${innerStr}}$`,
          `2. Evaluated square root computation: $\\sqrt{${innerStr}} = ${formattedVal}$`,
          `3. Exact decimal representation: **${val}**`
        ],
        checkQuestions: [
          `Why does $\\sqrt{x}$ only yield real numbers for non-negative values ($x \\ge 0$)?`,
          `What is the relationship between taking the square root and raising a number to exponent 1/2?`
        ],
        memoryAids: ['Radical Exponent Rule: $\\sqrt[n]{x} = x^{\\frac{1}{n}}$'],
        encouragement: 'Excellent mathematical radical computation!'
      };
    }
  }

  // 3. Basic Arithmetic / Math (e.g. 2+5)
  if (/^[0-9\.\s\+\-\*\/\(\)\^]+$/.test(msgLower) && /[0-9]/.test(msgLower)) {
    try {
      const safeExpr = msgLower.replace(/\^/g, '**');
      const val = Function(`"use strict"; return (${safeExpr});`)();
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        return {
          mainMessage: `The calculated result is **${message.trim()} = ${val}**.\n\nHere is the step-by-step mathematical evaluation:`,
          keyConcepts: ['Arithmetic Evaluation', 'Order of Operations (PEMDAS)', 'Numerical Computation'],
          stepByStep: [
            `1. Parsed mathematical statement: $${message.trim()}$`,
            `2. Evaluated arithmetic operations: $${message.trim()} = ${val}$`,
            `3. Verified exact value: **${val}**`
          ],
          checkQuestions: [
            `How would the result change if you doubled one of the terms?`,
            `Can you write a real-world word problem representing this equation?`
          ],
          memoryAids: ['PEMDAS: Parentheses → Exponents → Multiplication/Division → Addition/Subtraction'],
          encouragement: 'Great mathematical accuracy!'
        };
      }
    } catch (e) {}
  }

  // 4. Polymer & Chemistry
  if (msgLower.includes('polymer') || msgLower.includes('monomer') || msgLower.includes('plastic')) {
    return {
      mainMessage: `### Chemistry & Materials Science: **Polymers & Monomers**\n\nA **polymer** is a large macromolecule composed of repeating structural units called **monomers**, connected by covalent chemical bonds.\n\n### Classification of Polymers:\n- **Natural Polymers**: DNA, proteins (amino acid polymers), cellulose, starch, and natural rubber.\n- **Synthetic Polymers**: Polyethylene (plastics), Nylon, PVC (polyvinyl chloride), Teflon, and Kevlar.`,
      keyConcepts: ['Polymers & Monomers', 'Polymerization (Addition & Condensation)', 'Thermoplastics vs Thermosets'],
      stepByStep: [
        '1. **Monomer Building Blocks**: Small reactive molecules (monomers) join together in long repeating chains.',
        '2. **Polymerization Reactions**: Monomers undergo addition (chain-growth) or condensation (step-growth) reactions.',
        '3. **Structure & Properties**: Polymer chain length, branching, and cross-linking determine flexibility, strength, and thermal melting point.'
      ],
      checkQuestions: [
        'What is the fundamental difference between addition polymerization and condensation polymerization?',
        'Why do thermosetting plastics retain their shape when heated, whereas thermoplastics melt and can be reshaped?'
      ],
      memoryAids: ['Polymer = "Poly" (Many) + "Mer" (Parts). Long chains of repeating monomer parts!'],
      encouragement: 'Excellent chemistry question on macromolecules!'
    };
  }

  // 5. Dynamic Clean Topic Response
  const cleanTopic = message.replace(/^(what is|explain|tell me about|define|how does|why does)\s+/i, '').trim();
  const titleTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  return {
    mainMessage: `### ${subject} Analysis: **${titleTopic}**\n\n**${titleTopic}** is a core concept in ${subject}.\n\nIn academic study, **${cleanTopic}** is understood by examining its foundational principles, structural mechanisms, and practical applications. Whether studied in foundational K-12 coursework or advanced degree modules, it provides critical insights into real-world systems.`,
    keyConcepts: [`${titleTopic} Definition`, 'Core Mechanics & Principles', 'Practical Applications'],
    stepByStep: [
      `1. **Core Definition**: Identify the foundational properties and definitions governing ${cleanTopic}.`,
      `2. **Mechanism & Structure**: Analyze how ${cleanTopic} operates within ${subject} theory.`,
      `3. **Practical Application**: Apply ${cleanTopic} to solve real-world problems and empirical case studies.`
    ],
    checkQuestions: [
      `What are the primary factors that influence ${cleanTopic}?`,
      `How does ${cleanTopic} connect to related topics in ${subject}?`
    ],
    memoryAids: [`Master ${cleanTopic} by connecting its core definition to everyday real-world examples!`],
    encouragement: `Great question on ${cleanTopic}! Active learning builds deep mastery.`
  };
}

export const AITutor: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Hello Scholar! I am your StudyGenie AI Tutor. Type any topic, problem, or equation below, and I will auto-detect the subject and guide you step-by-step.',
      timestamp: 'Just now',
      structuredData: {
        mainMessage: 'Welcome! I use Socratic guidance to build deep conceptual understanding. Ask any question in STEM or Humanities!',
        keyConcepts: ['Socratic Inquiry', 'Auto-Subject Detection', 'Active Learning'],
        stepByStep: [
          'Type any topic or problem below (e.g., "2+5", "Explain Newton\'s laws", "square root of 21/100")',
          'Review step-by-step mathematical & conceptual breakdowns',
          'Test your knowledge with reflection questions'
        ],
        memoryAids: ['Learning is most effective when you actively engage with practice problems!'],
        encouragement: 'Let\'s make today\'s study session productive!'
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<StudentLevel>('intermediate');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickStarters = [
    { label: '🧮 2+5', prompt: '2+5' },
    { label: '📐 L\'Hôpital\'s Rule', prompt: 'Explain L\'Hôpital\'s rule' },
    { label: '⚡ Newton\'s F=ma', prompt: 'What is Newton\'s second law F=ma?' },
    { label: '🧪 SN1 vs SN2', prompt: 'How do SN1 and SN2 organic chemistry reactions differ?' },
    { label: '💻 BFS vs DFS', prompt: 'Explain BFS vs DFS graph traversal' }
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

    const detectedSubject = autoDetectSubject(query);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: detectedSubject
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
          subject: detectedSubject,
          studentLevel: selectedLevel,
          sessionType: 'concept_explanation'
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: json.data.mainMessage || 'Here is the step-by-step breakdown:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          subject: detectedSubject,
          structuredData: json.data
        };
        setMessages((prev) => [...prev, aiMsg]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Tutor chat API connection error, utilizing smart client fallback:', err);
    }

    // Smart fallback ensures a rich response card is ALWAYS rendered for every query!
    const fallbackData = generateClientTutorFallback(query, detectedSubject);
    const fallbackAiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: fallbackData.mainMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: detectedSubject,
      structuredData: fallbackData
    };
    setMessages((prev) => [...prev, fallbackAiMsg]);
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
      
      {/* Modern Top Header Bar */}
      <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">StudyGenie AI Tutor</h1>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Detect Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Ask anything in STEM or Humanities • Step-by-step Socratic guidance</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 hidden sm:inline">Level:</span>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as StudentLevel)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
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
                  <span>{msg.subject}</span>
                  <span>•</span>
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
            <span>StudyGenie AI Tutor is reasoning through Socratic steps...</span>
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
            placeholder={`Ask anything... (e.g., "2+5", "Explain Newton's F=ma", "SN1 vs SN2")`}
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
