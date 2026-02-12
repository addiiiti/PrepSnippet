import React from 'react';

const CodeEditor = ({ 
  value, 
  onChange, 
  language = 'javascript',
  placeholder = 'Paste your code here...' 
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-end px-4 py-2 bg-gray-100 rounded-t-lg border-b border-gray-300">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-96 px-4 py-4 bg-gray-50 text-gray-800 font-mono text-sm rounded-b-lg border border-gray-300 border-t-0 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        spellCheck="false"
      />
    </div>
  );
};

export default CodeEditor;
