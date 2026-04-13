import { useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'interview', label: 'Interview Prep' },
  { id: 'details', label: 'Details' },
];

function Badge({ children, variant = 'default' }) {
  const className = {
    default: 'badge-default',
    blue: 'badge-blue',
    green: 'badge-green',
    amber: 'badge-amber',
    purple: 'badge-purple',
  }[variant];

  return <span className={`result-badge ${className}`}>{children}</span>;
}

function ListBlock({ items, emptyText, prefix = '-', prefixClass = 'result-list-prefix' }) {
  if (!items || items.length === 0) {
    return <p className="result-empty">{emptyText}</p>;
  }

  return (
    <ul className="result-list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className="result-list-item">
          <span className={prefixClass}>{prefix}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FollowUpsSection({ followUps }) {
  const [openIndexes, setOpenIndexes] = useState([]);

  const toggle = (index) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
  };

  if (!followUps || followUps.length === 0) {
    return <p className="result-empty">No follow-up questions yet.</p>;
  }

  return (
    <div className="followups-root">
      {followUps.map((item, idx) => {
        const isOpen = openIndexes.includes(idx);
        return (
          <div key={`${item.question}-${idx}`} className="followup-item">
            <div className="followup-header">
              <div>
                <p className="followup-question">Q{idx + 1}. {item.question}</p>
                {item.intent ? <p className="followup-intent">{item.intent}</p> : null}
              </div>
              <button type="button" className="followup-toggle" onClick={() => toggle(idx)}>
                {isOpen ? 'Hide' : 'Reveal'}
              </button>
            </div>
            {isOpen ? <p className="followup-answer">{item.answer || 'No answer provided.'}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function ResultView({ analysis }) {
  const [activeTab, setActiveTab] = useState('overview');

  const complexity = analysis?.complexity || {};
  const followUps = analysis?.followUps || [];

  const tags = useMemo(() => analysis?.tags || [], [analysis]);

  if (!analysis) return null;

  return (
    <section className="result-card">
      <div className="result-top">
        <h3>Analysis</h3>
        <div className="result-badge-row">
          <Badge variant="purple">{analysis.pattern || 'Algorithmic Pattern'}</Badge>
          {complexity.time ? <Badge variant="green">T: {complexity.time}</Badge> : null}
          {complexity.space ? <Badge variant="amber">S: {complexity.space}</Badge> : null}
        </div>
      </div>

      {tags.length ? (
        <div className="result-badge-row">
          {tags.map((tag, idx) => (
            <Badge key={`${tag}-${idx}`} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="result-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'result-tab active' : 'result-tab'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="result-body">
        {activeTab === 'overview' ? (
          <>
            <div className="result-block">
              <strong>What it does</strong>
              <p>{analysis.summary || 'No summary returned.'}</p>
            </div>

            <div className="result-block">
              <strong>Why it works</strong>
              <p>{analysis.whyItWorks || 'No explanation returned.'}</p>
            </div>

            <div className="result-block">
              <strong>Complexity</strong>
              <p>
                Time: {complexity.time || 'N/A'}
                <br />
                Space: {complexity.space || 'N/A'}
              </p>
              {complexity.reasoning ? <p>{complexity.reasoning}</p> : null}
            </div>
          </>
        ) : null}

        {activeTab === 'interview' ? (
          <>
            {analysis.interviewPitch30Sec ? (
              <div className="result-block pitch-block">
                <strong>30-Second Pitch</strong>
                <p>"{analysis.interviewPitch30Sec}"</p>
              </div>
            ) : null}

            <div className="result-block">
              <strong>Follow-up Questions</strong>
              <FollowUpsSection followUps={followUps} />
            </div>
          </>
        ) : null}

        {activeTab === 'details' ? (
          <>
            <div className="result-block">
              <strong>Edge Cases</strong>
              <ListBlock
                items={analysis.edgeCases}
                emptyText="No edge cases available."
                prefix="->"
              />
            </div>

            <div className="result-block">
              <strong>Common Mistakes</strong>
              <ListBlock
                items={analysis.commonMistakes}
                emptyText="No common mistakes available."
                prefix="!"
                prefixClass="result-list-prefix red"
              />
            </div>

            <div className="result-block">
              <strong>Optimizations</strong>
              <ListBlock
                items={analysis.optimizations}
                emptyText="No optimizations available."
                prefix="^"
                prefixClass="result-list-prefix green"
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
