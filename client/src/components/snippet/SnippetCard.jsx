import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Star, Eye, Calendar, Trash2 } from 'lucide-react';

const SnippetCard = ({ snippet, onDelete, onToggleFavorite }) => {
  const formattedDate = new Date(snippet.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(snippet._id);
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(snippet._id, !snippet.isFavorite);
    }
  };

  return (
    <Link to={`/snippet/${snippet._id}`}>
      <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {snippet.title}
              </h3>
              <span className="text-sm text-gray-500">{snippet.language}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className="p-1.5 hover:bg-yellow-50 rounded-lg transition-colors group/favorite"
              title={snippet.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star 
                className={`w-4 h-4 transition-colors ${
                  snippet.isFavorite 
                    ? 'text-yellow-500 fill-yellow-500' 
                    : 'text-gray-400 group-hover/favorite:text-yellow-500'
                }`} 
              />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group/delete"
              title="Delete snippet"
            >
              <Trash2 className="w-4 h-4 text-gray-400 group-hover/delete:text-red-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Code Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <pre className="text-sm text-gray-700 overflow-hidden line-clamp-3">
            <code>{snippet.code}</code>
          </pre>
        </div>

        {/* Tags */}
        {snippet.aiTags && snippet.aiTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {snippet.aiTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {snippet.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
          </div>
          {snippet.complexity && (
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              {snippet.complexity}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default SnippetCard;
