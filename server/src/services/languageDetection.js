/**
 * languageDetection.js
 *
 * FIX: C vs C++ misdetection.
 * 
 * The original code had `#include <` and `int main()` in BOTH the cpp and c pattern lists.
 * Any C code with those two constructs scored equally on both, and C++ won ties due to more
 * patterns in its list.
 *
 * Fix: C++-specific patterns are things ONLY C++ uses. We give C explicit "negative" signals
 * for C++-exclusive constructs to break the tie correctly.
 */

function detectLanguage(code) {
  const patterns = {
    javascript: [
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /function\s+\w+\s*\(/,
      /=>\s*{/,
      /console\.log/,
      /require\(/,
      /import\s+.*from/,
    ],
    python: [
      /def\s+\w+\s*\(/,
      /^import\s+\w+/m,
      /from\s+\w+\s+import/,
      /print\(/,
      /if\s+__name__\s*==\s*['"]__main__['"]/,
      /elif\s+/,
      // Python-specific: indented blocks end without braces
      /:\s*\n\s+\w/,
    ],
    java: [
      /public\s+class\s+\w+/,
      /public\s+static\s+void\s+main/,
      /System\.out\.println/,
      /private\s+\w+\s+\w+/,
      /public\s+\w+\s+\w+\s*\(/,
      /import\s+java\./,
    ],
    // FIX: cpp patterns must be EXCLUSIVE to C++ — things C cannot have
    cpp: [
      /std::/,                    // C++ standard library namespace
      /cout\s*<</,               // C++ stream output
      /cin\s*>>/,                // C++ stream input
      /using\s+namespace\s+std/, // C++ only
      /::\s*\w+/,                // Scope resolution operator (C++ only)
      /new\s+\w+/,               // C++ new keyword
      /delete\s+\w+/,            // C++ delete keyword
      /template\s*</,            // C++ templates
      /class\s+\w+\s*{/,        // C++ class (not struct)
      /#include\s*<(iostream|vector|string|algorithm|map|set|unordered_map)>/, // C++ headers
    ],
    // C-specific patterns that don't appear in C++
    c: [
      /#include\s*<(stdio|stdlib|string|math|time|ctype|assert|limits)\.h>/,
      /printf\s*\(/,
      /scanf\s*\(/,
      /malloc\s*\(/,
      /free\s*\(/,
      /NULL\b(?!ptr)/,           // NULL is C; C++ uses nullptr
      /typedef\s+struct/,        // Common in C
    ],
    typescript: [
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /:\s*string\b/,
      /:\s*number\b/,
      /<\w+>/,
      /as\s+\w+/,
    ],
    html: [
      /<html/i,
      /<div/i,
      /<span/i,
      /<head>/i,
      /<body>/i,
      /<!DOCTYPE/i,
    ],
    css: [
      /\{\s*[\w-]+:\s*[^}]+\}/,
      /@media/,
      /\.[\w-]+\s*\{/,
      /#[\w-]+\s*\{/,
    ],
    sql: [
      /SELECT\s+.*FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i,
    ],
    go: [
      /package\s+main/,
      /func\s+\w+\s*\(/,
      /fmt\.Print/,
      /go\s+func/,
      /:=\s*/,
    ],
    rust: [
      /fn\s+\w+\s*\(/,
      /let\s+mut\b/,
      /println!/,
      /impl\s+\w+/,
      /use\s+std::/,
    ],
    ruby: [
      /def\s+\w+/,
      /^end$/m,
      /puts\s+/,
      /class\s+\w+\s*<?\s*\w*/,
      /@\w+\s*=/,
    ],
    php: [
      /<\?php/,
      /\$\w+\s*=/,
      /echo\s+/,
      /namespace\s+\w+/,
    ],
  };

  const scores = {};

  for (const [lang, langPatterns] of Object.entries(patterns)) {
    scores[lang] = 0;
    for (const pattern of langPatterns) {
      if (pattern.test(code)) {
        scores[lang]++;
      }
    }
  }

  // Tiebreaker: if both c and cpp are tied, prefer c only if there are
  // no C++-exclusive constructs (std::, cout, cin, templates, class).
  // This runs after scoring to avoid needing special-cased weights.
  if (scores.cpp > 0 && scores.c > 0) {
    const hasCppExclusive = /std::|cout|cin|template\s*<|::\s*\w+|new\s+\w+|delete\s+\w+/.test(code);
    if (!hasCppExclusive) {
      // Downgrade cpp score to break the tie in favor of c
      scores.cpp = Math.max(0, scores.cpp - scores.c);
    }
  }

  let detectedLang = 'plaintext';
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  return maxScore > 0 ? detectedLang : 'plaintext';
}

function getLanguageDisplayName(lang) {
  const displayNames = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    typescript: 'TypeScript',
    html: 'HTML',
    css: 'CSS',
    sql: 'SQL',
    go: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    php: 'PHP',
    plaintext: 'Plain Text',
  };

  return displayNames[lang] || lang.toUpperCase();
}

module.exports = { detectLanguage, getLanguageDisplayName };