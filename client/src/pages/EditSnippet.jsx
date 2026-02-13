import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Sparkles, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import CodeEditor from '../components/snippet/CodeEditor';
import Button from '../components/common/Button';
import snippetService from '../services/snippetService';

const EditSnippet = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    customTags: [],
    notes: ''
  });

  useEffect(() => {
    fetchSnippet();
  }, [id]);

  const fetchSnippet = async () => {
    try {
      setIsLoading(true);
      const response = await snippetService.getById(id);
      const snippet = response.data.snippet;
      
      setFormData({
        title: snippet.title || '',
        code: snippet.code || '',
        customTags: snippet.customTags || [],
        notes: snippet.notes || ''
      });
    } catch (err) {
      setError('Failed to load snippet');
      console.error('Error fetching snippet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCodeChange = (code) => {
    setFormData(prev => ({
      ...prev,
      code
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      customTags: tags
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.code) {
      setError('Title and code are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await snippetService.update(id, formData);
      navigate(`/snippet/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update snippet');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/snippet/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gradient">Edit Snippet</h1>
            <p className="text-gray-600 mt-2">Update your code snippet</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Binary Search Implementation"
              required
            />
          </div>

          {/* Code Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code *
            </label>
            <CodeEditor 
              value={formData.code}
              onChange={handleCodeChange}
            />
          </div>

          {/* Custom Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Tags (comma-separated)
            </label>
            <input
              type="text"
              name="customTags"
              value={formData.customTags.join(', ')}
              onChange={handleTagsChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., algorithms, sorting, arrays"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add your personal notes here..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={() => navigate(`/snippet/${id}`)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSnippet;
