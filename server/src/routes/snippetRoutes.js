const express = require('express');
const router = express.Router();
const {
  getSnippets,
  getSnippet,
  createSnippet,
  updateSnippet,
  deleteSnippet,
  generateInterviewMode,
  analyzeCode
} = require('../controllers/snippetController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Snippet CRUD
router.route('/')
  .get(getSnippets)      // GET /api/snippets
  .post(createSnippet);  // POST /api/snippets

// Analyze code (must be before /:id route)
router.post('/analyze', analyzeCode); // POST /api/snippets/analyze

router.route('/:id')
  .get(getSnippet)       // GET /api/snippets/:id
  .put(updateSnippet)    // PUT /api/snippets/:id
  .delete(deleteSnippet); // DELETE /api/snippets/:id

// Interview mode
router.post('/:id/interview', generateInterviewMode); // POST /api/snippets/:id/interview

module.exports = router;
