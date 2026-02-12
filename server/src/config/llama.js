const Groq = require('groq-sdk');

// Initialize Groq API
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// LLaMA 3 model configuration (using current format)
const LLAMA_MODEL = 'llama-3.1-8b-instant';

/**
 * Generate tags for code snippet - LIMITED to 2-3 tags only
 */
async function generateTags(code, language) {
  try {
    const prompt = `Analyze this ${language} code and provide exactly 2-3 most relevant tags only.
Choose the MOST important tags from: programming concepts, patterns, difficulty level, or primary use case.
Return ONLY a comma-separated list of 2-3 tags, no explanation.

Code:
${code}

Tags:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: LLAMA_MODEL,
      temperature: 0.3,
      max_tokens: 100,
    });

    const text = completion.choices[0]?.message?.content || '';
    
    // Parse comma-separated tags - STRICT limit to 3 tags maximum
    const tags = text
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length < 30) // Filter out overly long tags
      .slice(0, 3); // HARD LIMIT: Maximum 3 tags
    
    return tags;
  } catch (error) {
    console.error('[LLaMA] Error generating tags:', error.message || error);
    throw error;
  }
}

/**
 * Generate SHORT and CONCISE explanation for code snippet
 */
async function generateExplanation(code, language) {
  try {
    const prompt = `Explain this ${language} code in 1-2 short sentences only. Be direct and concise.
Just describe what the code does without any headers, sections, or bullet points.
Do not include "Description:", "Use Cases:", or any other labels.

Code:
${code}

Explanation:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: LLAMA_MODEL,
      temperature: 0.3, 
      max_tokens: 150, // Reduced from 500 to force shorter responses
    });

    let text = completion.choices[0]?.message?.content || '';

    // Remove any headers or labels that might be added
    text = text.replace(/^(Description|Explanation|Summary):\s*/i, '');
    text = text.replace(/\*\*.*?\*\*/g, ''); // Remove bold markdown
    text = text.replace(/\n{2,}/g, ' '); // Replace multiple newlines with space
    text = text.trim();

    // If still too long, truncate to first 2 sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length > 2) {
      text = sentences.slice(0, 2).join(' ');
    }

    return text;
  } catch (error) {
    console.error('[LLaMA] Error generating explanation:', error.message || error);
    throw error;
  }
}

/**
 * Generate interview Q&A from code snippet
 */
async function generateInterviewQA(code, language, explanation) {
  try {
    const prompt = `You are a JSON generator. You MUST respond with ONLY valid JSON, no additional text, explanations, or markdown.

Based on this ${language} code, generate an interview-style question and answer.

Code:
${code}

Explanation:
${explanation}

Required JSON format (respond with ONLY this JSON object):
{
  "question": "A realistic interview question (1 sentence)",
  "answer": "The answer using this code (2-3 sentences)",
  "followUp": "One optimization or follow-up question (1 sentence)"
}

DO NOT include any text before or after the JSON object.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: LLAMA_MODEL,
      temperature: 0.6,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || '';
    
    // Safe JSON extraction with regex and multiple fallback strategies
    let parsed = null;
    
    try {
      // Strategy 1: Direct JSON parsing (for well-formatted responses)
      parsed = JSON.parse(text.trim());
    } catch (firstParseError) {
      
      try {
        // Strategy 2: Remove markdown code blocks and try again
        let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        parsed = JSON.parse(cleanText.trim());
      } catch (secondParseError) {
        try {
          // Strategy 3: Extract JSON using regex (handles mixed content)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON object found in response');
          }
        } catch (thirdParseError) {
          // Strategy 4: Try to extract individual fields using regex
          console.warn('[LLaMA] All JSON extraction methods failed, attempting field extraction...');
          
          const questionMatch = text.match(/["\']?question["\']?\s*:\s*["\']([^"']*)["\']?/i);
          const answerMatch = text.match(/["\']?answer["\']?\s*:\s*["\']([^"']*)["\']?/i);
          const followUpMatch = text.match(/["\']?follow[_\s]?up["\']?\s*:\s*["\']([^"']*)["\']?/i);
          
          if (questionMatch || answerMatch) {
            parsed = {
              question: questionMatch ? questionMatch[1] : "How would you implement this solution?",
              answer: answerMatch ? answerMatch[1] : explanation.length > 500 ? explanation.substring(0, 500) + "..." : explanation,
              followUp: followUpMatch ? followUpMatch[1] : "Can you optimize this further?"
            };
          } else {
            throw new Error('Could not extract fields from response');
          }
        }
      }
    }
    
    // Validate the parsed object has required fields
    if (parsed && typeof parsed === 'object' && parsed.question && parsed.answer && parsed.followUp) {
      return {
        question: String(parsed.question).trim(),
        answer: String(parsed.answer).trim(),
        followUp: String(parsed.followUp).trim()
      };
    }
    
    // Final fallback if all parsing strategies failed
    console.warn('[LLaMA] Failed to parse valid JSON response, using safe fallback');
    return {
      question: "How would you implement this solution?",
      answer: explanation.length > 500 ? explanation.substring(0, 500) + "..." : explanation,
      followUp: "Can you optimize this further?"
    };
    
  } catch (error) {
    console.error('[LLaMA] Error generating interview Q&A:', error.message || error);
    // Safe fallback to prevent crashes
    return {
      question: "How would you implement this solution?",
      answer: explanation && explanation.length > 0 ? 
        (explanation.length > 500 ? explanation.substring(0, 500) + "..." : explanation) : 
        "This code demonstrates a practical implementation approach.",
      followUp: "Can you optimize this further?"
    };
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

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: LLAMA_MODEL,
      temperature: 0.1,
      max_tokens: 100,
    });

    const text = completion.choices[0]?.message?.content?.trim() || 'N/A';
    
    return text;
  } catch (error) {
    console.error('[LLaMA] Error detecting complexity:', error.message || error);
    return 'N/A';
  }
}

module.exports = {
  generateTags,
  generateExplanation,
  generateInterviewQA,
  detectComplexity
};