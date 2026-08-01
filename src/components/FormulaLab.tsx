import React, { useState, useEffect } from 'react';
import { CustomFormula, CustomFormulaVariable } from '../types';
import { INITIAL_CUSTOM_FORMULAS } from '../data/initialData';
import { 
  Calculator, 
  Sparkles, 
  Binary, 
  Atom, 
  Activity, 
  Zap, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Play, 
  Bookmark,
  Code2
} from 'lucide-react';

interface FormulaLabProps {
  onRecordFormulaSolved?: () => void;
}

export const FormulaLab: React.FC<FormulaLabProps> = ({ onRecordFormulaSolved }) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'algebra' | 'physics' | 'chemistry' | 'trig'>('custom');
  const [copied, setCopied] = useState(false);

  // Custom Formula Builder State
  const [customFormulas, setCustomFormulas] = useState<CustomFormula[]>(() => {
    const saved = localStorage.getItem('studygenie_custom_formulas');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_CUSTOM_FORMULAS;
  });

  const [activeFormulaTitle, setActiveFormulaTitle] = useState('Kinetic Energy');
  const [activeExpression, setActiveExpression] = useState('0.5 * m * v^2');
  const [variables, setVariables] = useState<CustomFormulaVariable[]>([
    { name: 'm', label: 'Mass', value: 10, unit: 'kg' },
    { name: 'v', label: 'Velocity', value: 5, unit: 'm/s' }
  ]);
  const [category, setCategory] = useState('Physics');

  // Quadratic equation state
  const [quadA, setQuadA] = useState<number>(1);
  const [quadB, setQuadB] = useState<number>(-5);
  const [quadC, setQuadC] = useState<number>(6);

  // Physics force state
  const [mass, setMass] = useState<number>(10);
  const [accel, setAccel] = useState<number>(9.8);

  // Chemistry concentration state
  const [moles, setMoles] = useState<number>(0.5);
  const [volume, setVolume] = useState<number>(2.0);

  // Trig Pythagorean state
  const [sideA, setSideA] = useState<number>(3);
  const [sideB, setSideB] = useState<number>(4);

  // Persist custom formulas whenever updated
  useEffect(() => {
    localStorage.setItem('studygenie_custom_formulas', JSON.stringify(customFormulas));
  }, [customFormulas]);

  // Safe Custom Formula Evaluator
  const evaluateCustomFormula = () => {
    if (!activeExpression.trim()) return { error: 'Please enter a formula expression' };

    try {
      // Replace variables in expression
      let evalExpr = activeExpression.toLowerCase();

      // Replace math operations ^ with **
      evalExpr = evalExpr.replace(/\^/g, '**');

      // Replace common math constants and functions
      evalExpr = evalExpr
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');

      // Sort variables by name length descending so 'v2' isn't accidentally matched by 'v'
      const sortedVars = [...variables].sort((a, b) => b.name.length - a.name.length);

      let substitutedStr = activeExpression;

      for (const v of sortedVars) {
        if (!v.name) continue;
        const val = Number(v.value);
        const regex = new RegExp(`\\b${v.name}\\b`, 'gi');
        evalExpr = evalExpr.replace(regex, `(${val})`);
        substitutedStr = substitutedStr.replace(regex, `${val}`);
      }

      // Check for security: allow only Math, numbers, operators, parens
      if (/[^0-9\+\-\*\/\(\)\.\s,Math\.sqrt|sin|cos|tan|log|abs|PI|E]/g.test(evalExpr.replace(/Math\.(sqrt|sin|cos|tan|log|abs|PI|E)/g, ''))) {
        return { error: 'Expression contains undefined variable names or invalid operators.' };
      }

      const result = new Function(`return (${evalExpr});`)();

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return { error: 'Calculation resulted in undefined or divide-by-zero.' };
      }

      return {
        success: true,
        value: Number(result.toFixed(6)),
        substitutedStr,
        evaluatedExpr: evalExpr
      };
    } catch (err: any) {
      return { error: 'Invalid formula syntax or mismatched parentheses.' };
    }
  };

  const customResult = evaluateCustomFormula();

  // Auto detect new variables from formula input string
  const autoDetectVariables = (expr: string) => {
    setActiveExpression(expr);
    // Find alphabetic tokens that aren't math functions like sqrt, sin, cos, tan, log, abs, pi, e
    const matches = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const reserved = new Set(['sqrt', 'sin', 'cos', 'tan', 'log', 'abs', 'pi', 'e', 'Math']);
    const uniqueVars = Array.from(new Set(matches.filter(m => !reserved.has(m.toLowerCase()))));

    setVariables(prev => {
      const existingMap = new Map(prev.map(v => [v.name, v]));
      return uniqueVars.map(vName => {
        if (existingMap.has(vName)) {
          return existingMap.get(vName)!;
        }
        return { name: vName, label: vName.toUpperCase(), value: 1, unit: '' };
      });
    });
  };

  // Add Variable manually
  const handleAddVariable = () => {
    setVariables(prev => [...prev, { name: `x${prev.length + 1}`, label: `Var ${prev.length + 1}`, value: 1, unit: '' }]);
  };

  // Remove Variable
  const handleRemoveVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  };

  // Variable field change
  const handleVarChange = (index: number, key: keyof CustomFormulaVariable, val: any) => {
    setVariables(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  // Save current Custom Formula
  const handleSaveFormula = () => {
    if (!activeFormulaTitle.trim() || !activeExpression.trim()) return;

    const newFormula: CustomFormula = {
      id: `form-${Date.now()}`,
      title: activeFormulaTitle,
      expression: activeExpression,
      category,
      variables,
      createdAt: new Date().toISOString()
    };

    setCustomFormulas(prev => [newFormula, ...prev]);
    onRecordFormulaSolved?.();
  };

  // Load selected formula
  const handleLoadFormula = (f: CustomFormula) => {
    setActiveFormulaTitle(f.title);
    setActiveExpression(f.expression);
    setCategory(f.category || 'General');
    setVariables(f.variables || []);
    setActiveTab('custom');
  };

  // Delete saved formula
  const handleDeleteFormula = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomFormulas(prev => prev.filter(f => f.id !== id));
  };

  // Quadratic Calculation
  const solveQuadratic = () => {
    const a = Number(quadA);
    const b = Number(quadB);
    const c = Number(quadC);

    if (a === 0) return { error: 'Coefficient "a" cannot be zero in a quadratic equation.' };

    const discriminant = b * b - 4 * a * c;
    if (discriminant > 0) {
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      return {
        discriminant,
        roots: [`x₁ = ${x1.toFixed(4)}`, `x₂ = ${x2.toFixed(4)}`],
        type: 'Two distinct real roots'
      };
    } else if (discriminant === 0) {
      const x = -b / (2 * a);
      return {
        discriminant,
        roots: [`x = ${x.toFixed(4)}`],
        type: 'One repeated real root'
      };
    } else {
      const real = (-b / (2 * a)).toFixed(4);
      const imag = (Math.sqrt(-discriminant) / (2 * a)).toFixed(4);
      return {
        discriminant,
        roots: [`x₁ = ${real} + ${imag}i`, `x₂ = ${real} - ${imag}i`],
        type: 'Complex conjugate roots'
      };
    }
  };

  const quadResult = solveQuadratic();
  const forceResult = mass * accel;
  const molarityResult = volume > 0 ? (moles / volume).toFixed(4) : 'Undefined (Volume must be > 0)';
  const sideC = Math.sqrt(sideA * sideA + sideB * sideB).toFixed(4);

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Interactive Formula & Custom Equation Lab</h1>
            <p className="text-xs text-slate-400">Write custom math/physics formulas, dynamically calculate values, and run preset solvers</p>
          </div>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar touch-scroll pb-2">
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'custom'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white shadow-lg'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4 text-purple-300" />
          <span>Write Custom Formula</span>
        </button>

        <button
          onClick={() => setActiveTab('algebra')}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'algebra'
              ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Algebra Quadratic</span>
        </button>

        <button
          onClick={() => setActiveTab('physics')}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'physics'
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Physics Mechanics</span>
        </button>

        <button
          onClick={() => setActiveTab('chemistry')}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'chemistry'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Atom className="w-4 h-4" />
          <span>Chemistry Molarity</span>
        </button>

        <button
          onClick={() => setActiveTab('trig')}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'trig'
              ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Trigonometry</span>
        </button>
      </div>

      {/* Tab 0: WRITE CUSTOM FORMULA (User self-written formula & values calculation) */}
      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Formula Writing Area */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Custom Formula Calculator</span>
                </h2>
                <p className="text-xs text-slate-400">Write any mathematical expression & set parameter values to calculate live results</p>
              </div>

              <button
                onClick={handleSaveFormula}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Formula</span>
              </button>
            </div>

            {/* Title & Expression Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-300 block mb-1">Formula Title</label>
                <input
                  type="text"
                  value={activeFormulaTitle}
                  onChange={(e) => setActiveFormulaTitle(e.target.value)}
                  placeholder="e.g. Kinetic Energy or Compound Interest"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
                >
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Finance">Finance</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
            </div>

            {/* Mathematical Formula Expression Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                <span>Formula Expression</span>
                <span className="text-[10px] text-slate-400 font-normal">Supports: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), pi</span>
              </label>
              <input
                type="text"
                value={activeExpression}
                onChange={(e) => autoDetectVariables(e.target.value)}
                placeholder="e.g. 0.5 * m * v^2 or P * (1 + r/n)^(n*t)"
                className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-4 py-3 text-base text-purple-200 font-mono focus:outline-none focus:border-purple-400 shadow-inner"
              />
            </div>

            {/* Variables & Parameter Value Inputs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Variable Parameters & Input Values</label>
                <button
                  onClick={handleAddVariable}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variable</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {variables.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5">
                    
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Var Name</label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleVarChange(idx, 'name', e.target.value)}
                        placeholder="e.g. m"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-purple-300 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Label</label>
                      <input
                        type="text"
                        value={v.label}
                        onChange={(e) => handleVarChange(idx, 'label', e.target.value)}
                        placeholder="Mass"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Value</label>
                      <input
                        type="number"
                        value={v.value}
                        onChange={(e) => handleVarChange(idx, 'value', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-end pt-3">
                      <button
                        onClick={() => handleRemoveVariable(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove variable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Evaluated Output Result Box */}
            <div className="p-5 bg-slate-900 border border-purple-500/40 rounded-2xl space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Calculated Output Result</span>
                {customResult.success && (
                  <button
                    onClick={() => copyText(String(customResult.value))}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {customResult.error ? (
                <p className="text-xs text-red-400 font-semibold">{customResult.error}</p>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-2xl text-emerald-300 font-extrabold text-center">
                    Output = {customResult.value}
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="font-bold text-slate-300 block">Substituted Step:</span>
                    <p className="font-mono text-purple-200">{customResult.substitutedStr} = {customResult.value}</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Saved Custom Formulas Sidebar */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-400" />
              <span>Saved Formulas ({customFormulas.length})</span>
            </h3>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {customFormulas.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleLoadFormula(f)}
                  className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-purple-300">{f.title}</span>
                    <button
                      onClick={(e) => handleDeleteFormula(f.id, e)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Delete saved formula"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-purple-300 truncate">{f.expression}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">{f.category || 'General'}</span>
                    <span>{f.variables?.length || 0} vars</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 1: Quadratic Algebra */}
      {activeTab === 'algebra' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Quadratic Formula Solver: ax² + bx + c = 0</h2>
            <p className="text-xs text-slate-400">Formula: x = [-b ± √(b² - 4ac)] / (2a)</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Coefficient a</label>
              <input
                type="number"
                value={quadA}
                onChange={(e) => setQuadA(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Coefficient b</label>
              <input
                type="number"
                value={quadB}
                onChange={(e) => setQuadB(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Constant c</label>
              <input
                type="number"
                value={quadC}
                onChange={(e) => setQuadC(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Solution Output</span>
              {quadResult.roots && (
                <button
                  onClick={() => copyText(quadResult.roots.join(', '))}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {quadResult.error ? (
              <p className="text-xs text-red-400 font-semibold">{quadResult.error}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span>Discriminant Δ = b² - 4ac = <strong className="text-purple-300">{quadResult.discriminant}</strong></span>
                  <span>Type: <strong className="text-amber-300">{quadResult.type}</strong></span>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-base text-emerald-300 flex items-center justify-around">
                  {quadResult.roots?.map((r, i) => (
                    <span key={i} className="font-bold">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Physics Newton's 2nd Law */}
      {activeTab === 'physics' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Newton's Second Law: F = m · a</h2>
            <p className="text-xs text-slate-400">Calculate net force given mass (kg) and acceleration (m/s²)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Mass m (kg)</label>
              <input
                type="number"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Acceleration a (m/s²)</label>
              <input
                type="number"
                value={accel}
                onChange={(e) => setAccel(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-indigo-500/30 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Resulting Net Force (F)</span>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-2xl text-indigo-300 font-extrabold text-center">
              F = {forceResult.toFixed(2)} N (Newtons)
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Chemistry Molarity */}
      {activeTab === 'chemistry' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Molarity Calculator: M = n / V</h2>
            <p className="text-xs text-slate-400">Moles of solute (n) divided by liters of solution (V)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Moles n (mol)</label>
              <input
                type="number"
                value={moles}
                onChange={(e) => setMoles(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Volume V (Liters)</label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Concentration (M)</span>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-2xl text-emerald-300 font-extrabold text-center">
              M = {molarityResult} mol/L (Molar)
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Trigonometry */}
      {activeTab === 'trig' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Pythagorean Theorem: a² + b² = c²</h2>
            <p className="text-xs text-slate-400">Calculate hypotenuse (c) for right-angled triangles</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Side a</label>
              <input
                type="number"
                value={sideA}
                onChange={(e) => setSideA(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Side b</label>
              <input
                type="number"
                value={sideB}
                onChange={(e) => setSideB(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-amber-500/30 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Hypotenuse c = √(a² + b²)</span>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-2xl text-amber-300 font-extrabold text-center">
              c = {sideC}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
