const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
    intent: { type: String, default: '' },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    pattern: { type: String, default: '' },
    whyItWorks: { type: String, default: '' },
    interviewPitch30Sec: { type: String, default: '' },

    complexity: {
      time: { type: String, default: '' },
      space: { type: String, default: '' },
      reasoning: { type: String, default: '' },
    },

    edgeCases: [{ type: String }],
    commonMistakes: [{ type: String }],
    optimizations: [{ type: String }],
    followUps: [followUpSchema],
    tags: [{ type: String, lowercase: true }],
  },
  { _id: false }
);

const snippetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200,
  },

  code: {
    type: String,
    required: [true, 'Code is required'],
  },

  language: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },

  // Legacy AI fields (keep for backward compatibility)
  aiTags: [{ type: String, lowercase: true }],
  aiExplanation: { type: String, default: '' },
  complexity: {
    type: String,
    default: '',
  },
  interviewQuestions: [
    {
      question: { type: String },
      answer: { type: String },
    },
  ],

  // New structured analysis
  analysis: {
    type: analysisSchema,
    default: () => ({
      summary: '',
      pattern: '',
      whyItWorks: '',
      interviewPitch30Sec: '',
      complexity: {
        time: '',
        space: '',
        reasoning: '',
      },
      edgeCases: [],
      commonMistakes: [],
      optimizations: [],
      followUps: [],
      tags: [],
    }),
  },

  aiMeta: {
    promptVersion: { type: String, default: 'v1-structured' },
    generatedAt: { type: Date, default: Date.now },
  },

  // User-added fields
  customTags: [{ type: String, lowercase: true }],
  notes: { type: String, default: '', maxlength: 1000 },

  // Metadata
  isFavorite: { type: Boolean, default: false, index: true },
  isPublic: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  lastViewed: { type: Date, default: Date.now },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

snippetSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

snippetSchema.index(
  {
    title: 'text',
    code: 'text',
    aiExplanation: 'text',
    customTags: 'text',
    aiTags: 'text',
    'analysis.summary': 'text',
    'analysis.pattern': 'text',
    'analysis.whyItWorks': 'text',
    'analysis.tags': 'text',
  },
  {
    default_language: 'english',
    language_override: 'none',
  }
);

module.exports = mongoose.model('Snippet', snippetSchema);