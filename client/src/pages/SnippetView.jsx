import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Trash2, 
  MessageSquare, 
  Eye,
  EyeOff,
  Calendar,
  Code2,
  RefreshCw,
  Edit2
} from 'lucide-react';
import Button from '../components/common/Button';
import snippetService from '../services/snippetService';

// Component to format Q&A answers with code blocks
const FormattedAnswer = ({ answer }) => {
  // Split answer into paragraphs and code blocks
  const formatAnswer = (text) => {
    const parts = [];
    const lines = text.split('\n');
    let currentCodeBlock = [];
    let currentText = [];
    
    const flushText = () => {
      if (currentText.length > 0) {
        parts.push({ type: 'text', content: currentText.join('\n') });
        currentText = [];
      }
    };
    
    const flushCode = () => {
      if (currentCodeBlock.length > 0) {
        parts.push({ type: 'code', content: currentCodeBlock.join('\n') });
        currentCodeBlock = [];
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Detect code lines: contains typical code patterns
      const isCodeLine = trimmed && (
        trimmed.includes('{') || 
        trimmed.includes('}') || 
        trimmed.includes('(') && trimmed.includes(')') ||
        trimmed.includes('int ') ||
        trimmed.includes('vector') ||
        trimmed.includes('map<') ||
        trimmed.includes('return ') ||
        trimmed.includes('for (') ||
        trimmed.includes('if (') ||
        trimmed.startsWith('//') ||
        trimmed.endsWith(';') ||
        trimmed.includes('yield ') ||
        trimmed.includes('auto ') ||
        /^\s*(public|private|protected|class|function|const|let|var|import|export)/.test(trimmed)
      );
      
      if (isCodeLine) {
        flushText();
        currentCodeBlock.push(line);
      } else if (trimmed === '') {
        // Empty line
        if (currentCodeBlock.length > 0) {
          currentCodeBlock.push(line);
        } else if (currentText.length > 0) {
          currentText.push(line);
        }
      } else {
        flushCode();
        currentText.push(line);
      }
    }
    
    flushText();
    flushCode();
    
    return parts;
  };
  
  const parts = formatAnswer(answer);
  
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <pre key={index} className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm font-mono">{part.content}</code>
            </pre>
          );
        } else {
          return (
            <p key={index} className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {part.content}
            </p>
          );
        }
      })}
    </div>
  );
};

const SnippetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviewQA, setInterviewQA] = useState(null);
  const [generatingQA, setGeneratingQA] = useState(false);
  const [visibleAnswers, setVisibleAnswers] = useState([]);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  useEffect(() => {
    fetchSnippet();
  }, [id]);

  const fetchSnippet = async () => {
    try {
      setLoading(true);
      const response = await snippetService.getById(id);
      setSnippet(response.data.snippet);
      if (response.data.snippet.interviewQuestions) {
        setInterviewQA(response.data.snippet.interviewQuestions);
      }
    } catch (error) {
      console.error('Error fetching snippet:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInterview = async () => {
    try {
      setGeneratingQA(true);
      const response = await snippetService.generateInterview(id);
      setInterviewQA(response.data.interviewQuestions);
      setVisibleAnswers([]);
    } catch (error) {
      console.error('Error generating interview:', error);
    } finally {
      setGeneratingQA(false);
    }
  };

  const toggleAnswer = (index) => {
    setVisibleAnswers(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      try {
        await snippetService.delete(id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting snippet:', error);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (togglingFavorite) return;
    
    setTogglingFavorite(true);
    const previousState = snippet.isFavorite;
    
    try {
      const newFavoriteState = !snippet.isFavorite;
      // Optimistically update UI
      setSnippet(prev => ({ ...prev, isFavorite: newFavoriteState }));
      
      // Make API call
      await snippetService.update(id, { isFavorite: newFavoriteState });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert on error
      setSnippet(prev => ({ ...prev, isFavorite: previousState }));
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setTogglingFavorite(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!snippet) {
    return null;
  }

  const formattedDate = new Date(snippet.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Title and Actions */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {snippet.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Code2 className="w-4 h-4" />
                {snippet.language}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {snippet.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/edit-snippet/${id}`)}
              className="p-2 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all"
              title="Edit snippet"
            >
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={togglingFavorite}
              className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={snippet.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star 
                className={`w-5 h-5 transition-all ${snippet.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} ${togglingFavorite ? 'opacity-50' : ''}`} 
              />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 text-red-600 rounded-lg transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Code</h2>
            {snippet.complexity && (
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-full">
                {snippet.complexity}
              </span>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-800 overflow-x-auto">
              <code>{snippet.code}</code>
            </pre>
          </div>
        </div>

        {/* AI Explanation */}
        {snippet.aiExplanation && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              AI Explanation
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {snippet.aiExplanation}
            </p>
          </div>
        )}

        {/* Tags */}
        {(snippet.aiTags?.length > 0 || snippet.customTags?.length > 0) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {snippet.aiTags?.map((tag, index) => (
                <span
                  key={`ai-${index}`}
                  className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
              {snippet.customTags?.map((tag, index) => (
                <span
                  key={`custom-${index}`}
                  className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {snippet.notes && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {snippet.notes}
            </p>
          </div>
        )}

        {/* Interview Q&A */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Interview Questions
            </h2>
            {interviewQA && (
              <Button
                onClick={handleGenerateInterview}
                disabled={generatingQA}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generatingQA ? 'animate-spin' : ''}`} />
                {generatingQA ? 'Regenerating...' : 'Regenerate Q&A'}
              </Button>
            )}
            {!interviewQA && (
              <Button
                onClick={handleGenerateInterview}
                disabled={generatingQA}
                variant="secondary"
              >
                {generatingQA ? 'Generating...' : 'Generate Q&A'}
              </Button>
            )}
          </div>

          {interviewQA ? (
            <div className="space-y-6">
              {interviewQA.map((qa, index) => (
                <div key={index} className="border-l-2 border-blue-500 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      Q: {qa.question}
                    </h3>
                    <button
                      onClick={() => toggleAnswer(index)}
                      className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      {visibleAnswers.includes(index) ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Show
                        </>
                      )}
                    </button>
                  </div>
                  {visibleAnswers.includes(index) && (
                    <div className="mt-3">
                      <span className="font-semibold text-gray-900">A: </span>
                      <FormattedAnswer answer={qa.answer} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Click "Generate Q&A" to create interview questions for this snippet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnippetView;
