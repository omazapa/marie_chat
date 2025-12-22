'use client';

import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

interface HTMLArtifactProps {
  html: string;
  className?: string;
}

export function HTMLArtifact({ html, className }: HTMLArtifactProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Sanitize HTML before inserting
      const sanitizedHTML = DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe', 'script', 'style'], // Be careful with these
        ADD_ATTR: ['target', 'src', 'frameborder', 'allowfullscreen'],
        FORCE_BODY: true,
      });
      
      containerRef.current.innerHTML = sanitizedHTML;

      // Execute scripts if any (Plotly/Charts often need this)
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Wrap script content in an IIFE to avoid global scope collisions (like "Identifier already declared")
        // and add a try-catch to prevent script errors from crashing the whole UI
        const scriptContent = oldScript.innerHTML;
        if (scriptContent.trim()) {
          const wrappedContent = `
            (function() {
              try {
                ${scriptContent}
              } catch (err) {
                console.error('Error executing artifact script:', err);
              }
            })();
          `;
          newScript.appendChild(document.createTextNode(wrappedContent));
        }
        
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [html]);

  return (
    <div 
      ref={containerRef} 
      className={`html-artifact overflow-auto max-w-full my-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm ${className || ''}`}
      style={{ minHeight: '100px' }}
    />
  );
}
