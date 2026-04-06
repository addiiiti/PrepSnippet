import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Eye,
  EyeOff,
  MessageSquare,
  RefreshCw,
  Star,
  Trash2,
  Code2,
  Lightbulb,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import Button from '../components/common/Button';
import snippetService from '../services/snippetService';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
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

const FollowUpsSection = ({ followUps }) => {
  const [openIndexes, setOpenIndexes] = useState([]);

  const toggle = (i) =>
    setOpenIndexes((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  if (!followUps || followUps.length === 0) {
    return <p className="text-sm text-gray-400">No follow-up questions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {followUps.map((item, i) => {
        const isOpen = openIndexes.includes(i);
        return (
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
                {isOpen ? <><EyeOff size={13} />Hide</> : <><Eye size={13} />Reveal</>}
              </button>
            </div>
            {isOpen && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700 leading-7">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Tab definitions
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'interview', label: 'Interview Prep', icon: MessageSquare },
  { id: 'details', label: 'Details' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const SnippetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingQA, setGeneratingQA] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSnippet();
  }, [id]);

  const fetchSnippet = async () => {
    try {
      setLoading(true);
      const response = await snippetService.getById(id);
      setSnippet(response.data.snippet);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInterview = async () => {
    try {
      setGeneratingQA(true);
      await snippetService.generateInterview(id);
      await fetchSnippet();
    } catch (error) {
      console.error('Error generating interview:', error);
    } finally {
      setGeneratingQA(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this snippet?')) return;
    try {
      await snippetService.delete(id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting snippet:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (togglingFavorite || !snippet) return;
    setTogglingFavorite(true);
    const prev = snippet.isFavorite;
    setSnippet((s) => ({ ...s, isFavorite: !s.isFavorite }));
    try {
      await snippetService.update(id, { isFavorite: !prev });
    } catch {
      setSnippet((s) => ({ ...s, isFavorite: prev }));
    } finally {
      setTogglingFavorite(false);
    }
  };

  // Merge legacy fields with new structured analysis
  const analysis = useMemo(() => {
    if (!snippet) return null;
    const a = snippet.analysis || {};
    const fallbackFollowUps = (snippet.interviewQuestions || []).map((q) => ({
      question: q.question,
      answer: q.answer,
      intent: '',
    }));

    return {
      summary: a.summary || snippet.aiExplanation || '',
      pattern: a.pattern || '',
      whyItWorks: a.whyItWorks || '',
      interviewPitch30Sec: a.interviewPitch30Sec || '',
      complexity: {
        time: a.complexity?.time || '',
        space: a.complexity?.space || '',
        reasoning: a.complexity?.reasoning || snippet.complexity || '',
      },
      edgeCases: a.edgeCases || [],
      commonMistakes: a.commonMistakes || [],
      optimizations: a.optimizations || [],
      followUps: a.followUps?.length > 0 ? a.followUps : fallbackFollowUps,
      tags: a.tags?.length > 0 ? a.tags : snippet.aiTags || [],
    };
  }, [snippet]);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-6xl mx-auto animate-pulse space-y-4">
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-80 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!snippet) return null;

  const formattedDate = new Date(snippet.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-5 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {/* Title + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{snippet.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-500">
              <Badge variant="blue">{snippet.language}</Badge>
              {analysis?.pattern && <Badge variant="purple">{analysis.pattern}</Badge>}
              {analysis?.complexity?.time && (
                <Badge variant="green">T: {analysis.complexity.time}</Badge>
              )}
              {analysis?.complexity?.space && (
                <Badge variant="amber">S: {analysis.complexity.space}</Badge>
              )}
              <span className="flex items-center gap-1">
                <Eye size={13} /> {snippet.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} /> {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(`/edit-snippet/${id}`)}
              className="p-2 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all"
              title="Edit"
            >
              <Edit2 size={16} className="text-gray-600" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`p-2 border rounded-lg transition-all ${
                snippet.isFavorite
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-gray-200 hover:bg-yellow-50'
              }`}
              title="Favorite"
            >
              <Star
                size={16}
                className={snippet.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}
              />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        </div>

        {/* Main layout: Code left, tabs right */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Code panel — always visible */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Code2 size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Code</h2>
            </div>
            <pre className="bg-gray-950 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm leading-6">
              <code>{snippet.code}</code>
            </pre>

            {/* Tags below code */}
            {analysis?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                {analysis.tags.map((tag, i) => <Badge key={i}>{tag}</Badge>)}
              </div>
            )}
          </div>

          {/* Right panel: Tabbed */}
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

              {/* ── Overview tab ── */}
              {activeTab === 'overview' && (
                <>
                  {analysis?.summary && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What it does</p>
                      <p className="text-sm text-gray-700 leading-7">{analysis.summary}</p>
                    </div>
                  )}

                  {analysis?.whyItWorks && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Why it works</p>
                      <p className="text-sm text-gray-700 leading-7">{analysis.whyItWorks}</p>
                    </div>
                  )}

                  {(analysis?.complexity?.time || analysis?.complexity?.space) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Complexity</p>
                      <div className="flex gap-3 mb-2">
                        {analysis.complexity.time && (
                          <Badge variant="green">Time: {analysis.complexity.time}</Badge>
                        )}
                        {analysis.complexity.space && (
                          <Badge variant="amber">Space: {analysis.complexity.space}</Badge>
                        )}
                      </div>
                      {analysis.complexity.reasoning && (
                        <p className="text-sm text-gray-500 leading-6">{analysis.complexity.reasoning}</p>
                      )}
                    </div>
                  )}

                  {snippet.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Notes</p>
                      <p className="text-sm text-gray-700 leading-7 whitespace-pre-line">{snippet.notes}</p>
                    </div>
                  )}
                </>
              )}

              {/* ── Interview Prep tab ── */}
              {activeTab === 'interview' && (
                <>
                  {analysis?.interviewPitch30Sec && (
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

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare size={12} /> Follow-up Questions
                      </p>
                      <button
                        onClick={handleGenerateInterview}
                        disabled={generatingQA}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={generatingQA ? 'animate-spin' : ''} />
                        Regenerate
                      </button>
                    </div>
                    <FollowUpsSection followUps={analysis?.followUps} />
                  </div>
                </>
              )}

              {/* ── Details tab ── */}
              {activeTab === 'details' && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Edge Cases
                    </p>
                    <ListBlock
                      items={analysis?.edgeCases}
                      emptyText="No edge cases available."
                      prefix="→"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb size={12} /> Common Mistakes
                    </p>
                    <ListBlock
                      items={analysis?.commonMistakes}
                      emptyText="No common mistakes available."
                      prefix="!"
                      prefixClass="text-red-400"
                    />
                  </div>

                  {analysis?.optimizations?.length > 0 && (
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
      </div>
    </div>
  );
};

export default SnippetView;
