import React from 'react';
import { Code2 } from 'lucide-react';
import SnippetCard from './SnippetCard';

const SnippetList = ({ snippets, loading, onDelete, onToggleFavorite }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!snippets || snippets.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
        <Code2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No snippets found
        </h3>
        <p className="text-gray-500">
          Start by adding your first code snippet!
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {snippets.map((snippet) => (
        <SnippetCard 
          key={snippet._id} 
          snippet={snippet} 
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default SnippetList;
