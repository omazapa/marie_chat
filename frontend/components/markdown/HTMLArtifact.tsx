'use client';

import { useState } from 'react';

interface HTMLArtifactProps {
  html: string;
  className?: string;
}

export function HTMLArtifact({ html, className }: HTMLArtifactProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`html-artifact-container my-6 ${className || ''}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border border-b-0 border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">HTML Artifact</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(html);
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Copy code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title={isExpanded ? "Shrink" : "Expand"}
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            )}
          </button>
          <button 
            onClick={() => {
              const win = window.open();
              if (win) {
                win.document.write(html);
                win.document.close();
              }
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Open in new tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </button>
        </div>
      </div>
      <div 
        className="bg-white border border-gray-200 rounded-b-lg shadow-sm overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height: isExpanded ? '800px' : '450px' }}
      >
        <iframe
          srcDoc={html}
          title="HTML Artifact"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
