import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Sparkles,
  MessageSquare,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  Code2,
  AlertTriangle,
  Lightbulb,
  Zap,
} from 'lucide-react';
import Button from '../components/common/Button';
import snippetService from '../services/snippetService';

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components (identical to SnippetView)
// ─────────────────────────────────────────────────────────────────────────────

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    purple: 'bg-purple-100 text-purple-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

const ListBlock = ({ items, emptyText, prefix = '•', prefixClass = 'text-gray-400' }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-700 leading-relaxed flex gap-2">
          <span className={`${prefixClass} shrink-0 mt-0.5`}>{prefix}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const FollowUpList = ({ followUps, isRegenerating, onRegenerate }) => {
  const [openIndexes, setOpenIndexes] = useState([]);

  const toggle = (i) =>
    setOpenIndexes((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare size={12} /> Follow-up Questions
        </p>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={isRegenerating ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      {!followUps || followUps.length === 0 ? (
        <p className="text-sm text-gray-400">No follow-up questions generated.</p>
      ) : (
        <div className="space-y-3">
          {followUps.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Q{i + 1}. {item.question}</p>
                  {item.intent && (
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{item.intent}</p>
                  )}
                </div>
                <button
                  onClick={() => toggle(i)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {openIndexes.includes(i) ? <><EyeOff size={13} />Hide</> : <><Eye size={13} />Reveal</>}
                </button>
              </div>
              {openIndexes.includes(i) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 leading-7">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// Tabs — identical to SnippetView
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'interview', label: 'Interview Prep' },
  { id: 'details', label: 'Details' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const AddSnippet = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({ title: '', code: '', customTags: [], notes: '' });
  const [tagInput, setTagInput] = useState('');

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // The result of /analyze — exactly what will be saved
  const [analysisResult, setAnalysisResult] = useState(null);

  // Prevent double-submit
  const analyzeInFlight = useRef(false);
  const saveInFlight = useRef(false);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.customTags.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, customTags: [...prev.customTags, trimmed] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) =>
    setFormData((prev) => ({ ...prev, customTags: prev.customTags.filter((t) => t !== tag) }));

  // ── Analyze ────────────────────────────────────────────────────────────────

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (analyzeInFlight.current) return;

    if (!formData.title.trim() || !formData.code.trim()) {
      setError('Title and code are required');
      return;
    }

    analyzeInFlight.current = true;
    setIsAnalyzing(true);
    setError('');
    setActiveTab('overview'); // always start on Overview tab

    try {
      const response = await snippetService.analyze(formData.code);
      setAnalysisResult(response.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI analysis');
    } finally {
      setIsAnalyzing(false);
      analyzeInFlight.current = false;
    }
  };

  // ── Regenerate follow-ups ──────────────────────────────────────────────────

  const handleRegenerateFollowUps = async () => {
    if (isRegenerating || !analysisResult) return;

    setIsRegenerating(true);
    setError('');

    try {
      const response = await snippetService.analyze(formData.code);
      const newFollowUps = response.data?.analysis?.followUps || [];

      setAnalysisResult((prev) => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          followUps: newFollowUps,
        },
        interviewQuestions: newFollowUps.slice(0, 3).map((f) => ({
          question: f.question,
          answer: f.answer,
        })),
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate questions');
    } finally {
      setIsRegenerating(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (saveInFlight.current || !analysisResult) return;

    saveInFlight.current = true;
    setIsSaving(true);
    setError('');

    try {
      await snippetService.create({
        title: formData.title,
        code: formData.code,
        customTags: formData.customTags,
        notes: formData.notes,
        language: analysisResult.language,
        analysis: analysisResult.analysis,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save snippet');
    } finally {
      setIsSaving(false);
      saveInFlight.current = false;
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const analysis = analysisResult?.analysis || {};
  const followUps = analysis.followUps || [];

  // ── Render: Input form (before analysis) ───────────────────────────────────

  if (!analysisResult) {
    return (
      <div className="min-h-screen px-4 py-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Add Snippet</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
              <Sparkles size={15} className="text-blue-500" />
              AI will analyze your code before you save
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAnalyze} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Binary Search on Sorted Array"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Code *</label>
              <textarea
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                rows={14}
                spellCheck={false}
                className="w-full px-4 py-3 bg-gray-950 text-gray-100 border border-gray-800 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Paste your code here..."
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Tags <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="button" onClick={handleAddTag} variant="secondary">Add</Button>
              </div>
              {formData.customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-full flex items-center gap-1.5"
                    >
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Personal notes, context, links..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isAnalyzing} className="flex items-center gap-2">
                <Sparkles size={16} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: Analysis result — IDENTICAL layout to SnippetView ──────────────

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      {isSaving && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-base font-semibold text-gray-900">Saving snippet...</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => { setAnalysisResult(null); setError(''); }}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-5 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to Edit
        </button>

        {/* Title + action buttons — same as SnippetView header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{formData.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {analysisResult.language && <Badge variant="blue">{analysisResult.language}</Badge>}
              {analysis.pattern && <Badge variant="purple">{analysis.pattern}</Badge>}
              {analysis.complexity?.time && <Badge variant="green">T: {analysis.complexity.time}</Badge>}
              {analysis.complexity?.space && <Badge variant="amber">S: {analysis.complexity.space}</Badge>}
            </div>
          </div>

          {/* Action buttons — Edit and Save, same position as SnippetView */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              onClick={() => { setAnalysisResult(null); setError(''); }}
            >
              Edit
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        {/* ── Main 2-col grid — IDENTICAL to SnippetView ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Left: Code panel — identical to SnippetView */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Code2 size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Code</h2>
            </div>
            <pre className="bg-gray-950 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm leading-6">
              <code>{formData.code}</code>
            </pre>

            {/* Tags below code — identical to SnippetView */}
            {analysis.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                {analysis.tags.map((tag, i) => <Badge key={i}>{tag}</Badge>)}
              </div>
            )}
          </div>

          {/* Right: Tabbed panel — IDENTICAL to SnippetView */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5 space-y-5">

              {/* ── Overview tab — identical to SnippetView ── */}
              {activeTab === 'overview' && (
                <>
                  {analysis.summary && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What it does</p>
                      <p className="text-sm text-gray-700 leading-7">{analysis.summary}</p>
                    </div>
                  )}

                  {analysis.whyItWorks && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Why it works</p>
                      <p className="text-sm text-gray-700 leading-7">{analysis.whyItWorks}</p>
                    </div>
                  )}

                  {(analysis.complexity?.time || analysis.complexity?.space) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Complexity</p>
                      <div className="flex gap-3 mb-2">
                        {analysis.complexity.time && <Badge variant="green">Time: {analysis.complexity.time}</Badge>}
                        {analysis.complexity.space && <Badge variant="amber">Space: {analysis.complexity.space}</Badge>}
                      </div>
                      {analysis.complexity.reasoning && (
                        <p className="text-sm text-gray-500 leading-6">{analysis.complexity.reasoning}</p>
                      )}
                    </div>
                  )}

                  {formData.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Notes</p>
                      <p className="text-sm text-gray-700 leading-7 whitespace-pre-line">{formData.notes}</p>
                    </div>
                  )}
                </>
              )}

              {/* ── Interview Prep tab — identical to SnippetView ── */}
              {activeTab === 'interview' && (
                <>
                  {analysis.interviewPitch30Sec && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        30-Second Pitch
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900 leading-7 italic">
                          "{analysis.interviewPitch30Sec}"
                        </p>
                      </div>
                    </div>
                  )}

                  <FollowUpList
                    followUps={followUps}
                    isRegenerating={isRegenerating}
                    onRegenerate={handleRegenerateFollowUps}
                  />
                </>
              )}

              {/* ── Details tab — identical to SnippetView ── */}
              {activeTab === 'details' && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Edge Cases
                    </p>
                    <ListBlock
                      items={analysis.edgeCases}
                      emptyText="No edge cases available."
                      prefix="→"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb size={12} /> Common Mistakes
                    </p>
                    <ListBlock
                      items={analysis.commonMistakes}
                      emptyText="No common mistakes available."
                      prefix="!"
                      prefixClass="text-red-400"
                    />
                  </div>

                  {analysis.optimizations?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap size={12} /> Optimizations
                      </p>
                      <ListBlock
                        items={analysis.optimizations}
                        emptyText="No optimizations."
                        prefix="↑"
                        prefixClass="text-emerald-500"
                      />
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>

        {/* Bottom save bar */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Snippet'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setAnalysisResult(null); setError(''); }}
          >
            Back to Edit
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AddSnippet;
