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
  Megaphone,
  Plane
} from 'lucide-react';

const App = () => {
  const [step, setStep] = useState('hero'); // hero, input, loading, results, contact, success
  const [auditMode, setAuditMode] = useState('website'); // website | idea
  const [formData, setFormData] = useState({
    url: '',
    businessType: '',
    revenue: '',
    challenge: '',
    ideaDescription: '',
    targetMarket: '',
    targetAudience: '',
    priceRange: '',
    productCategory: '',
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
  const callGemini = async (query, mode = 'website', retryCount = 0, useSearch = true, modelIndex = 0) => {
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

    const websiteSchema = {
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
            adDescription: { type: "STRING" },
            whyItWorks: { type: "STRING" },
            landingPageAnalysis: { type: "STRING" }
          },
          required: ["competitorName", "adDescription", "whyItWorks", "landingPageAnalysis"]
        },
        revenuePotential: { type: "STRING", description: "Format: +X.X%" },
        systemStatus: { type: "STRING" }
      },
      required: ["overview", "architecture", "seo", "sco", "campaign", "competitors", "competitorAds", "revenuePotential", "systemStatus"]
    };

    const ideaSchema = {
      type: "OBJECT",
      properties: {
        reportTitle: { type: "STRING" },
        ideaName: { type: "STRING" },
        ideaSummary: {
          type: "OBJECT",
          properties: {
            oneLiner: { type: "STRING" },
            coreProblem: { type: "STRING" },
            targetUser: { type: "STRING" },
            mechanism: { type: "STRING" },
            immediateVerdict: { type: "STRING" },
          },
          required: ["oneLiner", "coreProblem", "targetUser", "mechanism", "immediateVerdict"],
        },
        marketDemand: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            signals: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  signalType: { type: "STRING" },
                  label: { type: "STRING" },
                  strength: { type: "STRING" },
                  whatItSuggests: { type: "STRING" },
                },
                required: ["signalType", "label", "strength", "whatItSuggests"],
              },
            },
            keyInsight: { type: "STRING" },
            recommendedAction: { type: "STRING" },
          },
          required: ["score", "signals", "keyInsight", "recommendedAction"],
        },
        consumerProblems: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  problem: { type: "STRING" },
                  rootCause: { type: "STRING" },
                  currentFix: { type: "STRING" },
                  gap: { type: "STRING" },
                },
                required: ["problem", "rootCause", "currentFix", "gap"],
              },
            },
            keyInsight: { type: "STRING" },
            recommendedAction: { type: "STRING" },
          },
          required: ["score", "items", "keyInsight", "recommendedAction"],
        },
        competitors: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            direct: { type: "ARRAY", items: { type: "OBJECT", properties: { brand: { type: "STRING" }, category: { type: "STRING" }, priceRange: { type: "STRING" }, whatWorks: { type: "STRING" }, weakness: { type: "STRING" }, relevance: { type: "STRING" } }, required: ["brand", "category", "priceRange", "whatWorks", "weakness", "relevance"] } },
            indirect: { type: "ARRAY", items: { type: "OBJECT", properties: { brand: { type: "STRING" }, category: { type: "STRING" }, priceRange: { type: "STRING" }, whatWorks: { type: "STRING" }, weakness: { type: "STRING" }, relevance: { type: "STRING" } }, required: ["brand", "category", "priceRange", "whatWorks", "weakness", "relevance"] } },
            substitutes: { type: "ARRAY", items: { type: "OBJECT", properties: { brand: { type: "STRING" }, category: { type: "STRING" }, priceRange: { type: "STRING" }, whatWorks: { type: "STRING" }, weakness: { type: "STRING" }, relevance: { type: "STRING" } }, required: ["brand", "category", "priceRange", "whatWorks", "weakness", "relevance"] } },
            marketProof: { type: "STRING" },
            whiteSpaceOpportunity: { type: "STRING" },
            recommendedAction: { type: "STRING" },
          },
          required: ["score", "direct", "indirect", "substitutes", "marketProof", "whiteSpaceOpportunity", "recommendedAction"],
        },
        popularProducts: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  productType: { type: "STRING" },
                  example: { type: "STRING" },
                  whyItSells: { type: "STRING" },
                  priceRange: { type: "STRING" },
                  repeatPurchasePotential: { type: "STRING" },
                  fitForIdea: { type: "STRING" },
                },
                required: ["productType", "example", "whyItSells", "priceRange", "repeatPurchasePotential", "fitForIdea"],
              },
            },
            bestFitsForThisIdea: { type: "ARRAY", items: { type: "STRING" } },
            avoidForNow: { type: "ARRAY", items: { type: "STRING" } },
            recommendedAction: { type: "STRING" },
          },
          required: ["score", "items", "bestFitsForThisIdea", "avoidForNow", "recommendedAction"],
        },
        mechanismValidation: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            mechanism: { type: "STRING" },
            practicalImplication: { type: "STRING" },
            productTranslation: { type: "ARRAY", items: { type: "STRING" } },
            claimRisk: { type: "STRING" },
          },
          required: ["score", "mechanism", "practicalImplication", "productTranslation", "claimRisk"],
        },
        productArchitecture: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            recommendedCoreProduct: { type: "STRING" },
            supportingProducts: { type: "ARRAY", items: { type: "STRING" } },
            bundleIdea: { type: "STRING" },
            starterBoxRecommendation: { type: "STRING" },
            beautyProductRecommendations: { type: "ARRAY", items: { type: "STRING" } },
            repeatPurchaseEngine: { type: "STRING" },
            avoid: { type: "ARRAY", items: { type: "STRING" } },
            recommendedAction: { type: "STRING" },
          },
          required: ["score", "recommendedCoreProduct", "supportingProducts", "bundleIdea", "starterBoxRecommendation", "beautyProductRecommendations", "repeatPurchaseEngine", "avoid", "recommendedAction"],
        },
        pricing: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            tiers: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  tier: { type: "STRING" },
                  typicalOffer: { type: "STRING" },
                  priceRange: { type: "STRING" },
                  strategicComment: { type: "STRING" },
                },
                required: ["tier", "typicalOffer", "priceRange", "strategicComment"],
              },
            },
            recommendedPricePosition: { type: "STRING" },
            whyThisRangeWorks: { type: "STRING" },
            firstTestPrice: { type: "STRING" },
          },
          required: ["score", "tiers", "recommendedPricePosition", "whyThisRangeWorks", "firstTestPrice"],
        },
        distribution: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            channels: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  channel: { type: "STRING" },
                  whyItWorks: { type: "STRING" },
                  fitForIdea: { type: "STRING" },
                  priority: { type: "NUMBER" },
                },
                required: ["channel", "whyItWorks", "fitForIdea", "priority"],
              },
            },
            goToMarketSequence: { type: "ARRAY", items: { type: "STRING" } },
            recommendedAction: { type: "STRING" },
          },
          required: ["score", "channels", "goToMarketSequence", "recommendedAction"],
        },
        marketingAngles: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            angles: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  angle: { type: "STRING" },
                  whyItResonates: { type: "STRING" },
                  bestAudience: { type: "STRING" },
                  bestChannel: { type: "STRING" },
                },
                required: ["angle", "whyItResonates", "bestAudience", "bestChannel"],
              },
            },
            bestPrimaryAngle: { type: "STRING" },
            bestSecondaryAngle: { type: "STRING" },
            recommendedAction: { type: "STRING" },
          },
          required: ["score", "angles", "bestPrimaryAngle", "bestSecondaryAngle", "recommendedAction"],
        },
        positioning: {
          type: "OBJECT",
          properties: {
            emotional: { type: "STRING" },
            functional: { type: "STRING" },
            category: { type: "STRING" },
            positioningStatement: { type: "STRING" },
          },
          required: ["emotional", "functional", "category", "positioningStatement"],
        },
        aAndO: {
          type: "OBJECT",
          properties: {
            alles: { type: "ARRAY", items: { type: "STRING" } },
            ohne: { type: "ARRAY", items: { type: "STRING" } },
            recommendedAction: { type: "STRING" },
          },
          required: ["alles", "ohne", "recommendedAction"],
        },
        usp: {
          type: "OBJECT",
          properties: {
            recommendedUSP: { type: "STRING" },
            whyItIsStrong: { type: "STRING" },
            whyHardToCopy: { type: "STRING" },
            activation: {
              type: "OBJECT",
              properties: {
                packaging: { type: "STRING" },
                landingPage: { type: "STRING" },
                ads: { type: "STRING" },
              },
              required: ["packaging", "landingPage", "ads"],
            },
          },
          required: ["recommendedUSP", "whyItIsStrong", "whyHardToCopy", "activation"],
        },
        opportunityScore: {
          type: "OBJECT",
          properties: {
            overallScore: { type: "NUMBER" },
            dimensions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  dimension: { type: "STRING" },
                  score: { type: "NUMBER" },
                  reason: { type: "STRING" },
                },
                required: ["dimension", "score", "reason"],
              },
            },
            whatWouldIncreaseScore: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["overallScore", "dimensions", "whatWouldIncreaseScore"],
        },
        founderActionPlan: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              week: { type: "STRING" },
              objective: { type: "STRING" },
              keyActions: { type: "ARRAY", items: { type: "STRING" } },
              expectedOutput: { type: "STRING" },
            },
            required: ["week", "objective", "keyActions", "expectedOutput"],
          },
        },
        topRecommendations: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["reportTitle", "ideaName", "ideaSummary", "marketDemand", "consumerProblems", "competitors", "popularProducts", "mechanismValidation", "productArchitecture", "pricing", "distribution", "marketingAngles", "positioning", "aAndO", "usp", "opportunityScore", "founderActionPlan", "topRecommendations"],
    };

    const financialSchema = {
      type: "OBJECT",
      properties: {
        reportTitle: { type: "STRING" },
        website: { type: "STRING" },
        entityResolution: {
          type: "OBJECT",
          properties: {
            matchedEntityName: { type: "STRING" },
            legalForm: { type: "STRING" },
            registerCourt: { type: "STRING" },
            registerNumber: { type: "STRING" },
            vatId: { type: "STRING" },
            lei: { type: "STRING" },
            address: { type: "STRING" },
            managingDirectors: { type: "ARRAY", items: { type: "STRING" } },
            impressumFound: { type: "BOOLEAN" },
            impressumUrl: { type: "STRING" },
            matchConfidence: { type: "STRING" },
            matchStatus: { type: "STRING" },
            explanation: { type: "STRING" }
          },
          required: ["matchedEntityName", "legalForm", "registerCourt", "registerNumber", "vatId", "lei", "address", "managingDirectors", "impressumFound", "impressumUrl", "matchConfidence", "matchStatus", "explanation"]
        },
        sourceCoverage: {
          type: "OBJECT",
          properties: {
            officialRegisterSources: { type: "ARRAY", items: { type: "STRING" } },
            officialCompanySources: { type: "ARRAY", items: { type: "STRING" } },
            mediaSources: { type: "ARRAY", items: { type: "STRING" } },
            secondarySources: { type: "ARRAY", items: { type: "STRING" } },
            coverageQuality: { type: "STRING" },
            coverageGaps: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["officialRegisterSources", "officialCompanySources", "mediaSources", "secondarySources", "coverageQuality", "coverageGaps"]
        },
        officialFilingCoverage: {
          type: "OBJECT",
          properties: {
            annualAccountsFound: { type: "BOOLEAN" },
            latestFilingPeriod: { type: "STRING" },
            filingFreshness: { type: "STRING" },
            filingCompleteness: { type: "STRING" },
            notes: { type: "STRING" }
          },
          required: ["annualAccountsFound", "latestFilingPeriod", "filingFreshness", "filingCompleteness", "notes"]
        },
        financialSignals: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              metric: { type: "STRING" },
              value: { type: "STRING" },
              period: { type: "STRING" },
              sourceType: { type: "STRING" },
              sourceName: { type: "STRING" },
              confidence: { type: "STRING" },
              evidenceLevel: { type: "STRING" },
              comment: { type: "STRING" }
            },
            required: ["metric", "value", "period", "sourceType", "sourceName", "confidence", "evidenceLevel", "comment"]
          }
        },
        ownershipAndGovernance: {
          type: "OBJECT",
          properties: {
            currentOwner: { type: "STRING" },
            ownershipSignal: { type: "STRING" },
            managementChanges: { type: "ARRAY", items: { type: "STRING" } },
            governanceNotes: { type: "STRING" },
            confidence: { type: "STRING" }
          },
          required: ["currentOwner", "ownershipSignal", "managementChanges", "governanceNotes", "confidence"]
        },
        riskFlags: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              flag: { type: "STRING" },
              severity: { type: "STRING" },
              whyItMatters: { type: "STRING" },
              sourceType: { type: "STRING" },
              sourceName: { type: "STRING" },
              confidence: { type: "STRING" }
            },
            required: ["flag", "severity", "whyItMatters", "sourceType", "sourceName", "confidence"]
          }
        },
        stabilitySignals: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              signal: { type: "STRING" },
              strength: { type: "STRING" },
              whyItMatters: { type: "STRING" }
            },
            required: ["signal", "strength", "whyItMatters"]
          }
        },
        timeline: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              dateOrPeriod: { type: "STRING" },
              event: { type: "STRING" },
              type: { type: "STRING" },
              importance: { type: "STRING" }
            },
            required: ["dateOrPeriod", "event", "type", "importance"]
          }
        },
        scores: {
          type: "OBJECT",
          properties: {
            entityTrustScore: { type: "NUMBER" },
            disclosureQualityScore: { type: "NUMBER" },
            operatingStabilityScore: { type: "NUMBER" },
            growthSignalScore: { type: "NUMBER" },
            distressSignalScore: { type: "NUMBER" },
            investorRelevanceScore: { type: "NUMBER" },
            bankabilityScore: { type: "NUMBER" }
          },
          required: ["entityTrustScore", "disclosureQualityScore", "operatingStabilityScore", "growthSignalScore", "distressSignalScore", "investorRelevanceScore", "bankabilityScore"]
        },
        investorTake: {
          type: "OBJECT",
          properties: {
            oneLineView: { type: "STRING" },
            mostAttractiveSignal: { type: "STRING" },
            primaryConcern: { type: "STRING" },
            bestFitUseCase: { type: "STRING" },
            recommendedNextStep: { type: "STRING" }
          },
          required: ["oneLineView", "mostAttractiveSignal", "primaryConcern", "bestFitUseCase", "recommendedNextStep"]
        },
        bankLens: {
          type: "OBJECT",
          properties: {
            creditView: { type: "STRING" },
            underwritingCaution: { type: "STRING" },
            documentationStrength: { type: "STRING" },
            recommendedNextCheck: { type: "STRING" }
          },
          required: ["creditView", "underwritingCaution", "documentationStrength", "recommendedNextCheck"]
        },
        dataIntegrity: {
          type: "OBJECT",
          properties: {
            officialDataShare: { type: "STRING" },
            nonOfficialDataShare: { type: "STRING" },
            highConfidencePoints: { type: "NUMBER" },
            mediumConfidencePoints: { type: "NUMBER" },
            lowConfidencePoints: { type: "NUMBER" },
            mainUncertainties: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["officialDataShare", "nonOfficialDataShare", "highConfidencePoints", "mediumConfidencePoints", "lowConfidencePoints", "mainUncertainties"]
        },
        financialExecutiveSummary: {
          type: "OBJECT",
          properties: {
            overallSummary: { type: "STRING" },
            financialStrengths: { type: "ARRAY", items: { type: "STRING" } },
            financialWeaknesses: { type: "ARRAY", items: { type: "STRING" } },
            profitabilitySignal: { type: "STRING" },
            profitabilityComment: { type: "STRING" }
          },
          required: ["overallSummary", "financialStrengths", "financialWeaknesses", "profitabilitySignal", "profitabilityComment"]
        },
        topRecommendations: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["reportTitle", "website", "entityResolution", "sourceCoverage", "officialFilingCoverage", "financialSignals", "ownershipAndGovernance", "riskFlags", "stabilitySignals", "timeline", "scores", "investorTake", "bankLens", "dataIntegrity", "financialExecutiveSummary", "topRecommendations"]
    };

    const payload = {
      contents: [{ parts: [{ text: query }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: mode === "idea" ? ideaSchema : mode === "financial" ? financialSchema : websiteSchema
      }
    };

    // Attempt to use Google Search Grounding
    if (useSearch) {
      payload.tools = [{ "google_search": {} }];
    }

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
        } catch {
          errorMessage = errorText || errorMessage;
        }

        // Model unavailable/unsupported: try next model candidate.
        if ((response.status === 400 || response.status === 404) &&
            /not found|not supported for generateContent|unsupported/i.test(errorMessage) &&
            modelIndex < modelCandidates.length - 1) {
          const nextModel = modelCandidates[modelIndex + 1];
          console.warn(`Model '${model}' unavailable. Retrying with '${nextModel}'...`);
          return callGemini(query, mode, retryCount, useSearch, modelIndex + 1);
        }

        // Fallback: If the API rejects JSON schema + search tools, retry without search.
        if ((response.status === 400 || response.status === 401 || response.status === 403) && useSearch) {
          console.warn(`Search tool rejected with ${response.status}. Retrying without search...`, errorMessage);
          return callGemini(query, mode, retryCount, false, modelIndex);
        }

        if (response.status === 429 || response.status >= 500) {
          if (retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return callGemini(query, mode, retryCount + 1, useSearch, modelIndex);
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
    } catch {
      console.error("Malformed AI Output:", text);
      throw new Error("Intelligence synthesis produced malformed data. Please retry.");
    }
  };

  const handleStartAnalysis = async () => {
    if (auditMode === 'website' && !formData.url.trim()) {
      setError("Please enter a valid website URL to start the audit.");
      setStep('hero');
      return;
    }
    if (auditMode === 'idea' && !formData.ideaDescription.trim()) {
      setError("Please enter an idea description to start the audit.");
      setStep('input');
      return;
    }
    setStep('loading');
    setError(null);
    setAnalysisProgress(0);

    const websiteQuery = `Conduct a rigorous, McKinsey-style strategic analysis on this business:
URL: ${formData.url}
Type: ${formData.businessType || "Not specified"}
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

    const financialQuery = `You are a senior Financial Intelligence Architect building the "Financial Laser" layer for LUAZ Labs.

Website: ${formData.url}
Business Type Hint: ${formData.businessType || "Not specified"}

Core objective:
- Build investor-grade and bank-grade company intelligence from Impressum/legal notice and public sources.
- Maximize accuracy, source transparency, and decision usefulness.

Hard rules:
1) Never present inferred values as official facts.
2) Every important point must include value, period, sourceType, sourceName, confidence, evidenceLevel.
3) Separate official data from non-official or inferred.
4) If entity match is ambiguous, state it clearly.
5) Prefer precision over completeness.
6) If metric unavailable, mark unavailable (do not invent).
7) Keep strings concise and UI-ready.

