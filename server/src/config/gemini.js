const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model (use gemini-1.5-flash for text generation - faster and cheaper than gemini-1.5-pro)
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });



/**
 * Generate tags for code snippet
 */
async function generateTags(code, language) {
  try {
    const prompt = `Analyze this ${language} code and provide 5-7 relevant tags. 
Include tags for: programming concepts, patterns, difficulty level, use cases.
Return ONLY a comma-separated list of tags, no explanation.

Code:
${code}

Tags:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse comma-separated tags
    const tags = text
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 7);
    
    return tags;
  } catch (error) {
    console.error('[Gemini] Error generating tags:', error.message || error);
    throw error;
  }
}

/**
 * Generate explanation for code snippet
 */
async function generateExplanation(code, language) {
  try {
    const prompt = `Explain this ${language} code in simple, clear terms.

Structure your explanation as:
1. What it does (1-2 sentences)
2. How it works (step-by-step, 3-5 points)
3. Time and space complexity (if applicable)

Code:
${code}

Explanation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('[Gemini] Error generating explanation:', error.message || error);
    throw error;
  }
}

/**
 * Generate interview Q&A from code snippet
 */
async function generateInterviewQA(code, language, explanation) {
  try {
    const prompt = `Based on this ${language} code, generate an interview-style question and answer.

Code:
${code}

Explanation:
${explanation}

Generate:
1. QUESTION: A realistic interview question (1 sentence)
2. ANSWER: The answer using this code (2-3 sentences)
3. FOLLOW_UP: One optimization or follow-up question (1 sentence)

Format as JSON:
{
  "question": "...",
  "answer": "...",
  "followUp": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (parseError) {
      // If JSON parsing fails, return default structure
      return {
        question: "How would you implement this solution?",
        answer: explanation.substring(0, 200) + "...",
        followUp: "Can you optimize this further?"
      };
    }
  } catch (error) {
    console.error('Error generating interview Q&A:', error);
    return null;
  }
}

/**
 * Detect time/space complexity
 */
async function detectComplexity(code, language) {
  try {
    const prompt = `Analyze the time and space complexity of this ${language} code.
Return ONLY the complexity in this exact format: "Time: O(n), Space: O(1)"
If you cannot determine, return "Time: N/A, Space: N/A"

Code:
${code}

Complexity:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    return text;
  } catch (error) {
    console.error('[Gemini] Error detecting complexity:', error.message || error);
    return 'N/A';
  }
}

module.exports = {
  model,
  generateTags,
  generateExplanation,
  generateInterviewQA,
  detectComplexity
};
