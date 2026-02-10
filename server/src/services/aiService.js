const { 
  generateTags, 
  generateExplanation, 
  generateInterviewQA,
  detectComplexity 
} = require('../config/llama');

/**
 * Analyze code snippet with AI
 * Returns tags, explanation, and complexity
 */
async function analyzeSnippet(code, language) {
  try {

    // Validate inputs
    if (!code || typeof code !== 'string') {
      console.warn('Invalid code provided to analyzeSnippet');
      return {
        aiTags: [],
        aiExplanation: '',
        complexity: 'N/A'
      };
    }

    // Run AI tasks in parallel for faster response
    const [tags, explanation, complexity] = await Promise.allSettled([
      generateTags(code, language),
      generateExplanation(code, language),
      detectComplexity(code, language)
    ]);

    return {
      aiTags: tags.status === 'fulfilled' ? tags.value : [],
      aiExplanation: explanation.status === 'fulfilled' ? explanation.value : '',
      complexity: complexity.status === 'fulfilled' ? complexity.value : 'N/A'
    };
  } catch (error) {
    console.error('Error in analyzeSnippet:', error);
    // Always return safe fallback values
    return {
      aiTags: [],
      aiExplanation: '',
      complexity: 'N/A'
    };
  }
}

/**
 * Generate interview Q&A for snippet
 */
async function generateInterview(code, language, explanation) {
  try {
    
    // Validate inputs
    if (!code || typeof code !== 'string' || !explanation) {
      console.warn('Invalid inputs provided to generateInterview');
      return null;
    }
    
    const interviewQA = await generateInterviewQA(code, language, explanation);
    
    return interviewQA;
  } catch (error) {
    console.error('Error in generateInterview:', error);
    return null;
  }
}

module.exports = {
  analyzeSnippet,
  generateInterview
};