Source priority (strict):
1. official_register (Handelsregister, Unternehmensregister, Bundesanzeiger, BRIS, insolvency register, LEI/GLEIF)
2. official_company_disclosure (annual report, IR page, official PR)
3. reputable_primary_media
4. secondary_database
5. inferred

Germany/EU emphasis:
- Prioritize Impressum extraction and legal form consistency
- Register court + register number identity
- Filing coverage recency and completeness
- Insolvency/restructuring signals
- VAT/LEI consistency
- Ownership and management changes

Scoring:
- return integers 1..10
- distressSignalScore: higher means more distress (worse)
- do not smooth scores artificially

Mandatory summary block:
- Fill financialExecutiveSummary with:
  - overallSummary (compact top-line summary for decision-makers)
  - financialStrengths (2-4 bullets)
  - financialWeaknesses (2-4 bullets)
  - profitabilitySignal (e.g., strong | moderate | weak | unknown)
  - profitabilityComment (what source-backed profitability signal exists or why unavailable)

Return only valid JSON matching the required schema.`;

    const ideaQuery = `You are a senior AI Product Intelligence Architect building the Idea Intelligence layer.

Return ONLY valid JSON following the exact response schema already enforced by the API responseSchema.
Do not return markdown. Do not return prose outside JSON.

