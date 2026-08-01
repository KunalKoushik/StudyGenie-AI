import React, { useState, useRef, useEffect } from 'react';
import { SnapAnalysisResult } from '../types';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  Lightbulb, 
  BookOpen,
  Image as ImageIcon,
  Video,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const SnapAndSolve: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Solve and explain this step by step.');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SnapAnalysisResult | null>(null);

  // Live Camera Feed State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sample study images for instant testing
  const sampleImages = [
    {
      id: 'math-sample',
      title: 'Calculus Derivative Problem',
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="40%" fill="%2338bdf8" font-size="20" font-family="monospace" text-anchor="middle">Find d/dx [ x^3 * sin(2x) ]</text><text x="50%" y="70%" fill="%2394a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">Calculus - Product Rule %26 Chain Rule</text></svg>'
    },
    {
      id: 'physics-sample',
      title: 'Circuit Diagram & Ohm\'s Law',
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="40%" fill="%23a855f7" font-size="20" font-family="monospace" text-anchor="middle">V = 12V, R1 = 4Ω, R2 = 6Ω</text><text x="50%" y="70%" fill="%2394a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">Physics - Series Circuit Equivalent Resistance</text></svg>'
    },
    {
      id: 'chem-sample',
      title: 'Chemical Equilibrium Reaction',
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="40%" fill="%2334d399" font-size="20" font-family="monospace" text-anchor="middle">N2(g) + 3H2(g) ⇌ 2NH3(g)</text><text x="50%" y="70%" fill="%2394a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">Chemistry - Le Chatelier\'s Principle</text></svg>'
    }
  ];

  // Stop camera stream cleanup
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Open device camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }

      // Attempt rear camera first, fallback to default video device
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // Attach stream to video tag after state render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error('Video play error:', err));
        }
      }, 100);

    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check camera permissions or use file upload.');
      setIsCameraActive(false);
    }
  };

  // Capture current video frame
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      setAnalysis(null);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          prompt
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data);
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Snap & Solve OCR Problem Analyzer</h1>
            <p className="text-xs text-slate-400">Take a live photo or upload textbook problems, equations, or diagrams for step-by-step AI solutions</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload & Camera Section */}
        <div className="space-y-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-400" />
            <span>Capture or Upload Problem Image</span>
          </h2>

          {/* Live Camera Modal / Viewfinder */}
          {isCameraActive ? (
            <div className="bg-slate-950 border border-sky-500/50 rounded-2xl p-4 space-y-4 shadow-2xl relative">
              <div className="relative rounded-xl overflow-hidden bg-black max-h-72 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover rounded-xl"
                />
                {/* Target overlay grid */}
                <div className="absolute inset-6 border-2 border-dashed border-sky-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-bold text-sky-200 bg-slate-950/70 px-3 py-1 rounded-full">
                    Align Problem / Equation Here
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>

                <button
                  onClick={capturePhoto}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Camera Trigger Button */}
              <button
                onClick={startCamera}
                className="p-5 bg-gradient-to-br from-sky-900/40 to-slate-900 border border-sky-500/40 hover:border-sky-400 rounded-2xl text-center space-y-2 transition-all hover:scale-[1.02] shadow-lg group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 mx-auto group-hover:scale-110 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-white">Take Live Photo</p>
                <p className="text-[10px] text-slate-400">Open device camera & capture</p>
              </button>

              {/* File Upload Trigger */}
              <div className="border border-slate-700/80 hover:border-sky-500/50 rounded-2xl p-5 text-center space-y-2 transition-all bg-slate-900/40 relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="snap-file-upload"
                />
                <label htmlFor="snap-file-upload" className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">Upload Image File</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, WEBP or Gallery</p>
                </label>
              </div>
            </div>
          )}

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Sample Selectors */}
          <div className="space-y-2 pt-2 border-t border-slate-700/60">
            <span className="text-xs text-slate-400 font-semibold block">Or Try Sample Study Problems:</span>
            <div className="grid grid-cols-1 gap-2">
              {sampleImages.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    stopCamera();
                    setImagePreview(sample.dataUrl);
                    setAnalysis(null);
                  }}
                  className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left flex items-center gap-3 transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 truncate">{sample.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview & Custom Solution Prompt */}
          {imagePreview && (
            <div className="space-y-4 pt-2 border-t border-slate-700/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Selected Problem Preview:</span>
                <button
                  onClick={() => { setImagePreview(null); setAnalysis(null); }}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Clear Image
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                <img src={imagePreview} alt="Problem Preview" className="max-h-52 mx-auto object-contain rounded-lg" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Custom Solution Instruction</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Explain the integration step in detail"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
                    <span>Analyzing Image with AI Vision...</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>Run AI Snap & Solve</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* AI Analysis Result Card */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>AI Solution & Step-by-Step Breakdown</span>
          </h2>

          {analysis ? (
            <div className="space-y-5">
              
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">{analysis.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Transcribed Text */}
              <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Transcribed Text / Formula:</span>
                <p className="text-xs font-mono text-amber-200">{analysis.extractedText}</p>
              </div>

              {/* Step-by-Step Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Step-by-Step Solution</span>
                </span>
                <div className="space-y-2">
                  {analysis.stepByStepSolution.map((step, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-xs text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Key Takeaways</span>
                </span>
                <div className="space-y-1.5">
                  {analysis.keyTakeaways.map((takeaway, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-xs">Take a photo using camera or choose an image on the left, then click "Run AI Snap & Solve".</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
