import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Sparkles, MessageSquare, Eye, EyeOff, RefreshCw } from 'lucide-react';
import CodeEditor from '../components/snippet/CodeEditor';
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

const AddSnippet = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    customTags: [],
    notes: ''
  });
  const [generatedData, setGeneratedData] = useState(null);
  const [visibleAnswers, setVisibleAnswers] = useState([]);

  const [tagInput, setTagInput] = useState('');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.customTags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        customTags: [...formData.customTags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      customTags: formData.customTags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.code) {
      setError('Title and code are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await snippetService.analyze(formData.code);
      setGeneratedData(response.data);
      setIsGenerated(true);
      setVisibleAnswers([]);
      // Scroll to top when results are shown
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const snippetData = {
        ...formData,
        ...generatedData
      };
      await snippetService.create(snippetData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save snippet');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAnswer = (index) => {
    setVisibleAnswers(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleRegenerateQA = async () => {
    setIsRegenerating(true);
    setError('');

    try {
      const response = await snippetService.analyze(formData.code);
      // Update only the interviewQuestions part
      setGeneratedData(prev => ({
        ...prev,
        interviewQuestions: response.data.interviewQuestions
      }));
      setVisibleAnswers([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate interview questions');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg font-semibold text-gray-900">Saving snippet...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">
            {isGenerated ? 'Snippet Details' : 'Add New Snippet'}
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            {isGenerated ? 'Review your AI-generated analysis' : 'AI will auto-tag and explain your code'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!isGenerated ? (
          /* Form for input */
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Binary Search Implementation"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Code Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code *
              </label>
              <CodeEditor
                value={formData.code}
                onChange={(value) => handleChange('code', value)}
                language="javascript"
              />
            </div>

            {/* Custom Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Tags (optional)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button type="button" onClick={handleAddTag} variant="secondary">
                  Add
                </Button>
              </div>
              
              {formData.customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-full flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any additional notes..."
                rows="4"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isLoading ? 'Processing...' : 'Submit'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* Display AI-generated results */
          <div className="space-y-6">
            {/* Title & Code Display */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{formData.title}</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 overflow-x-auto">
                  <code>{formData.code}</code>
                </pre>
              </div>
            </div>

            {/* AI Explanation */}
            {generatedData?.aiExplanation && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI Explanation
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {generatedData.aiExplanation}
                </p>
              </div>
            )}

            {/* Detected Language & Complexity */}
            <div className="grid grid-cols-2 gap-4">
              {generatedData?.language && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Detected Language</h3>
                  <p className="text-lg font-semibold text-gray-900">{generatedData.language}</p>
                </div>
              )}
              {generatedData?.complexity && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Complexity</h3>
                  <p className="text-lg font-semibold text-gray-900">{generatedData.complexity}</p>
                </div>
              )}
            </div>

            {/* AI Tags */}
            {generatedData?.aiTags && generatedData.aiTags.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {generatedData.aiTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Tags & Notes */}
            {(formData.customTags.length > 0 || formData.notes) && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                {formData.customTags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Custom Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.customTags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Interview Q&A */}
            {generatedData?.interviewQuestions && generatedData.interviewQuestions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    Interview Questions
                  </h3>
                  <Button
                    onClick={handleRegenerateQA}
                    disabled={isRegenerating}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {isRegenerating ? 'Regenerating...' : 'Regenerate Q&A'}
                  </Button>
                </div>
                <div className="space-y-6">
                  {generatedData.interviewQuestions.map((qa, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 flex-1">
                          Q: {qa.question}
                        </h4>
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
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save Snippet'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsGenerated(false);
                  setGeneratedData(null);
                  setVisibleAnswers([]);
                }}
                disabled={isSaving}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddSnippet;
