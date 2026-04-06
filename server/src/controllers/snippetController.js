const Snippet = require('../models/Snippet');
const { detectLanguage } = require('../services/languageDetection');
const { analyzeSnippet, generateInterview } = require('../services/aiService');

const getSnippets = async (req, res, next) => {
  try {
    const {
      language,
      favorite,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1,
    } = req.query;

    const filter = { userId: req.user.id };

    if (language) filter.language = language.toLowerCase();
    if (favorite === 'true') filter.isFavorite = true;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const snippets = await Snippet.find(filter)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Snippet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        snippets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this snippet' });
    }

    snippet.viewCount += 1;
    snippet.lastViewed = Date.now();
    await snippet.save();

    res.status(200).json({ success: true, data: { snippet } });
  } catch (error) {
    next(error);
  }
};

const createSnippet = async (req, res, next) => {
  try {
    const { title, code, language, customTags, notes, analysis: clientAnalysis } = req.body;

    if (!title || !code) {
      return res.status(400).json({
        success: false,
        message: 'Title and code are required',
      });
    }

    // FIX 1: detectedLang was never declared — this was causing the crash
    const detectedLang = language || detectLanguage(code);

    // FIX 2: aiAnalysis was never declared with let — caused ReferenceError
    let aiAnalysis;

    if (clientAnalysis && clientAnalysis.summary) {
      // Client sent pre-analyzed data (user already reviewed it on screen)
      // Use it directly — do NOT run AI again
      aiAnalysis = {
        analysis: clientAnalysis,
        aiTags: Array.isArray(clientAnalysis.tags) ? clientAnalysis.tags.slice(0, 3) : [],
        aiExplanation: clientAnalysis.summary || '',
        complexity: `Time: ${clientAnalysis.complexity?.time || 'N/A'}, Space: ${clientAnalysis.complexity?.space || 'N/A'}`,
        interviewQuestions: Array.isArray(clientAnalysis.followUps)
          ? clientAnalysis.followUps.slice(0, 3).map((f) => ({
              question: f.question,
              answer: f.answer,
            }))
          : [],
      };
    } else {
      // No pre-analysis sent — run AI server-side (fallback for direct API usage)
      aiAnalysis = await analyzeSnippet(code, detectedLang);
    }

    const snippet = await Snippet.create({
      userId: req.user.id,
      title,
      code,
      language: detectedLang,
      customTags: customTags || [],
      notes: notes || '',

      analysis: aiAnalysis.analysis,
      aiMeta: {
        promptVersion: 'v2-groq',
        generatedAt: new Date(),
      },

      aiTags: aiAnalysis.aiTags,
      aiExplanation: aiAnalysis.aiExplanation,
      complexity: aiAnalysis.complexity,
      interviewQuestions: aiAnalysis.interviewQuestions,
    });

    res.status(201).json({
      success: true,
      message: 'Snippet created successfully',
      data: { snippet },
    });
  } catch (error) {
    next(error);
  }
};

const updateSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this snippet' });
    }

    const { title, code, customTags, notes, isFavorite } = req.body;
    const oldCode = snippet.code;

    if (title !== undefined) snippet.title = title;
    if (code !== undefined) snippet.code = code;
    if (customTags !== undefined) snippet.customTags = customTags;
    if (notes !== undefined) snippet.notes = notes;
    if (isFavorite !== undefined) snippet.isFavorite = isFavorite;

    const codeChanged = typeof code === 'string' && code !== oldCode;

    if (codeChanged) {
      const newLang = snippet.language || detectLanguage(code);
      snippet.language = newLang;

      const aiAnalysis = await analyzeSnippet(code, newLang);

      snippet.analysis = aiAnalysis.analysis;
      snippet.aiMeta = { promptVersion: 'v2-groq', generatedAt: new Date() };
      snippet.aiTags = aiAnalysis.aiTags;
      snippet.aiExplanation = aiAnalysis.aiExplanation;
      snippet.complexity = aiAnalysis.complexity;
      snippet.interviewQuestions = aiAnalysis.interviewQuestions;
    }

    await snippet.save();

    res.status(200).json({
      success: true,
      message: 'Snippet updated successfully',
      data: { snippet },
    });
  } catch (error) {
    next(error);
  }
};

const analyzeCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const detectedLang = language || detectLanguage(code);
    const aiAnalysis = await analyzeSnippet(code, detectedLang);

    res.status(200).json({
      success: true,
      data: {
        language: detectedLang,
        analysis: aiAnalysis.analysis,
        quality: aiAnalysis.quality,
        improvementFlags: aiAnalysis.improvementFlags,
        aiTags: aiAnalysis.aiTags,
        aiExplanation: aiAnalysis.aiExplanation,
        complexity: aiAnalysis.complexity,
        interviewQuestions: aiAnalysis.interviewQuestions,
      },
    });
  } catch (error) {
    console.error('[snippetController] AI analyze error:', error);
    res.status(500).json({ success: false, message: 'AI analysis failed' });
  }
};

const deleteSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this snippet' });
    }

    await snippet.deleteOne();

    res.status(200).json({ success: true, message: 'Snippet deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const generateInterviewMode = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const interviewQuestions = await generateInterview(snippet.code, snippet.language);

    snippet.interviewQuestions = interviewQuestions.map((item) => ({
      question: item.question,
      answer: item.answer,
    }));

    snippet.analysis = {
      ...snippet.analysis,
      followUps: interviewQuestions,
    };

    snippet.aiMeta = { promptVersion: 'v2-groq', generatedAt: new Date() };

    await snippet.save();

    res.status(200).json({
      success: true,
      message: 'Interview mode generated',
      data: {
        interviewQuestions: snippet.interviewQuestions,
        followUps: snippet.analysis?.followUps || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSnippets,
  getSnippet,
  createSnippet,
  updateSnippet,
  deleteSnippet,
  generateInterviewMode,
  analyzeCode,
};