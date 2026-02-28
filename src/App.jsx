import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  BarChart3, 
  Cpu, 
  Layers, 
  Search, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  TrendingUp, 
  AlertCircle,
  Database,
  Calendar,
  Building,
  Target,
  BrainCircuit,
  Swords,
  CheckCircle,
  Megaphone
} from 'lucide-react';

const App = () => {
  const [step, setStep] = useState('hero'); // hero, input, loading, results, contact, success
  const [formData, setFormData] = useState({
    url: '',
    businessType: '',
    revenue: '',
    challenge: ''
  });
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // --- Theme Constants ---
  const colors = {
    bg: '#F5F3EF', // Warm Beige
    accent: '#A3B18A', // Sage
    text: '#1D3557', // Deep Blue
    muted: '#6B705C', // Olive Grey
  };

  // --- API Integration (Gemini) ---
  const callGemini = async (query, retryCount = 0, useSearch = true, modelIndex = 0) => {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      throw new Error("Missing API key. Set VITE_GEMINI_API_KEY in .env and restart Vite.");
    }
    const modelCandidates = [
      import.meta.env.VITE_GEMINI_MODEL,
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ].filter(Boolean);
    const model = modelCandidates[modelIndex];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const systemPrompt = `You are the LUAZ Labs Intelligence Layer, operating with the analytical rigor, precision, and strategic depth of a top-tier management consulting firm (e.g., McKinsey, BCG).
    Analyze the provided business context. LUAZ is a systems architecture firm.
    Your tone is authoritative, highly specific, objective, and intellectually rigorous. Avoid fluff and salesy buzzwords.
    Provide precise insights based on the business URL provided. You should actively look up the provided URL and verify exactly what the company sells (e.g., natural supplements vs. solar panels) before generating the report. Ensure competitor and market data is highly accurate based on the live URL context.
    Return only valid JSON matching the provided schema.`;

    // Strictly structured schema ensuring all nested objects have required fields
    const schema = {
      type: "OBJECT",
      properties: {
        overview: { type: "STRING", description: "Short, precise executive summary of what the business does and its market positioning." },
        architecture: {
          type: "OBJECT",
          properties: {
            strengths: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" }
                },
                required: ["title", "description"]
              }
            },
            improvements: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["strengths", "improvements"]
        },
        seo: { 
          type: "ARRAY", 
          items: { type: "STRING" }
        },
        sco: { type: "STRING" },
        campaign: { type: "STRING" },
        competitors: { 
          type: "ARRAY", 
          items: { type: "STRING" }
        },
        competitorAds: {
          type: "OBJECT",
          properties: {
            competitorName: { type: "STRING" },
            adDescription: { type: "STRING", description: "Description of their best performing Meta/Facebook ad creative and copy" },
            whyItWorks: { type: "STRING", description: "Strategic breakdown of why this ad converts" },
            landingPageAnalysis: { type: "STRING", description: "Analysis of the ad's destination link/landing page and why it successfully converts the ad traffic." }
          },
          required: ["competitorName", "adDescription", "whyItWorks", "landingPageAnalysis"]
        },
        revenuePotential: { type: "STRING", description: "Format: +X.X%" },
        systemStatus: { type: "STRING" }
      },
      required: ["overview", "architecture", "seo", "sco", "campaign", "competitors", "competitorAds", "revenuePotential", "systemStatus"]
    };

    const payload = {
      contents: [{ parts: [{ text: query }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    };

    // Attempt to use Google Search Grounding
    if (useSearch) {
      payload.tools = [{ "google_search": {} }];
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error (${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        // Model unavailable/unsupported: try next model candidate.
        if ((response.status === 400 || response.status === 404) &&
            /not found|not supported for generateContent|unsupported/i.test(errorMessage) &&
            modelIndex < modelCandidates.length - 1) {
          const nextModel = modelCandidates[modelIndex + 1];
          console.warn(`Model '${model}' unavailable. Retrying with '${nextModel}'...`);
          return callGemini(query, retryCount, useSearch, modelIndex + 1);
        }

        // Fallback: If the API rejects JSON schema + search tools, retry without search.
        if ((response.status === 400 || response.status === 401 || response.status === 403) && useSearch) {
          console.warn(`Search tool rejected with ${response.status}. Retrying without search...`, errorMessage);
          return callGemini(query, retryCount, false, modelIndex);
        }

        if (response.status === 429 || response.status >= 500) {
          if (retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return callGemini(query, retryCount + 1, useSearch, modelIndex);
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("Empty response from intelligence core.");
      
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("Malformed AI Output:", text);
        throw new Error("Intelligence synthesis produced malformed data. Please retry.");
      }
    } catch (err) {
      throw err;
    }
  };

  const handleStartAnalysis = async () => {
    if (!formData.url) return;
    setStep('loading');
    setError(null);

    const userQuery = `Conduct a rigorous, McKinsey-style strategic analysis on this business:
    URL: ${formData.url}
    Type: ${formData.businessType}
    Monthly Revenue: ${formData.revenue || "Not specified"}
    Main Challenge: ${formData.challenge || "Unknown"}
    
    Structure the output to provide:
    1. An exact, short overview of what they do.
    2. Architecture Analysis: 2 strengths vs 2 areas for immediate improvement.
    3. Search Strategy: 3-4 SEO keywords they should dominate.
    4. SCO (Search Context Optimization): What AI/Semantic context is missing from their footprint.
    5. Actionable Ad Campaign: The specific next marketing campaign they need to launch.
    6. Market Reality: Their top 3 direct competitors.
    7. Competitor Ad Intelligence: Describe one specific, high-performing Meta/Facebook ad from a top competitor, explain strategically why the creative works, and analyze the strategy of its destination link/landing page.`;

    try {
      const result = await callGemini(userQuery);
      setAnalysisResult(result);
      
      if (analysisProgress < 100) {
        const interval = setInterval(() => {
          setAnalysisProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setStep('results');
              return 100;
            }
            return prev + 5;
          });
        }, 50);
      } else {
        setStep('results');
      }
    } catch (err) {
      console.error(err);
      setError(`Analysis Interrupted: ${err.message}`);
      setStep('input');
    }
  };

  useEffect(() => {
    if (step === 'loading' && analysisProgress < 90) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => (prev < 90 ? prev + 1 : prev));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step]);

  // --- UI Components ---

  const Header = () => (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 mix-blend-multiply">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#1D3557] rounded-sm flex items-center justify-center">
          <span className="text-[#F5F3EF] font-serif font-bold text-xs">L</span>
        </div>
        <span className="font-medium tracking-widest text-sm uppercase cursor-pointer" onClick={() => setStep('hero')}>LUAZ LABS</span>
      </div>
      <div className="hidden md:flex gap-8 text-xs font-medium uppercase tracking-widest opacity-60">
        <span>Systems</span>
        <span>Intelligence</span>
        <span>Architects</span>
      </div>
      <div className="text-[10px] font-mono opacity-40">
        SYSTEM STATUS: {error ? 'INTERRUPTED' : 'OPTIMAL'}
      </div>
    </nav>
  );

  const Hero = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="mb-6 opacity-0 animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        <span className="px-3 py-1 border border-[#1D3557]/20 rounded-full text-[10px] uppercase tracking-[0.2em] text-[#1D3557]/60">
          The Intelligence Layer
        </span>
      </div>
      <h1 className="text-5xl md:text-7xl font-serif text-[#1D3557] mb-8 leading-tight max-w-4xl opacity-0 animate-fadeIn" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
        Moving beyond scale.<br/>Towards <span className="italic">intelligence.</span>
      </h1>
      <p className="text-lg md:text-xl text-[#1D3557]/70 max-w-xl mb-12 font-light leading-relaxed opacity-0 animate-fadeIn" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
        LUAZ designs and deploys data-driven systems that transform operations into autonomous growth engines.
      </p>
      
      <div className="w-full max-w-2xl bg-white/40 p-2 rounded-lg border border-[#A3B18A]/30 backdrop-blur-sm shadow-sm opacity-0 animate-fadeIn" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
        <div className="flex flex-col md:flex-row gap-2">
          <input 
            type="text" 
            placeholder="Enter your business URL..."
            className="flex-1 px-6 py-4 bg-transparent outline-none text-[#1D3557] font-light placeholder:text-[#1D3557]/40"
            value={formData.url}
            onChange={(e) => setFormData({...formData, url: e.target.value})}
          />
          <button 
            onClick={() => setStep('input')}
            className="bg-[#1D3557] text-[#F5F3EF] px-8 py-4 rounded-md text-sm font-medium tracking-widest uppercase hover:bg-[#1D3557]/90 transition-all flex items-center justify-center gap-2 group"
          >
            Initiate Scan
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

  const InputForm = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-white p-12 rounded-2xl shadow-xl shadow-[#1D3557]/5">
        <h2 className="text-3xl font-serif text-[#1D3557] mb-2 text-center">Contextualizing Intelligence</h2>
        <p className="text-sm text-[#1D3557]/60 mb-10 text-center uppercase tracking-widest font-medium">Step 02 / 05</p>
        
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-800 text-xs rounded flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" /> 
          <span className="truncate" title={error}>{error}</span>
        </div>}

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60">Business Type</label>
            <select 
              className="w-full bg-[#F5F3EF] p-4 rounded-md border-none focus:ring-2 focus:ring-[#A3B18A]/50 outline-none text-[#1D3557]"
              value={formData.businessType}
              onChange={(e) => setFormData({...formData, businessType: e.target.value})}
            >
              <option value="">Select Sector</option>
              <option value="ecommerce">E-commerce / D2C</option>
              <option value="saas">SaaS / Tech</option>
              <option value="sme">SME (Germany)</option>
              <option value="investor">Investor / Portfolio</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60 text-left">Monthly Revenue (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 50k - 100k"
                className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                value={formData.revenue}
                onChange={(e) => setFormData({...formData, revenue: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60 text-left">Primary Friction</label>
              <input 
                type="text" 
                placeholder="e.g. Scaling CAC"
                className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                value={formData.challenge}
                onChange={(e) => setFormData({...formData, challenge: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={handleStartAnalysis}
            className="w-full mt-8 bg-[#A3B18A] text-[#F5F3EF] py-5 rounded-md text-sm font-bold tracking-widest uppercase hover:bg-[#8f9d78] transition-all"
          >
            Execute Strategic Audit
          </button>
        </div>
      </div>
    </div>
  );

  const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-12 relative">
          <div className="w-24 h-24 border-2 border-[#A3B18A]/20 border-t-[#1D3557] rounded-full animate-spin mx-auto"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[#1D3557]">
            {Math.round(analysisProgress)}%
          </div>
        </div>
        
        <h2 className="text-xl font-serif text-[#1D3557] mb-4">Compiling Strategic Briefing...</h2>
        
        <div className="h-px w-full bg-[#1D3557]/10 mb-6 overflow-hidden">
          <div 
            className="h-full bg-[#1D3557] transition-all duration-300" 
            style={{ width: `${analysisProgress}%` }}
          />
        </div>

        <div className="space-y-2 h-4 overflow-hidden">
          <p className="text-[10px] font-mono text-[#1D3557]/40 uppercase tracking-tighter animate-pulse">
            {analysisProgress < 20 && ">> Analyzing market positioning..."}
            {analysisProgress >= 20 && analysisProgress < 40 && ">> Evaluating architectural strengths and vulnerabilities..."}
            {analysisProgress >= 40 && analysisProgress < 60 && ">> Extracting semantic and contextual search gaps..."}
            {analysisProgress >= 60 && analysisProgress < 80 && ">> Formulating optimal acquisition strategy..."}
            {analysisProgress >= 80 && ">> Identifying direct market competitors..."}
          </p>
        </div>
      </div>
    </div>
  );

  const ResultsDashboard = () => (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-12 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b border-[#1D3557]/10 pb-8">
        <div>
          <h2 className="text-4xl font-serif text-[#1D3557] mb-2">Strategic Intelligence Report</h2>
          <p className="text-[#1D3557]/60 font-light">Analysis complete for <span className="font-medium">{formData.url}</span></p>
        </div>
        <div className="flex items-center gap-4 bg-[#1D3557] text-[#F5F3EF] px-6 py-4 rounded-lg shadow-lg">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest opacity-60">Estimated Opportunity</p>
            <p className="text-2xl font-serif font-bold">{analysisResult?.revenuePotential || "+18.2%"}</p>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <TrendingUp className="text-[#A3B18A]" size={24} />
        </div>
      </div>

      {/* 1. Executive Overview */}
      <div className="bg-white p-8 rounded-xl border border-[#1D3557]/5 shadow-sm mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 mt-1 bg-[#F5F3EF] rounded-full flex items-center justify-center text-[#1D3557] shrink-0">
            <Building size={20} />
          </div>
          <div>
            <h3 className="text-[10px] font-mono text-[#1D3557]/50 uppercase tracking-widest mb-2">Executive Overview</h3>
            <p className="text-lg text-[#1D3557] leading-relaxed font-serif">
              {analysisResult?.overview || "Generating overview..."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Architecture Analysis (Pros / Cons) */}
      <div className="bg-white p-8 rounded-xl border border-[#1D3557]/5 shadow-sm mb-6">
        <h3 className="text-[10px] font-mono text-[#1D3557]/50 uppercase tracking-widest mb-6 border-b border-[#1D3557]/5 pb-4">
          System Architecture & User Experience
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#6B705C]">
              <CheckCircle size={18} />
              <h4 className="font-bold text-sm uppercase tracking-wide">Current Strengths</h4>
            </div>
            <div className="space-y-4">
              {analysisResult?.architecture?.strengths?.map((item, i) => (
                <div key={i} className="bg-[#F5F3EF]/50 p-4 rounded-lg border border-[#A3B18A]/20">
                  <p className="text-sm font-bold text-[#1D3557] mb-1">{item.title}</p>
                  <p className="text-xs text-[#1D3557]/70 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-red-800">
              <AlertCircle size={18} />
              <h4 className="font-bold text-sm uppercase tracking-wide">Areas for Improvement</h4>
            </div>
            <div className="space-y-4">
              {analysisResult?.architecture?.improvements?.map((item, i) => (
                <div key={i} className="bg-red-50/50 p-4 rounded-lg border border-red-900/10">
                  <p className="text-sm font-bold text-[#1D3557] mb-1">{item.title}</p>
                  <p className="text-xs text-[#1D3557]/70 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Context (SEO & SCO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* SEO */}
        <div className="bg-white p-8 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-[#1D3557]">
            <Search size={20} className="text-[#A3B18A]" />
            <h4 className="font-bold text-sm uppercase tracking-wide">Search Engine (SEO)</h4>
          </div>
          <p className="text-xs text-[#1D3557]/60 mb-4">High-value keywords your infrastructure should dominate:</p>
          <div className="flex flex-wrap gap-2">
            {analysisResult?.seo?.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 border border-[#1D3557]/20 rounded-md text-xs font-medium text-[#1D3557] bg-[#F5F3EF]">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* SCO */}
        <div className="bg-[#1D3557] text-white p-8 rounded-xl shadow-sm relative overflow-hidden">
          <BrainCircuit className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Zap size={20} className="text-[#A3B18A]" />
              <h4 className="font-bold text-sm uppercase tracking-wide">AI Context (SCO)</h4>
            </div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Missing Contextual Data</p>
            <p className="text-sm text-white/90 leading-relaxed font-light">
              {analysisResult?.sco || "Analyzing missing semantic data..."}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Strategy & Market Reality */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Ad Campaign */}
        <div className="bg-white p-8 rounded-xl border border-[#1D3557]/5 shadow-sm md:col-span-2">
           <div className="flex items-center gap-3 mb-4 text-[#1D3557]">
            <Target size={20} className="text-[#1D3557]" />
            <h4 className="font-bold text-sm uppercase tracking-wide">Recommended Acquisition Strategy</h4>
          </div>
          <p className="text-sm text-[#1D3557]/80 leading-relaxed bg-[#F5F3EF]/50 p-5 rounded-lg border border-[#A3B18A]/30">
            {analysisResult?.campaign || "Processing strategy..."}
          </p>
        </div>

        {/* Competitors */}
        <div className="bg-white p-8 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-[#1D3557]">
            <Swords size={20} className="text-[#1D3557]" />
            <h4 className="font-bold text-sm uppercase tracking-wide">Market Reality</h4>
          </div>
          <p className="text-[10px] text-[#1D3557]/50 uppercase tracking-widest mb-3">Top Direct Competitors</p>
          <ul className="space-y-3">
            {analysisResult?.competitors?.map((comp, i) => (
              <li key={i} className="text-sm font-bold text-[#1D3557] flex items-center gap-2 border-b border-[#1D3557]/5 pb-2 last:border-0">
                <span className="text-[10px] font-mono text-[#A3B18A]">0{i+1}</span> {comp}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* 5. Competitive Ad Intelligence */}
      <div className="bg-white p-8 rounded-xl border border-[#1D3557]/5 shadow-sm mb-12">
        <div className="flex items-center gap-3 mb-6 text-[#1D3557] border-b border-[#1D3557]/5 pb-4">
          <div className="w-10 h-10 bg-[#1D3557]/10 rounded-full flex items-center justify-center text-[#1D3557]">
            <Megaphone size={20} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold">5. Competitor Ad Intelligence</h3>
            <p className="text-xs text-[#1D3557]/60">Top performing Meta/Facebook ad in your niche</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#F5F3EF]/50 p-6 rounded-lg border border-[#1D3557]/5">
            <p className="text-[10px] font-mono text-[#1D3557]/50 uppercase mb-2">Target Competitor</p>
            <p className="text-xl font-serif text-[#1D3557]">{analysisResult?.competitorAds?.competitorName || "Analyzing..."}</p>
          </div>
          <div className="bg-[#F5F3EF]/50 p-6 rounded-lg border border-[#1D3557]/5 md:col-span-2">
            <p className="text-sm font-bold text-[#1D3557] mb-2">Ad Creative & Copy</p>
            <p className="text-sm text-[#1D3557]/70 leading-relaxed italic mb-4">"{analysisResult?.competitorAds?.adDescription || "Scanning ad libraries..."}"</p>
            
            <div className="border-t border-[#1D3557]/10 pt-4 mb-4">
              <p className="text-[10px] font-mono text-[#1D3557]/50 uppercase mb-1">Strategic Breakdown</p>
              <p className="text-sm text-[#1D3557]/80">{analysisResult?.competitorAds?.whyItWorks || "Deconstructing psychological triggers..."}</p>
            </div>

            <div className="border-t border-[#1D3557]/10 pt-4">
              <p className="text-[10px] font-mono text-[#1D3557]/50 uppercase mb-1">Post-Click Architecture (Landing Page Link)</p>
              <p className="text-sm text-[#1D3557]/80">{analysisResult?.competitorAds?.landingPageAnalysis || "Analyzing post-click conversion architecture..."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* The Call to Action */}
      <div className="bg-[#1D3557] p-10 rounded-2xl text-white shadow-xl flex flex-col items-center text-center mb-12">
        <h3 className="text-sm uppercase tracking-[0.2em] font-bold mb-4 opacity-80 text-[#A3B18A]">System Verdict</h3>
        <h2 className="text-2xl md:text-3xl font-serif mb-4 italic max-w-2xl">
          "{analysisResult?.systemStatus || "Your current architecture is leaving revenue on the table."}"
        </h2>
        <p className="text-[#F5F3EF]/70 max-w-xl mb-8 leading-relaxed text-sm">
          This is just the surface layer. Enter your details below to receive a comprehensive, strategic blueprint tailored to scaling your specific architecture.
        </p>
        <button 
          onClick={() => setStep('contact')}
          className="bg-[#A3B18A] text-[#1D3557] px-10 py-5 rounded-md text-sm font-bold tracking-widest uppercase hover:bg-white transition-colors w-full md:w-auto shadow-lg"
        >
          Secure Full Blueprint & Plan
        </button>
      </div>
    </div>
  );

  const ContactForm = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-white p-12 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-serif text-[#1D3557] mb-6 text-center">Protocol Initialization</h2>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Full Name" className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none" />
            <input placeholder="Company Name" className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none" />
          </div>
          <input placeholder="Work Email" className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none" />
          <div className="bg-[#A3B18A]/10 p-4 rounded-md border border-[#A3B18A]/20 flex items-start gap-3">
            <Lock size={16} className="text-[#A3B18A] mt-1 shrink-0" />
            <p className="text-[10px] text-[#1D3557]/60 leading-normal">
              Your data is processed through LUAZ Secure Layer. By continuing, you agree to our privacy architecture and data processing protocols.
            </p>
          </div>
          <button 
            onClick={() => setStep('success')}
            className="w-full bg-[#1D3557] text-[#F5F3EF] py-5 rounded-md text-sm font-bold tracking-widest uppercase hover:bg-[#1D3557]/90 transition-all"
          >
            Confirm & Access Insights
          </button>
        </div>
      </div>
    </div>
  );

  const SuccessScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center animate-fadeIn">
      <div className="w-20 h-20 bg-[#A3B18A] rounded-full flex items-center justify-center text-white mb-8 mx-auto shadow-lg shadow-[#A3B18A]/20">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-4xl font-serif text-[#1D3557] mb-4">Transmission Successful</h2>
      <p className="text-lg text-[#1D3557]/70 max-w-lg mb-12 font-light">
        Your business architecture is being finalized. Our lead strategist will review the data and send the full report within 4 hours.
      </p>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button className="bg-[#1D3557] text-[#F5F3EF] px-10 py-5 rounded-md text-sm font-bold tracking-widest uppercase flex items-center gap-2">
          <Calendar size={18} />
          Book Systems Consultation
        </button>
        <button 
          onClick={() => {
            setStep('hero');
            setAnalysisProgress(0);
            setAnalysisResult(null);
          }}
          className="border border-[#1D3557] text-[#1D3557] px-10 py-5 rounded-md text-sm font-bold tracking-widest uppercase"
        >
          Return to Hub
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans selection:bg-[#A3B18A]/30" style={{ backgroundColor: colors.bg, color: colors.text }}>
      {Header()}
      
      <main>
        {step === 'hero' && Hero()}
        {step === 'input' && InputForm()}
        {step === 'loading' && LoadingScreen()}
        {step === 'results' && ResultsDashboard()}
        {step === 'contact' && ContactForm()}
        {step === 'success' && SuccessScreen()}
      </main>

      {/* Decorative elements */}
      <div className="fixed bottom-12 left-12 hidden lg:block opacity-20 pointer-events-none">
        <div className="font-mono text-[10px] space-y-1">
          <p>LUAZ_v2.05_DEPLOYMENT</p>
          <p>CORE: ACTIVE</p>
          <p>MODELS: T4/QUANTUM</p>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default App;
