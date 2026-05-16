/*
 llama.js
 Uses Groq's llama-3.3-70b-versatile — the strongest free model on Groq.
 */

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';
//Pattern-specific hints injected into the prompt.
function getPatternHints(pattern) {
  const hints = {
    binary_search: `
BINARY SEARCH RULES (follow strictly):
- complexity.time MUST be O(log n) for 1D binary search. Do NOT write O(n).
- whyItWorks MUST explain the loop invariant: what is guaranteed at the start of each iteration.
- commonMistakes MUST include: the off-by-one risk (< vs <=) AND the mid overflow bug (use left + (right-left)/2).
- followUps[2].question MUST ask: "How would you modify this to find the last occurrence instead of the first?"`,

    linked_list_reversal: `
LINKED LIST REVERSAL RULES (follow strictly):
- Identify if prev, curr, and next are ALL three assigned. If any is missing, set codeState to "incomplete_template".
- whyItWorks MUST name all three pointers by their variable names from the code and explain what each one tracks.
- If code is incomplete: summary MUST say which specific pointer assignment is missing.
- followUps[0] MUST ask about what happens with an empty list (head = null).`,

    dynamic_programming: `
DP RULES (follow strictly):
- State whether this is top-down (memoization) or bottom-up (tabulation).
- whyItWorks MUST state the recurrence relation in plain words.
- complexity.reasoning MUST explain: number of states × work per state.
- followUps[2] MUST ask: "How would you reduce the space complexity of this solution?"`,

    sliding_window: `
SLIDING WINDOW RULES:
- whyItWorks MUST identify the window invariant — what property is maintained as the window expands/shrinks.
- Name the shrink condition variable from the actual code.`,

    two_pointers: `
TWO POINTERS RULES:
- whyItWorks MUST state what left and right represent as an invariant.
- Note if the array must be sorted for correctness.
- followUps[1] MUST ask what breaks if the array is unsorted.`,

    grid_dfs: `
GRID DFS RULES:
- complexity.time for a full grid traversal is O(m×n). Do NOT write O(n²) unless it's square.
- whyItWorks MUST explain the visited/marking strategy that prevents infinite recursion.
- followUps[2] MUST ask about stack overflow risk for large grids and how to fix it iteratively.`,
  };

  return hints[pattern] || '';
}

/*
 * Step 1 prompt: Classify the code cheaply before full analysis.
 * Keeps full analysis prompt focused.
 */
function buildClassificationPrompt(code, language) {
  return `You are a senior software engineer. Classify this ${language} code snippet.

CODE:
\`\`\`${language}
${code}
\`\`\`

Reply with ONLY a JSON object. No explanation. No markdown fences. Raw JSON only.

{
  "detectedPattern": "<one of: binary_search | linked_list_reversal | dynamic_programming | grid_dfs | grid_bfs | sliding_window | two_pointers | hash_map | tree_traversal | graph_traversal | recursion_backtracking | sorting | generic_algorithm>",
  "codeState": "<one of: complete | incomplete_template | pseudocode | broken>",
  "confidence": <number 0.0 to 1.0>,
  "reasoning": "<one sentence>"
}

IMPORTANT: "incomplete_template" means the code is structurally there but missing key steps (e.g. a linked list reversal missing one of the three pointer assignments, a DP solution missing its transition). Set confidence <= 0.7 if incomplete.`;
}

/**
 * Step 2 prompt: Full structured analysis.
 */
