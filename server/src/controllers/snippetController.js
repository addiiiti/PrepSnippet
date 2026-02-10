const Snippet = require('../models/Snippet');
const { detectLanguage } = require('../services/languageDetection');
const { analyzeSnippet, generateInterview } = require('../services/aiService');

/**
 * @desc    Get all snippets for logged-in user
 * @route   GET /api/snippets
 * @access  Private
 */
const getSnippets = async (req, res, next) => {
  try {
    const { 
      language, 
      favorite, 
      search, 
      sortBy = 'createdAt', 
      order = 'desc',
      limit = 50,
      page = 1
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };

    if (language) {
      filter.language = language.toLowerCase();
    }

    if (favorite === 'true') {
      filter.isFavorite = true;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get snippets with pagination
    const snippets = await Snippet.find(filter)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const total = await Snippet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        snippets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single snippet
 * @route   GET /api/snippets/:id
 * @access  Private
 */
const getSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Snippet not found'
      });
    }

    // Check ownership
    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this snippet'
      });
    }

    // Update view count and last viewed
    snippet.viewCount += 1;
    snippet.lastViewed = Date.now();
    await snippet.save();

    res.status(200).json({
      success: true,
      data: { snippet }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new snippet with AI analysis
 * @route   POST /api/snippets
 * @access  Private
 */
const createSnippet = async (req, res, next) => {
  try {
    const { title, code, language, customTags, notes } = req.body;

    // Validation
    if (!title || !code) {
      return res.status(400).json({
        success: false,
        message: 'Title and code are required'
      });
    }

    // Auto-detect language if not provided
    const detectedLang = language || detectLanguage(code);

    // Analyze code with AI
    const aiAnalysis = await analyzeSnippet(code, detectedLang);

    // Create snippet
    const snippet = await Snippet.create({
      userId: req.user.id,
      title,
      code,
      language: detectedLang,
      customTags: customTags || [],
      notes: notes || '',
      ...aiAnalysis
    });

    res.status(201).json({
      success: true,
      message: 'Snippet created successfully',
      data: { snippet }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update snippet
 * @route   PUT /api/snippets/:id
 * @access  Private
 */
const updateSnippet = async (req, res, next) => {
  try {
    let snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Snippet not found'
      });
    }

    // Check ownership
    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this snippet'
      });
    }

    const { title, code, customTags, notes, isFavorite } = req.body;

    // Update fields
    if (title) snippet.title = title;
    if (code) snippet.code = code;
    if (customTags) snippet.customTags = customTags;
    if (notes !== undefined) snippet.notes = notes;
    if (isFavorite !== undefined) snippet.isFavorite = isFavorite;

    // If code changed, re-analyze with AI
    if (code && code !== snippet.code) {
      const aiAnalysis = await analyzeSnippet(code, snippet.language);
      snippet.aiTags = aiAnalysis.aiTags;
      snippet.aiExplanation = aiAnalysis.aiExplanation;
      snippet.complexity = aiAnalysis.complexity;
    }

    await snippet.save();

    res.status(200).json({
      success: true,
      message: 'Snippet updated successfully',
      data: { snippet }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete snippet
 * @route   DELETE /api/snippets/:id
 * @access  Private
 */
const deleteSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Snippet not found'
      });
    }

    // Check ownership
    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this snippet'
      });
    }

    await snippet.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Snippet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate interview Q&A for snippet
 * @route   POST /api/snippets/:id/interview
 * @access  Private
 */
const generateInterviewMode = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Snippet not found'
      });
    }

    // Check ownership
    if (snippet.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Generate interview Q&A
    const interviewQA = await generateInterview(
      snippet.code, 
      snippet.language, 
      snippet.aiExplanation
    );

    if (interviewQA) {
      snippet.interviewQuestion = interviewQA.question;
      snippet.interviewAnswer = interviewQA.answer;
      snippet.interviewFollowUp = interviewQA.followUp;
      await snippet.save();
    }

    res.status(200).json({
      success: true,
      message: 'Interview mode generated',
      data: { 
        interview: {
          question: snippet.interviewQuestion,
          answer: snippet.interviewAnswer,
          followUp: snippet.interviewFollowUp
        }
      }
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
  generateInterviewMode
};
