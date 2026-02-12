const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: [true, 'Code is required']
  },
  language: {
    type: String,
    required: true,
    lowercase: true,
    index: true
    // javascript, python, java, cpp, etc.
  },
  
  // AI-generated fields
  aiTags: [{
    type: String,
    lowercase: true
  }],
  aiExplanation: {
    type: String,
    default: ''
  },
  complexity: {
    type: String,
    default: ''
    // e.g., "O(n)", "O(log n)", etc.
  },
  
  // User-added fields
  customTags: [{
    type: String,
    lowercase: true
  }],
  notes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  
  // Metadata
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date,
    default: Date.now
  },
  
  // Interview mode fields
  interviewQuestions: [{
    question: {
      type: String
    },
    answer: {
      type: String
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp on save
snippetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for text search
// Note: We specify default_language to prevent conflicts with the 'language' field
snippetSchema.index({ 
  title: 'text', 
  code: 'text', 
  aiExplanation: 'text',
  customTags: 'text',
  aiTags: 'text'
}, {
  default_language: 'english',
  language_override: 'none'  // Prevents the 'language' field from being used as text analysis language
});

module.exports = mongoose.model('Snippet', snippetSchema);