function buildAnalysisPrompt(code, language, classification, strictMode = false) {
  const isIncomplete = classification?.codeState === 'incomplete_template';
  const pattern = classification?.detectedPattern || 'generic_algorithm';
  const patternHints = getPatternHints(pattern);

  const incompleteBlock = isIncomplete
    ? `
!! INCOMPLETE CODE DETECTED !!
- summary MUST start with: "This code is incomplete —" and name what is missing.
- whyItWorks MUST start with: "This code will not work as written because" and explain why.
- interviewPitch30Sec MUST acknowledge the incomplete state.
- Still provide the CORRECT complexity for the INTENDED algorithm assuming it were complete.
- followUps MUST include a question about what is missing and how to fix it.
`
    : '';

  const strictBlock = strictMode
    ? `
STRICT MODE ACTIVE. A previous attempt was rejected for low quality. Rules:
- Every sentence must reference a specific variable name, line, or structure from the code above.
- BANNED phrases (do not use any of these): "this code efficiently", "handles edge cases",
  "improves performance", "works correctly", "uses an efficient approach", "is optimal",
  "good approach", "best approach", "this approach", "leveraging".
- complexity.reasoning must name the exact loop or recursive call that drives complexity.
`
    : '';

  return `You are a senior software engineer helping a developer prepare for coding interviews.
Analyze the ${language} code below and produce a structured JSON analysis.
${incompleteBlock}${strictBlock}

DETECTED PATTERN: ${pattern}
${patternHints}

CODE:
\`\`\`${language}
${code}
\`\`\`

Reply with ONLY a raw JSON object. No markdown. No explanation outside the JSON. No \`\`\`json fences.

{
  "summary": "<2-4 sentences. What this specific code does. Name the algorithm and key variable names. DO NOT say 'this code efficiently' or 'handles edge cases'.>",

  "pattern": "<Short label, e.g. 'Binary Search', 'Sliding Window', 'Two Pointers', 'BFS on Grid'>",

  "whyItWorks": "<2-4 sentences. The core invariant or insight. Name the variables. Be specific to this code.>",

  "interviewPitch30Sec": "<What to say out loud in an interview. Must start with 'I '. 3-5 sentences. First person. Conversational. Mention the approach, why you chose it, and the key insight.>",

  "complexity": {
    "time": "<e.g. O(log n), O(n), O(n²), O(m × n)>",
    "space": "<e.g. O(1), O(n), O(h) for tree height>",
    "reasoning": "<1-2 sentences. Name the specific loop or recursion that causes this. E.g. 'The while loop runs at most log₂(n) times because the search space halves each iteration.'>",
  },

  "edgeCases": [
    "<Specific scenario + what happens. E.g. 'Empty array — the while loop never executes, returns -1 immediately'>",
    "<another specific edge case>",
    "<another specific edge case>"
  ],

  "commonMistakes": [
    "<Specific mistake with explanation. E.g. 'Using mid = (left+right)/2 causes integer overflow for large indices; use left + (right-left)/2 instead'>",
    "<another specific mistake>"
  ],

  "optimizations": [
    "<Only include REAL optimization opportunities. If code is already optimal, return empty array []>"
  ],

  "followUps": [
    {
      "question": "<Question testing understanding of the core mechanism. 1-2 sentences. Specific to this code.>",
      "answer": "<2-4 sentences answering it. Reference the code.>",
      "intent": "<what interviewer is testing, e.g. 'invariant understanding'>"
    },
    {
      "question": "<Question testing an edge case or corner condition specific to this code.>",
      "answer": "<2-4 sentences.>",
      "intent": "<e.g. 'edge case awareness'>"
    },
    {
      "question": "<Extension question: how would you change this if... Make it harder.>",
      "answer": "<2-4 sentences.>",
      "intent": "<e.g. 'pattern generalization'>"
    }
  ],

  "tags": ["<3-5 lowercase tags. Algorithm name, data structure, complexity class. No duplicates.>"]
}`;
}

// API CALL HELPERS

function emptyAnalysis() {
  return {
    summary: '',
    pattern: '',
    whyItWorks: '',
    interviewPitch30Sec: '',
    complexity: { time: '', space: '', reasoning: '' },
    edgeCases: [],
    commonMistakes: [],
    optimizations: [],
    followUps: [],
    tags: [],
  };
}

function normalizeAnalysis(raw) {
  if (!raw || typeof raw !== 'object') return emptyAnalysis();

  return {
    summary: String(raw.summary || ''),
    pattern: String(raw.pattern || ''),
    whyItWorks: String(raw.whyItWorks || ''),
    interviewPitch30Sec: String(raw.interviewPitch30Sec || ''),
    complexity: {
      time: String(raw.complexity?.time || ''),
      space: String(raw.complexity?.space || ''),
      reasoning: String(raw.complexity?.reasoning || ''),
    },
    edgeCases: Array.isArray(raw.edgeCases)
      ? raw.edgeCases.map(String).filter(Boolean)
      : [],
    commonMistakes: Array.isArray(raw.commonMistakes)
      ? raw.commonMistakes.map(String).filter(Boolean)
      : [],
    optimizations: Array.isArray(raw.optimizations)
      ? raw.optimizations.map(String).filter(Boolean)
      : [],
    followUps: Array.isArray(raw.followUps)
      ? raw.followUps
          .filter((f) => f && typeof f === 'object')
          .map((f) => ({
            question: String(f.question || ''),
            answer: String(f.answer || ''),
            intent: String(f.intent || ''),
          }))
          .filter((f) => f.question && f.answer)
      : [],
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t) => String(t).toLowerCase()).filter(Boolean).slice(0, 5)
      : [],
  };
}

async function callGroq(prompt, temperature = 0.2) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior software engineer. You respond only with raw JSON. No markdown, no explanation, no ```json fences. Just the JSON object.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}


// MAIN EXPORT — called by aiService.js


async function generateStructuredAnalysis(code, language, options = {}) {
  const { strictMode = false } = options;

  // ─ Step 1: Classify ─
  let classification = options.classification;

  if (!classification) {
    try {
      const classifyRaw = await callGroq(buildClassificationPrompt(code, language), 0.1);
      const cleaned = classifyRaw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      classification = JSON.parse(cleaned);
    } catch (err) {
      console.warn('[llama] Classification failed, using default:', err.message);
      classification = {
        detectedPattern: 'generic_algorithm',
        codeState: 'complete',
        confidence: 0.5,
        reasoning: 'Default fallback classification.',
      };
    }
  }

  // ─ Step 2: Full analysis ─
  let rawText = '';
  let analysis = emptyAnalysis();

  try {
    const prompt = buildAnalysisPrompt(code, language, classification, strictMode);
    rawText = await callGroq(prompt, 0.2);

    // Strip markdown fences if the model added them despite instructions
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    analysis = normalizeAnalysis(parsed);
  } catch (err) {
    console.error('[llama] Analysis failed:', err.message);
    console.error('[llama] Raw output was:', rawText.slice(0, 400));
    // Return empty — aiService.js handles retry
  }

  return {
    analysis,
    rawText,
    classification,
  };
}

module.exports = { generateStructuredAnalysis };