Quality rules:
- UI-first, founder-facing, action-driven
- compact, scannable, commercially useful
- include concrete competitor/product/channel signals
- avoid generic consultant language
- scores must be integers from 1 to 10
- do not leave any required field empty
- research globally (US, EU, UK, MENA, APAC) and synthesize cross-market patterns

Decision focus:
1) Is this worth building?
2) What to build first?
3) Which competitors matter?
4) What is already working?
5) Where is white-space?
6) How to position and commercialize?
7) What are next 30-day actions?

Additional mandatory output logic:
- productArchitecture.starterBoxRecommendation must be specific (exact box concept + included SKUs)
- productArchitecture.beautyProductRecommendations must list best-fit beauty/cosmetic extensions when relevant (or practical adjacent self-care products)
- in competitors/popularProducts include globally relevant brands and products, not just one geography

Special handling for sleep/wellness/ritual ideas:
- prioritize non-digital sleep support, ritual products, thermal regulation, calming sensory products, bedtime consumables
- include relevant brand landscape, winning product combos, likely winning messages

Input:
- ideaName: ${formData.ideaDescription}
- ideaDescription: ${formData.ideaDescription}
- market: ${formData.targetMarket || "Not specified"}
- audience: ${formData.targetAudience || "Not specified"}
- category: ${formData.productCategory || "Not specified"}
- priceRangeHint: ${formData.priceRange || "Not specified"}`;

    try {
      if (auditMode === 'website') {
        const [websiteResult, financialIntel] = await Promise.all([
          callGemini(websiteQuery, 'website'),
          callGemini(financialQuery, 'financial').catch((intelError) => {
            console.warn("Financial intel fetch failed:", intelError);
            return {
              reportTitle: "Financial Laser Report",
              website: formData.url || "Not found",
              entityResolution: {
                matchedEntityName: "Not found",
                legalForm: "Not found",
                registerCourt: "Not found",
                registerNumber: "Not found",
                vatId: "Not found",
                lei: "Not found",
                address: "Not found",
                managingDirectors: ["Not found"],
                impressumFound: false,
                impressumUrl: "Not found",
                matchConfidence: "low",
                matchStatus: "no_match",
                explanation: "Financial Laser lookup failed during this run."
              },
              sourceCoverage: {
                officialRegisterSources: [],
                officialCompanySources: [],
                mediaSources: [],
                secondarySources: [],
                coverageQuality: "low",
                coverageGaps: ["Financial source scan failed during this run."]
              },
              officialFilingCoverage: {
                annualAccountsFound: false,
                latestFilingPeriod: "unknown",
                filingFreshness: "unknown",
                filingCompleteness: "unknown",
                notes: "No filing data due to failed enrichment run."
              },
              financialSignals: [],
              ownershipAndGovernance: {
                currentOwner: "Not found",
                ownershipSignal: "Not found",
                managementChanges: [],
                governanceNotes: "Not available in this run.",
                confidence: "low"
              },
              riskFlags: [{
                flag: "Financial source scan failed",
                severity: "medium",
                whyItMatters: "No bank/investor-grade validation can be completed without source data.",
                sourceType: "inferred",
                sourceName: "Runtime fallback",
                confidence: "low"
              }],
              stabilitySignals: [],
              timeline: [],
              scores: {
                entityTrustScore: 1,
                disclosureQualityScore: 1,
                operatingStabilityScore: 1,
                growthSignalScore: 1,
                distressSignalScore: 1,
                investorRelevanceScore: 1,
                bankabilityScore: 1
              },
              investorTake: {
                oneLineView: "Insufficient data for investor-grade view.",
                mostAttractiveSignal: "None",
                primaryConcern: "Source coverage unavailable.",
                bestFitUseCase: "watchlist_only",
                recommendedNextStep: "Retry scan and verify legal entity mapping first."
              },
              bankLens: {
                creditView: "Insufficient data for credit view.",
                underwritingCaution: "No reliable filings available in this run.",
                documentationStrength: "Weak",
                recommendedNextCheck: "Re-run with confirmed entity from Impressum."
              },
              dataIntegrity: {
                officialDataShare: "0%",
                nonOfficialDataShare: "100%",
                highConfidencePoints: 0,
                mediumConfidencePoints: 0,
                lowConfidencePoints: 1,
                mainUncertainties: ["Entity and filings could not be resolved."]
              },
              financialExecutiveSummary: {
                overallSummary: "Insufficient verified data for a reliable financial summary.",
                financialStrengths: ["No verified strengths available in this run."],
                financialWeaknesses: ["Entity and filing coverage unresolved."],
                profitabilitySignal: "unknown",
                profitabilityComment: "No source-backed profitability data available."
              },
              topRecommendations: ["Retry with a valid domain and verify Impressum identity."]
            };
          }),
        ]);

        setAnalysisResult({ ...websiteResult, financialIntel });
      } else {
        const result = await callGemini(ideaQuery, 'idea');
        setAnalysisResult(result);
      }
      
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
      setStep(auditMode === 'website' ? 'hero' : 'input');
    }
  };

  useEffect(() => {
    if (step === 'loading' && analysisProgress < 90) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => (prev < 90 ? prev + 1 : prev));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step, analysisProgress]);

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
      
      <div className="flex gap-2 mb-5 opacity-0 animate-fadeIn" style={{ animationDelay: '0.75s', animationFillMode: 'forwards' }}>
        <button
          onClick={() => setAuditMode('website')}
          className={`px-4 py-2 rounded-md text-xs uppercase tracking-widest border transition-all ${auditMode === 'website' ? 'bg-[#1D3557] text-[#F5F3EF] border-[#1D3557]' : 'bg-white/50 text-[#1D3557] border-[#1D3557]/20'}`}
        >
          Audit Website
        </button>
        <button
          onClick={() => setAuditMode('idea')}
          className={`px-4 py-2 rounded-md text-xs uppercase tracking-widest border transition-all ${auditMode === 'idea' ? 'bg-[#1D3557] text-[#F5F3EF] border-[#1D3557]' : 'bg-white/50 text-[#1D3557] border-[#1D3557]/20'}`}
        >
          Audit Idea
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white/40 p-2 rounded-lg border border-[#A3B18A]/30 backdrop-blur-sm shadow-sm opacity-0 animate-fadeIn" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
        <div className="flex flex-col md:flex-row gap-2">
          {auditMode === 'website' ? (
            <input
              type="text"
              placeholder="Enter your business URL..."
              className="flex-1 px-6 py-4 bg-transparent outline-none text-[#1D3557] font-light placeholder:text-[#1D3557]/40"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
          ) : (
            <input
              type="text"
              placeholder="Enter your startup idea in one sentence..."
              className="flex-1 px-6 py-4 bg-transparent outline-none text-[#1D3557] font-light placeholder:text-[#1D3557]/40"
              value={formData.ideaDescription}
              onChange={(e) => setFormData({...formData, ideaDescription: e.target.value})}
            />
          )}
          <button 
            onClick={auditMode === 'website' ? handleStartAnalysis : () => setStep('input')}
            className="bg-[#1D3557] text-[#F5F3EF] px-8 py-4 rounded-md text-sm font-medium tracking-widest uppercase hover:bg-[#1D3557]/90 transition-all flex items-center justify-center gap-2 group"
          >
            {auditMode === 'idea' ? 'Initiate Idea Audit' : 'Run Website Audit'}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-4 max-w-2xl w-full p-3 bg-red-50 border border-red-100 text-red-800 text-xs rounded flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span className="truncate" title={error}>{error}</span>
        </div>
      )}
    </div>
  );

  const InputForm = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fadeIn">
      <div className="w-full max-w-xl p-12">
        <h2 className="text-3xl font-serif text-[#1D3557] mb-2 text-center">
          {auditMode === 'idea' ? 'Strategic Idea Intelligence' : 'Contextualizing Intelligence'}
        </h2>
        <p className="text-sm text-[#1D3557]/60 mb-10 text-center uppercase tracking-widest font-medium">Step 02 / 05</p>

        <div className="flex gap-2 mb-8 justify-center">
          <button
            onClick={() => setAuditMode('website')}
            className={`px-3 py-2 rounded-md text-[10px] uppercase tracking-widest border ${auditMode === 'website' ? 'bg-[#1D3557] text-[#F5F3EF] border-[#1D3557]' : 'text-[#1D3557] border-[#1D3557]/20'}`}
          >
            Audit Website
          </button>
          <button
            onClick={() => setAuditMode('idea')}
            className={`px-3 py-2 rounded-md text-[10px] uppercase tracking-widest border ${auditMode === 'idea' ? 'bg-[#1D3557] text-[#F5F3EF] border-[#1D3557]' : 'text-[#1D3557] border-[#1D3557]/20'}`}
          >
            Audit Idea
          </button>
        </div>
        
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-800 text-xs rounded flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" /> 
          <span className="truncate" title={error}>{error}</span>
        </div>}

        <div className="space-y-6">
          {auditMode === 'website' ? (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60">Business URL</label>
                <input
                  type="text"
                  placeholder="https://your-business.com"
                  className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>
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
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60">Idea Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the startup idea clearly."
                  className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                  value={formData.ideaDescription}
                  onChange={(e) => setFormData({...formData, ideaDescription: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60">Target Market / Geography</label>
                  <input
                    type="text"
                    placeholder="e.g. DACH / EU / US"
                    className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                    value={formData.targetMarket}
                    onChange={(e) => setFormData({...formData, targetMarket: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60">Target Audience (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Busy professionals 25-45"
                    className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60">Price Range (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. €29-€49"
                    className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                    value={formData.priceRange}
                    onChange={(e) => setFormData({...formData, priceRange: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-2 font-bold text-[#1D3557]/60">Product Category (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Wellness / SaaS / Consumer"
                    className="w-full bg-[#F5F3EF] p-4 rounded-md outline-none focus:ring-2 focus:ring-[#A3B18A]/50 text-[#1D3557]"
                    value={formData.productCategory}
                    onChange={(e) => setFormData({...formData, productCategory: e.target.value})}
                  />
                </div>
              </div>
            </>
          )}

          <button 
            onClick={handleStartAnalysis}
            className="w-full mt-8 bg-[#A3B18A] text-[#F5F3EF] py-5 rounded-md text-sm font-bold tracking-widest uppercase hover:bg-[#8f9d78] transition-all"
          >
            {auditMode === 'idea' ? 'Execute Idea Intelligence Report' : 'Execute Strategic Audit'}
          </button>
        </div>
      </div>
    </div>
  );

  const LoadingScreen = () => {
    const progress = Math.round(analysisProgress);
    const clampedProgress = Math.min(Math.max(progress, 4), 96);
    const statusText =
      analysisProgress < 20 ? "Analyzing market positioning..." :
      analysisProgress < 40 ? "Evaluating architecture strengths and vulnerabilities..." :
      analysisProgress < 60 ? "Extracting semantic and contextual search gaps..." :
      analysisProgress < 80 ? "Formulating acquisition strategy..." :
      "Benchmarking direct market competitors...";

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 border border-[#1D3557]/15 rounded-full px-4 py-2 bg-white/70 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#A3B18A] animate-blinkDot" />
            <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#1D3557]/70">Intelligence Core Active</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-serif text-[#1D3557] mb-2">Compiling Strategic Briefing</h2>
          <p className="text-sm text-[#1D3557]/60 mb-10">Live synthesis is running across market, positioning, competitors, and growth signals.</p>

          <div className="relative mx-auto mb-10 max-w-2xl rounded-2xl border border-[#1D3557]/10 bg-white/60 p-6 md:p-8 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(163,177,138,0.16),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(29,53,87,0.14),transparent_50%)]" />

            <div className="relative h-28">
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#1D3557]/0 via-[#1D3557]/35 to-[#1D3557]/0" />
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] border-t border-dashed border-[#1D3557]/25" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${clampedProgress}%` }}
              >
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-[#A3B18A]/30 animate-pulseGlow" />
                  <div className="relative w-11 h-11 rounded-full bg-[#1D3557] text-[#F5F3EF] flex items-center justify-center shadow-lg animate-floatY">
                    <Plane size={16} className="rotate-45" />
                  </div>
                </div>
              </div>

              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-left">
                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#1D3557]/45">Start</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#1D3557]/45">Delivery</p>
              </div>
            </div>

            <div className="relative mt-2">
              <div className="h-2 w-full rounded-full bg-[#1D3557]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1D3557] via-[#355178] to-[#A3B18A] animate-shimmerBar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-3 text-xs font-mono">
                <span className="text-[#1D3557]/55">SYNTHESIS PROGRESS</span>
                <span className="font-bold text-[#1D3557]">{progress}%</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#1D3557]/65 animate-pulse mb-3">
            {`>> ${statusText}`}
          </p>
        </div>
      </div>
    );
  };

  const ResultsDashboard = () => {
    const fi = analysisResult?.financialIntel || {};
    const financialScores = [
      ["Entity Trust", fi?.scores?.entityTrustScore],
      ["Disclosure", fi?.scores?.disclosureQualityScore],
      ["Stability", fi?.scores?.operatingStabilityScore],
      ["Growth", fi?.scores?.growthSignalScore],
      ["Distress", fi?.scores?.distressSignalScore],
      ["Investor", fi?.scores?.investorRelevanceScore],
      ["Bankability", fi?.scores?.bankabilityScore],
    ];

    return (
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

      {/* 6. Financial Laser */}
      <div className="bg-white p-8 rounded-xl border border-[#1D3557]/5 shadow-sm mb-12">
        <div className="flex items-center gap-3 mb-6 text-[#1D3557] border-b border-[#1D3557]/5 pb-4">
          <div className="w-10 h-10 bg-[#1D3557]/10 rounded-full flex items-center justify-center text-[#1D3557]">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold">{fi?.reportTitle || "Financial Laser Report"}</h3>
            <p className="text-xs text-[#1D3557]/60">Investor-grade + bank-grade legal and financial intelligence layer</p>
          </div>
        </div>

        <div className="bg-[#1D3557] text-[#F5F3EF] p-6 rounded-xl mb-6">
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Top Financial Summary</p>
          <p className="text-sm md:text-base leading-relaxed">{fi?.financialExecutiveSummary?.overallSummary || "No financial summary available."}</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Strengths</p>
              <ul className="space-y-1">
                {(fi?.financialExecutiveSummary?.financialStrengths || []).map((x, i) => (
                  <li key={i} className="text-xs">• {x}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Weaknesses</p>
              <ul className="space-y-1">
                {(fi?.financialExecutiveSummary?.financialWeaknesses || []).map((x, i) => (
                  <li key={i} className="text-xs">• {x}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Profitability View</p>
              <p className="text-sm font-semibold">{fi?.financialExecutiveSummary?.profitabilitySignal || "unknown"}</p>
              <p className="text-xs mt-1 opacity-90">{fi?.financialExecutiveSummary?.profitabilityComment || "No profitability signal available."}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#1D3557] text-[#F5F3EF] rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Match Status</p>
            <p className="text-sm font-semibold">{fi?.entityResolution?.matchStatus || "unknown"}</p>
          </div>
          <div className="bg-[#1D3557] text-[#F5F3EF] rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Match Confidence</p>
            <p className="text-sm font-semibold">{fi?.entityResolution?.matchConfidence || "unknown"}</p>
          </div>
          <div className="bg-[#1D3557] text-[#F5F3EF] rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Coverage Quality</p>
            <p className="text-sm font-semibold">{fi?.sourceCoverage?.coverageQuality || "unknown"}</p>
          </div>
          <div className="bg-[#1D3557] text-[#F5F3EF] rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Filing Freshness</p>
            <p className="text-sm font-semibold">{fi?.officialFilingCoverage?.filingFreshness || "unknown"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#F5F3EF]/60 p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-1">Entity</p>
            <p className="text-sm font-semibold text-[#1D3557]">{fi?.entityResolution?.matchedEntityName || "Not found"}</p>
            <p className="text-xs text-[#1D3557]/70 mt-1">{fi?.entityResolution?.legalForm || "Not found"}</p>
            <p className="text-xs text-[#1D3557]/70 mt-1">Register: {fi?.entityResolution?.registerCourt || "Not found"} {fi?.entityResolution?.registerNumber || ""}</p>
            <p className="text-xs text-[#1D3557]/70 mt-1">VAT: {fi?.entityResolution?.vatId || "Not found"} | LEI: {fi?.entityResolution?.lei || "Not found"}</p>
          </div>
          <div className="bg-[#F5F3EF]/60 p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-1">Impressum & Management</p>
            <p className="text-xs text-[#1D3557]/70">Impressum found: {fi?.entityResolution?.impressumFound ? "yes" : "no"}</p>
            <p className="text-xs text-[#1D3557]/70 mt-1">Address: {fi?.entityResolution?.address || "Not found"}</p>
            <p className="text-xs text-[#1D3557]/70 mt-1">Managing directors: {(fi?.entityResolution?.managingDirectors || []).join(", ") || "Not found"}</p>
            {fi?.entityResolution?.impressumUrl && fi?.entityResolution?.impressumUrl !== "Not found" && (
              <a href={fi.entityResolution.impressumUrl} target="_blank" rel="noreferrer" className="text-xs underline text-[#1D3557] mt-2 inline-block break-all">
                Impressum source
              </a>
            )}
          </div>
        </div>

        <div className="bg-[#F5F3EF]/40 p-4 rounded-lg border border-[#1D3557]/10 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Entity Resolution Note</p>
          <p className="text-sm text-[#1D3557]/80">{fi?.entityResolution?.explanation || "No resolution note available."}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Official Register Sources</p>
            <ul className="space-y-1">
              {(fi?.sourceCoverage?.officialRegisterSources || []).map((x, i) => <li key={i} className="text-xs text-[#1D3557]/80">• {x}</li>)}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Company + Media Sources</p>
            <ul className="space-y-1">
              {(fi?.sourceCoverage?.officialCompanySources || []).map((x, i) => <li key={i} className="text-xs text-[#1D3557]/80">• {x}</li>)}
              {(fi?.sourceCoverage?.mediaSources || []).map((x, i) => <li key={`m-${i}`} className="text-xs text-[#1D3557]/80">• {x}</li>)}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Coverage Gaps</p>
            <ul className="space-y-1">
              {(fi?.sourceCoverage?.coverageGaps || []).map((x, i) => <li key={i} className="text-xs text-[#1D3557]/80">• {x}</li>)}
            </ul>
          </div>
        </div>

        <div className="bg-[#1D3557] text-[#F5F3EF] p-5 rounded-lg mb-6">
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Official Filing Coverage</p>
          <p className="text-sm">Annual accounts found: {fi?.officialFilingCoverage?.annualAccountsFound ? "yes" : "no"}</p>
          <p className="text-sm mt-1">Latest period: {fi?.officialFilingCoverage?.latestFilingPeriod || "unknown"}</p>
          <p className="text-sm mt-1">Completeness: {fi?.officialFilingCoverage?.filingCompleteness || "unknown"}</p>
          <p className="text-xs opacity-80 mt-2">{fi?.officialFilingCoverage?.notes || ""}</p>
        </div>

        <div className="mb-6 overflow-auto">
          <p className="text-[10px] font-mono text-[#1D3557]/50 uppercase tracking-widest mb-2">Financial Metrics</p>
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 border-b border-[#1D3557]/10">
                <th className="text-left py-2">Metric</th>
                <th className="text-left py-2">Value</th>
                <th className="text-left py-2">Period</th>
                <th className="text-left py-2">Source Type</th>
                <th className="text-left py-2">Source</th>
                <th className="text-left py-2">Conf.</th>
                <th className="text-left py-2">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {(fi?.financialSignals || []).map((item, i) => (
                <tr key={i} className="border-b border-[#1D3557]/10 last:border-0">
                  <td className="py-2 pr-2 text-xs font-semibold">{item.metric}</td>
                  <td className="py-2 pr-2 text-xs">{item.value}</td>
                  <td className="py-2 pr-2 text-xs">{item.period}</td>
                  <td className="py-2 pr-2 text-xs">{item.sourceType}</td>
                  <td className="py-2 pr-2 text-xs">{item.sourceName}</td>
                  <td className="py-2 pr-2 text-xs">{item.confidence}</td>
                  <td className="py-2 text-xs">{item.evidenceLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(fi?.financialSignals || []).length === 0 && (
            <p className="text-sm text-[#1D3557]/70 mt-2">No source-backed metrics in this run.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Ownership & Governance</p>
            <p className="text-sm text-[#1D3557]/85">Owner: {fi?.ownershipAndGovernance?.currentOwner || "Not found"}</p>
            <p className="text-sm text-[#1D3557]/85 mt-1">Signal: {fi?.ownershipAndGovernance?.ownershipSignal || "Not found"}</p>
            <p className="text-xs text-[#1D3557]/70 mt-2">{fi?.ownershipAndGovernance?.governanceNotes || ""}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Management Changes</p>
            <ul className="space-y-1">
              {(fi?.ownershipAndGovernance?.managementChanges || []).map((x, i) => <li key={i} className="text-sm text-[#1D3557]/80">• {x}</li>)}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50/60 p-4 rounded-lg border border-red-900/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Risk Radar</p>
            <ul className="space-y-2">
              {(fi?.riskFlags || []).map((r, i) => (
                <li key={i} className="text-sm text-[#1D3557]/85">
                  <span className="font-semibold">[{r.severity}]</span> {r.flag} - {r.whyItMatters}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#F5F3EF]/60 p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Stability Signals</p>
            <ul className="space-y-2">
              {(fi?.stabilitySignals || []).map((s, i) => (
                <li key={i} className="text-sm text-[#1D3557]/85">
                  <span className="font-semibold">[{s.strength}]</span> {s.signal} - {s.whyItMatters}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Timeline</p>
          <div className="space-y-2">
            {(fi?.timeline || []).map((t, i) => (
              <div key={i} className="bg-white p-3 rounded-md border border-[#1D3557]/10 text-sm text-[#1D3557]/85">
                <span className="font-semibold">{t.dateOrPeriod}</span> - {t.event} <span className="text-xs text-[#1D3557]/60">({t.type}, {t.importance})</span>
              </div>
            ))}
            {(fi?.timeline || []).length === 0 && <p className="text-sm text-[#1D3557]/70">No timeline items returned.</p>}
          </div>
        </div>

        <div className="bg-[#1D3557] text-[#F5F3EF] p-5 rounded-lg mb-6">
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-3">Score Dashboard</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {financialScores.map(([k, v]) => (
              <div key={k} className="bg-white/10 rounded-md p-3">
                <p className="text-[10px] uppercase tracking-widest opacity-70">{k}</p>
                <p className="text-xl font-bold">{v ?? "N/A"}/10</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Investor Take</p>
            <p className="text-sm text-[#1D3557]/85">{fi?.investorTake?.oneLineView || "N/A"}</p>
            <p className="text-xs text-[#1D3557]/75 mt-2">Attractive: {fi?.investorTake?.mostAttractiveSignal || "N/A"}</p>
            <p className="text-xs text-[#1D3557]/75 mt-1">Concern: {fi?.investorTake?.primaryConcern || "N/A"}</p>
            <p className="text-xs text-[#1D3557]/75 mt-1">Use case: {fi?.investorTake?.bestFitUseCase || "N/A"}</p>
            <p className="text-xs text-[#1D3557]/75 mt-1">Next: {fi?.investorTake?.recommendedNextStep || "N/A"}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#1D3557]/10">
            <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Bank Lens</p>
            <p className="text-sm text-[#1D3557]/85">{fi?.bankLens?.creditView || "N/A"}</p>
            <p className="text-xs text-[#1D3557]/75 mt-2">Caution: {fi?.bankLens?.underwritingCaution || "N/A"}</p>
            <p className="text-xs text-[#1D3557]/75 mt-1">Documentation: {fi?.bankLens?.documentationStrength || "N/A"}</p>
            <p className="text-xs text-[#1D3557]/75 mt-1">Next check: {fi?.bankLens?.recommendedNextCheck || "N/A"}</p>
          </div>
        </div>

        <div className="bg-[#F5F3EF]/60 p-4 rounded-lg border border-[#1D3557]/10 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Data Integrity</p>
          <p className="text-sm text-[#1D3557]/85">Official share: {fi?.dataIntegrity?.officialDataShare || "N/A"} | Non-official: {fi?.dataIntegrity?.nonOfficialDataShare || "N/A"}</p>
          <p className="text-xs text-[#1D3557]/75 mt-1">High: {fi?.dataIntegrity?.highConfidencePoints ?? "N/A"} | Medium: {fi?.dataIntegrity?.mediumConfidencePoints ?? "N/A"} | Low: {fi?.dataIntegrity?.lowConfidencePoints ?? "N/A"}</p>
          <ul className="mt-2 space-y-1">
            {(fi?.dataIntegrity?.mainUncertainties || []).map((u, i) => <li key={i} className="text-xs text-[#1D3557]/75">• {u}</li>)}
          </ul>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 mb-2">Top Recommendations</p>
          <ul className="space-y-1">
            {(fi?.topRecommendations || []).map((r, i) => <li key={i} className="text-sm text-[#1D3557]/85">• {r}</li>)}
          </ul>
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
  };

  const IdeaResultsDashboard = () => {
    const r = analysisResult || {};
    const scoreCards = [
      ["Market", r.marketDemand?.score],
      ["Problem", r.consumerProblems?.score],
      ["Competitors", r.competitors?.score],
      ["Products", r.popularProducts?.score],
      ["Mechanism", r.mechanismValidation?.score],
      ["Architecture", r.productArchitecture?.score],
      ["Pricing", r.pricing?.score],
      ["Distribution", r.distribution?.score],
      ["Angles", r.marketingAngles?.score],
      ["Overall", r.opportunityScore?.overallScore],
    ];

    const compRow = (c, idx) => (
      <tr key={`${c.brand}-${idx}`} className="border-b last:border-0 border-[#1D3557]/10">
        <td className="py-2 pr-2 text-xs font-semibold">{c.brand}</td>
        <td className="py-2 pr-2 text-xs">{c.category}</td>
        <td className="py-2 pr-2 text-xs">{c.priceRange}</td>
        <td className="py-2 pr-2 text-xs">{c.relevance}</td>
        <td className="py-2 text-xs text-[#1D3557]/75">{c.weakness}</td>
      </tr>
    );

    return (
      <div className="min-h-screen pt-32 pb-20 px-4 md:px-12 animate-fadeIn max-w-6xl mx-auto space-y-6">
        <div className="border-b border-[#1D3557]/10 pb-8">
          <h2 className="text-4xl font-serif text-[#1D3557] mb-2">{r.reportTitle || "Strategic Intelligence Report"}</h2>
          <p className="text-[#1D3557]/60 font-light">
            Idea audit complete for <span className="font-medium">{r.ideaName || formData.ideaDescription || "provided concept"}</span>
          </p>
        </div>

        <section className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Idea Summary</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#1D3557]/85">
            <p><span className="font-semibold">One-liner:</span> {r.ideaSummary?.oneLiner || "N/A"}</p>
            <p><span className="font-semibold">Core problem:</span> {r.ideaSummary?.coreProblem || "N/A"}</p>
            <p><span className="font-semibold">Target user:</span> {r.ideaSummary?.targetUser || "N/A"}</p>
            <p><span className="font-semibold">Mechanism:</span> {r.ideaSummary?.mechanism || "N/A"}</p>
          </div>
          <p className="mt-3 text-sm"><span className="font-semibold">Immediate verdict:</span> {r.ideaSummary?.immediateVerdict || "N/A"}</p>
        </section>

        <section className="bg-[#1D3557] text-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-white/65 font-bold mb-4">Scoreboard</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {scoreCards.map(([k, v]) => (
              <div key={k} className="bg-white/10 rounded-md p-3">
                <p className="text-[10px] uppercase tracking-widest text-white/70">{k}</p>
                <p className="text-2xl font-bold">{v ?? "N/A"}/10</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Market Demand Signals</h3>
          <div className="space-y-2">
            {(r.marketDemand?.signals || []).map((s, i) => (
              <div key={i} className="p-3 rounded-md bg-[#F5F3EF]/70 text-sm">
                <span className="font-semibold">{s.signalType}:</span> {s.label} <span className="uppercase text-[10px] ml-2 px-2 py-0.5 rounded bg-[#1D3557]/10">{s.strength}</span>
                <p className="text-xs text-[#1D3557]/70 mt-1">{s.whatItSuggests}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm"><span className="font-semibold">Action:</span> {r.marketDemand?.recommendedAction || "N/A"}</p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Competitor Intelligence</h3>
          <div className="space-y-5">
            {[["Direct", r.competitors?.direct || []], ["Indirect", r.competitors?.indirect || []], ["Substitutes", r.competitors?.substitutes || []]].map(([name, rows]) => (
              <div key={name} className="bg-[#F5F3EF]/35 p-4 rounded-md">
                <h4 className="font-semibold text-sm mb-2">{name}</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-[#1D3557]/55">
                      <th className="text-left py-1">Brand</th><th className="text-left py-1">Cat</th><th className="text-left py-1">Price</th><th className="text-left py-1">Rel</th><th className="text-left py-1">Gap</th>
                    </tr>
                  </thead>
                  <tbody>{rows.map(compRow)}</tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm"><span className="font-semibold">White-space:</span> {r.competitors?.whiteSpaceOpportunity || "N/A"}</p>
          <p className="mt-1 text-sm"><span className="font-semibold">Action:</span> {r.competitors?.recommendedAction || "N/A"}</p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Popular Product Intelligence</h3>
          <div className="space-y-2">
            {(r.popularProducts?.items || []).map((p, i) => (
              <div key={i} className="p-3 rounded-md bg-[#F5F3EF]/70">
                <p className="text-sm font-semibold">{p.productType} <span className="font-normal text-[#1D3557]/70">({p.example})</span></p>
                <p className="text-xs text-[#1D3557]/70">{p.whyItSells} | {p.priceRange} | Repeat: {p.repeatPurchasePotential} | Fit: {p.fitForIdea}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm"><span className="font-semibold">Best fits:</span> {(r.popularProducts?.bestFitsForThisIdea || []).join(", ") || "N/A"}</p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Product Architecture</h3>
            <p className="text-sm"><span className="font-semibold">Core:</span> {r.productArchitecture?.recommendedCoreProduct || "N/A"}</p>
            <p className="text-sm mt-2"><span className="font-semibold">Bundle:</span> {r.productArchitecture?.bundleIdea || "N/A"}</p>
            <p className="text-sm mt-2"><span className="font-semibold">Starter box:</span> {r.productArchitecture?.starterBoxRecommendation || "N/A"}</p>
            <p className="text-sm mt-2"><span className="font-semibold">Repeat engine:</span> {r.productArchitecture?.repeatPurchaseEngine || "N/A"}</p>
            <p className="text-sm mt-2"><span className="font-semibold">Action:</span> {r.productArchitecture?.recommendedAction || "N/A"}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Pricing & Positioning</h3>
            <p className="text-sm"><span className="font-semibold">Recommended price:</span> {r.pricing?.recommendedPricePosition || "N/A"}</p>
            <p className="text-sm mt-2"><span className="font-semibold">First test price:</span> {r.pricing?.firstTestPrice || "N/A"}</p>
            <p className="text-sm mt-2"><span className="font-semibold">Positioning statement:</span> {r.positioning?.positioningStatement || "N/A"}</p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Beauty / Adjacent Product Recommendations</h3>
          <ul className="space-y-2">
            {(r.productArchitecture?.beautyProductRecommendations || []).map((x, i) => (
              <li key={i} className="text-sm">• {x}</li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">30-Day Founder Action Plan</h3>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#1D3557]/55 border-b border-[#1D3557]/10">
                <th className="text-left py-2">Week</th>
                <th className="text-left py-2">Objective</th>
                <th className="text-left py-2">Key Actions</th>
                <th className="text-left py-2">Expected Output</th>
              </tr>
            </thead>
            <tbody>
              {(r.founderActionPlan || []).map((w, i) => (
                <tr key={i} className="border-b last:border-0 border-[#1D3557]/10">
                  <td className="py-3 pr-2 text-xs font-semibold">{w.week}</td>
                  <td className="py-3 pr-2 text-xs">{w.objective}</td>
                  <td className="py-3 pr-2 text-xs">{(w.keyActions || []).join(" | ")}</td>
                  <td className="py-3 text-xs">{w.expectedOutput}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white p-6 rounded-xl border border-[#1D3557]/5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-[#1D3557]/60 font-bold mb-3">Top Recommendations</h3>
          <ul className="space-y-2">
            {(r.topRecommendations || []).map((x, i) => <li key={i} className="text-sm">• {x}</li>)}
          </ul>
        </section>
      </div>
    );
  };

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
        {step === 'results' && (auditMode === 'idea' ? IdeaResultsDashboard() : ResultsDashboard())}
        {step === 'contact' && ContactForm()}
        {step === 'success' && SuccessScreen()}
      </main>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out forwards;
          }
          @keyframes pulseGlow {
            0%, 100% { transform: scale(0.9); opacity: 0.25; }
            50% { transform: scale(1.2); opacity: 0.55; }
          }
          .animate-pulseGlow {
            animation: pulseGlow 1.8s ease-in-out infinite;
          }
          @keyframes shimmerBar {
            0% { filter: saturate(0.9) brightness(0.95); }
            50% { filter: saturate(1.1) brightness(1.05); }
            100% { filter: saturate(0.9) brightness(0.95); }
          }
          .animate-shimmerBar {
            animation: shimmerBar 1.4s ease-in-out infinite;
          }
          @keyframes floatY {
            0%, 100% { transform: translateY(-1px); }
            50% { transform: translateY(-5px); }
          }
          .animate-floatY {
            animation: floatY 1.6s ease-in-out infinite;
          }
          @keyframes blinkDot {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 1; }
          }
          .animate-blinkDot {
            animation: blinkDot 1.2s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default App;
