/**
 * Detect programming language from code
 * Simple pattern matching - can be improved with ML later
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
      /import\s+.*from/
    ],
    python: [
      /def\s+\w+\s*\(/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /print\(/,
      /if\s+__name__\s*==\s*['"']__main__['"']/,
      /:\s*$/m,
      /elif\s+/
    ],
    java: [
      /public\s+class\s+\w+/,
      /public\s+static\s+void\s+main/,
      /System\.out\.println/,
      /private\s+\w+\s+\w+/,
      /public\s+\w+\s+\w+\s*\(/,
      /import\s+java\./
    ],
    cpp: [
      /#include\s*</,
      /std::/,
      /cout\s*<</,
      /cin\s*>>/,
      /int\s+main\s*\(/,
      /using\s+namespace\s+std/
    ],
    c: [
      /#include\s*</,
      /printf\(/,
      /scanf\(/,
      /int\s+main\s*\(/,
      /malloc\(/,
      /free\(/
    ],
    typescript: [
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /:\s*string/,
      /:\s*number/,
      /<\w+>/,
      /as\s+\w+/
    ],
    html: [
      /<html/i,
      /<div/i,
      /<span/i,
      /<head>/i,
      /<body>/i,
      /<!DOCTYPE/i
    ],
    css: [
      /{\s*[\w-]+:\s*[^}]+}/,
      /@media/,
      /\.[\w-]+\s*{/,
      /#[\w-]+\s*{/
    ],
    sql: [
      /SELECT\s+.*FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i,
      /WHERE/i
    ],
    go: [
      /package\s+main/,
      /func\s+\w+\s*\(/,
      /import\s+\(/,
      /fmt\.Print/,
      /go\s+func/
    ],
    rust: [
      /fn\s+\w+\s*\(/,
      /let\s+mut/,
      /println!/,
      /impl\s+\w+/,
      /use\s+std::/
    ],
    ruby: [
      /def\s+\w+/,
      /end$/m,
      /puts\s+/,
      /require\s+['"']/,
      /class\s+\w+/,
      /@\w+/
    ],
    php: [
      /<\?php/,
      /\$\w+\s*=/,
      /echo\s+/,
      /function\s+\w+\s*\(/,
      /namespace\s+/
    ]
  };

  const scores = {};
  
  // Count pattern matches for each language
  for (const [lang, langPatterns] of Object.entries(patterns)) {
    scores[lang] = 0;
    for (const pattern of langPatterns) {
      if (pattern.test(code)) {
        scores[lang]++;
      }
    }
  }

  // Find language with highest score
  let detectedLang = 'plaintext';
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  // If no patterns matched, return plaintext
  return maxScore > 0 ? detectedLang : 'plaintext';
}

/**
 * Get language display name
 */
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
    plaintext: 'Plain Text'
  };

  return displayNames[lang] || lang.toUpperCase();
}

module.exports = {
  detectLanguage,
  getLanguageDisplayName
};
