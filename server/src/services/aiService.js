const { generateStructuredAnalysis } = require('../config/analysis');

const GENERIC_PHRASES = [
  'this code efficiently',
  'handles edge cases',
  'improves performance',
  'works correctly',
  'uses an efficient approach',
  'is optimal',
  'follows a good approach',
  'this solution efficiently',
  'good approach',
  'best approach',
  'this approach takes advantage',
  'leveraging the property',
];

function wordCount(text = '') {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function containsAnyGenericPhrase(text = '') {
  const lower = String(text || '').toLowerCase();
  return GENERIC_PHRASES.some((phrase) => lower.includes(phrase));
}

function scoreSummary(summary = '', classification = {}) {
  let score = 0;

  if (wordCount(summary) >= 10 && wordCount(summary) <= 75) score += 15;
  if (!containsAnyGenericPhrase(summary)) score += 15;

  if (classification?.codeState === 'incomplete_template') {
    if (/incomplete|missing|blank|placeholder/i.test(summary)) score += 20;
  } else {
    score += 10;
  }

  return Math.min(score, 50);
}

function scoreWhyItWorks(text = '', classification = {}) {
  let score = 0;

  if (wordCount(text) >= 12) score += 10;
  if (!containsAnyGenericPhrase(text)) score += 15;

  const patternSignals = {
    binary_search: /sorted|middle|half|boundary|search space|left|right|monotonic|invariant/i,
    dynamic_programming: /state|recurrence|subproblem|transition|base case|previous/i,
    grid_dfs: /visited|bounds|neighbor|connected|recursive|cell/i,
    grid_bfs: /queue|level|visited|neighbor|cell/i,
    graph_traversal: /visited|adjacency|neighbor|component|edge/i,
    hash_map: /lookup|mapping|key|collision|index|value/i,
    linked_list_reversal: /prev|curr|next|pointer|rewire|lose/i,
    two_pointers: /left|right|pointer|sorted|move|invariant/i,
    sliding_window: /window|expand|shrink|frequency|invariant/i,
    recursion_backtracking: /base case|choice|backtrack|state|revert/i,
    tree_traversal: /node|left|right|stack|queue|traversal/i,
  };

  const signalRegex =
    patternSignals[classification?.detectedPattern] ||
    /because|invariant|state|boundary|pointer|mapping|property/i;

  if (signalRegex.test(text)) score += 25;

  return Math.min(score, 50);
}

function scoreComplexity(complexity = {}, classification = {}) {
  let score = 0;

  if (complexity?.time) score += 10;
  if (complexity?.space) score += 10;
  if (complexity?.reasoning && wordCount(complexity.reasoning) >= 8) score += 20;
  if (!containsAnyGenericPhrase(complexity?.reasoning || '')) score += 10;

  if (
    classification?.detectedPattern === 'binary_search' &&
    !/log/i.test(String(complexity?.time || ''))
  ) {
    // Only penalize if there's no log factor at all — this catches models that output O(n) for binary search
    score -= 20;
  }

  return Math.max(0, Math.min(score, 50));
}

function scoreFollowUps(followUps = [], classification = {}) {
  if (!Array.isArray(followUps) || followUps.length === 0) return 0;

  let score = 0;
  const joinedQuestions = followUps
    .map((f) => String(f?.question || '').toLowerCase())
    .join(' || ');

  for (const item of followUps) {
    const q = String(item?.question || '').trim();
    const a = String(item?.answer || '').trim();

    if (q.length >= 12 && q.length <= 160) score += 8;
    if (a.length >= 18 && a.length <= 320) score += 8;

    if (!containsAnyGenericPhrase(q) && !containsAnyGenericPhrase(a)) {
      score += 6;
    }
  }

  const patternSignals = {
    binary_search: /first occurrence|last occurrence|sorted|boundary|l <= r|l < r|mid|overflow/i,
    dynamic_programming: /state|recurrence|base case|optimi|previous two|space/i,
    grid_dfs: /visited|diagonal|bounds|in-place|stack overflow/i,
    hash_map: /collision|index|value|duplicate|lookup|memory/i,
    linked_list_reversal: /prev|curr|next|pointer|lose|rewire|order/i,
  };

  const regex = patternSignals[classification?.detectedPattern];
  if (regex && regex.test(joinedQuestions)) score += 18;

  if (classification?.codeState === 'incomplete_template') {
    if (/missing|blank|pointer|step|lose/i.test(joinedQuestions)) score += 12;
  }

  return Math.min(score, 50);
}

function scoreEdgeCases(edgeCases = [], classification = {}) {
  if (!Array.isArray(edgeCases) || edgeCases.length === 0) return 0;

  let score = 0;
  if (edgeCases.length >= 3) score += 20;

  const joined = edgeCases.join(' ').toLowerCase();

  if (classification?.detectedPattern === 'linked_list_reversal') {
    if (/empty|single|two node|one node/i.test(joined)) score += 20;
  } else if (classification?.detectedPattern === 'binary_search') {
    if (/empty|not found|single|boundary|sorted/i.test(joined)) score += 20;
  } else if (classification?.detectedPattern === 'grid_dfs') {
    if (/empty|single|bounds|all water|all land/i.test(joined)) score += 20;
  } else {
    if (/empty|single|duplicate|boundary|null|not found|invalid/i.test(joined)) score += 20;
  }

  return Math.min(score, 40);
}

function scoreCommonMistakes(commonMistakes = [], classification = {}) {
  if (!Array.isArray(commonMistakes) || commonMistakes.length === 0) return 0;

  let score = 0;
  if (commonMistakes.length >= 2) score += 15;

  const joined = commonMistakes.join(' ').toLowerCase();

  if (classification?.detectedPattern === 'linked_list_reversal') {
    if (/prev|curr|next|pointer|lose/i.test(joined)) score += 25;
  } else if (classification?.detectedPattern === 'binary_search') {
    if (/off-by-one|mid|overflow|boundary|l|r/i.test(joined)) score += 25;
  } else if (classification?.detectedPattern === 'dynamic_programming') {
    if (/base case|state|transition|space/i.test(joined)) score += 25;
  } else {
    if (/off-by-one|boundary|base case|pointer|duplicate|state|visited/i.test(joined))
      score += 25;
  }

  return Math.min(score, 40);
}

function scoreInterviewPitch(pitch = '', classification = {}) {
  let score = 0;

  if (wordCount(pitch) >= 12 && wordCount(pitch) <= 90) score += 15;
  if (!containsAnyGenericPhrase(pitch)) score += 15;

  if (
    /i use|i maintain|i store|i move|i mark|i save|i compare|i shrink|i expand|i reverse|i check/i.test(
      pitch.toLowerCase()
    )
  ) {
    score += 20;
  }

  if (classification?.codeState === 'incomplete_template') {
    if (/incomplete|missing|intended/i.test(pitch.toLowerCase())) score += 10;
  }

  return Math.min(score, 50);
}

function evaluateAnalysisQuality(analysis, classification = {}) {
  const breakdown = {
    summary: scoreSummary(analysis?.summary, classification),
    whyItWorks: scoreWhyItWorks(analysis?.whyItWorks, classification),
    complexity: scoreComplexity(analysis?.complexity, classification),
    followUps: scoreFollowUps(analysis?.followUps, classification),
    edgeCases: scoreEdgeCases(analysis?.edgeCases, classification),
    commonMistakes: scoreCommonMistakes(analysis?.commonMistakes, classification),
    interviewPitch30Sec: scoreInterviewPitch(analysis?.interviewPitch30Sec, classification),
  };

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  let verdict = 'weak';
  if (total >= 195) verdict = 'strong';
  else if (total >= 140) verdict = 'usable';

  return { score: total, verdict, breakdown };
}

function buildImprovementFlags(analysis, quality, classification = {}) {
  const flags = [];

  if (!analysis?.pattern) flags.push('missing_pattern');
  if (!analysis?.whyItWorks) flags.push('missing_why_it_works');
  if (!analysis?.interviewPitch30Sec) flags.push('missing_interview_pitch');
  if (!analysis?.complexity?.time || !analysis?.complexity?.space) {
    flags.push('missing_complexity');
  }
  if (!analysis?.followUps || analysis.followUps.length < 2) {
    flags.push('weak_followups');
  }
  if (!analysis?.edgeCases || analysis.edgeCases.length < 2) {
    flags.push('weak_edge_cases');
  }
  if (!analysis?.commonMistakes || analysis.commonMistakes.length < 2) {
    flags.push('weak_common_mistakes');
  }
  if (quality.score < 140) flags.push('low_quality_score');
  if (classification?.codeState === 'incomplete_template') {
    if (!/incomplete|missing|blank|placeholder/i.test(analysis?.summary || '')) {
      flags.push('did_not_acknowledge_incomplete_code');
    }
  }

  return flags;
}

function mapAnalysisToLegacyFields(analysis) {
  const aiTags = Array.isArray(analysis?.tags) ? analysis.tags.slice(0, 3) : [];
  const aiExplanation = analysis?.summary || '';
  const time = analysis?.complexity?.time || 'N/A';
  const space = analysis?.complexity?.space || 'N/A';
  const complexity = `Time: ${time}, Space: ${space}`;

  const interviewQuestions = Array.isArray(analysis?.followUps)
    ? analysis.followUps.slice(0, 3).map((item) => ({
        question: item.question,
        answer: item.answer,
      }))
    : [];

  return { aiTags, aiExplanation, complexity, interviewQuestions };
}

function getFallbackResponse() {
  const classification = {
    detectedPattern: 'generic_algorithm',
    codeState: 'unknown',
    confidence: 0.4,
    reasoning: 'Fallback classification used.',
  };

  const analysis = {
    summary: '',
    pattern: '',
    whyItWorks: '',
    interviewPitch30Sec: '',
    complexity: { time: 'N/A', space: 'N/A', reasoning: '' },
    edgeCases: [],
    commonMistakes: [],
    optimizations: [],
    followUps: [],
    tags: [],
  };

  return {
    classification,
    analysis,
    quality: {
      score: 0,
      verdict: 'weak',
      breakdown: {
        summary: 0,
        whyItWorks: 0,
        complexity: 0,
        followUps: 0,
        edgeCases: 0,
        commonMistakes: 0,
        interviewPitch30Sec: 0,
      },
    },
    improvementFlags: ['generation_failed'],
    rawText: '',
    aiTags: [],
    aiExplanation: '',
    complexity: 'Time: N/A, Space: N/A',
    interviewQuestions: [],
  };
}

async function analyzeSnippet(code, language) {
  try {
    if (!code || typeof code !== 'string') {
      console.warn('[aiService] Invalid code provided to analyzeSnippet');
      return getFallbackResponse();
    }

    const firstAttempt = await generateStructuredAnalysis(code, language, {
      strictMode: false,
    });

    let chosenAnalysis = firstAttempt.analysis;
    let chosenRawText = firstAttempt.rawText;
    let chosenClassification = firstAttempt.classification;
    let quality = evaluateAnalysisQuality(chosenAnalysis, chosenClassification);

    if (quality.score < 140) {
      console.warn(
        `[aiService] First attempt scored ${quality.score} (weak). Retrying with strictMode.`
      );

      const secondAttempt = await generateStructuredAnalysis(code, language, {
        strictMode: true,
        classification: chosenClassification, // Reuse classification — saves one API call
      });

      const secondQuality = evaluateAnalysisQuality(
        secondAttempt.analysis,
        secondAttempt.classification
      );

      console.info(
        `[aiService] Retry scored ${secondQuality.score} vs original ${quality.score}.`
      );

      if (secondQuality.score >= quality.score) {
        chosenAnalysis = secondAttempt.analysis;
        chosenRawText = secondAttempt.rawText;
        chosenClassification = secondAttempt.classification;
        quality = secondQuality;
      }
    }

    const improvementFlags = buildImprovementFlags(
      chosenAnalysis,
      quality,
      chosenClassification
    );

    const legacy = mapAnalysisToLegacyFields(chosenAnalysis);

    return {
      classification: chosenClassification,
      analysis: chosenAnalysis,
      quality,
      improvementFlags,
      rawText: chosenRawText,
      ...legacy,
    };
  } catch (error) {
    console.error('[aiService] Error in analyzeSnippet:', error);
    return getFallbackResponse();
  }
}

async function generateInterview(code, language) {
  try {
    if (!code || typeof code !== 'string') {
      console.warn('[aiService] Invalid code provided to generateInterview');
      return [];
    }

    const result = await analyzeSnippet(code, language);

    return Array.isArray(result.analysis.followUps)
      ? result.analysis.followUps.slice(0, 3).map((item) => ({
          question: item.question,
          answer: item.answer,
          intent: item.intent,
        }))
      : [];
  } catch (error) {
    console.error('[aiService] Error in generateInterview:', error);
    return [];
  }
}

module.exports = {
  analyzeSnippet,
  generateInterview,
  evaluateAnalysisQuality,
};