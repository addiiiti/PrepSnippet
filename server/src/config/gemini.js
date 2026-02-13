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
    // Array of different question types to ensure variety
    const questionTypes = [
      "conceptual understanding and how this code works internally",
      "implementation details and design choices",
      "optimization opportunities and performance improvements",
      "edge cases and potential bugs in this code",
      "time and space complexity analysis",
      "debugging approach if this code fails",
      "comparison with alternative implementations",
      "real-world use cases and scalability",
      "code quality and best practices",
      "testing strategy for this implementation"
    ];
    
    // Randomly select 2 different question types for variety
    const shuffled = questionTypes.sort(() => 0.5 - Math.random());
    const type1 = shuffled[0];
    const type2 = shuffled[1];
    
    // Add timestamp to ensure different results each time
    const timestamp = Date.now();
    
    const prompt = `Based on this ${language} code, generate TWO DIFFERENT interview questions focusing on:
1. ${type1}
2. ${type2}

Make sure the questions are UNIQUE and DIFFERENT from each other. Use different perspectives and approaches.

Code:
${code}

Explanation:
${explanation}

Session ID: ${timestamp}

Generate:
1. QUESTION: A realistic technical interview question about ${type1} (1-2 sentences)
2. ANSWER: A thorough, detailed answer with examples and explanation (4-6 sentences minimum, covering reasoning, implementation details, and implications)
3. FOLLOW_UP: A challenging follow-up question about ${type2} (1-2 sentences)
4. FOLLOW_UP_ANSWER: A comprehensive answer to the follow-up question (4-6 sentences minimum, with specific technical details and code examples where relevant)

IMPORTANT:
- Make ALL answers COMPREHENSIVE and DETAILED with technical depth
- Include specific examples from the code in BOTH answers
- Explain the "why" not just the "what" in BOTH answers
- Each regeneration should produce DIFFERENT questions

Format as JSON:
{
  "question": "...",
  "answer": "...",
  "followUp": "...",
  "followUpAnswer": "..."
}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig: {
        temperature: 0.9, // Increased for more variety
        maxOutputTokens: 1500, // Increased for longer answers with follow-up answer
      },
    });
    
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
        followUp: "Can you optimize this further?",
        followUpAnswer: "Consider analyzing the time and space complexity, look for redundant operations, and evaluate if there are more efficient data structures or algorithms that could be applied to this specific use case."
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
