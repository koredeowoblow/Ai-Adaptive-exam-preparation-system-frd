import { useEffect } from 'react';

/**
 * Sets the document title for the current page.
 * Falls back to the default title when the component unmounts.
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    
    // Normalize any em dashes to standard hyphens
    let sanitized = (title || '').replace(/\u2014/g, '-').trim();

    // Remove any redundant trailing "- EduAdapt" or "EduAdapt"
    sanitized = sanitized
      .replace(/\s*-\s*EduAdapt$/i, '')
      .replace(/\s+EduAdapt$/i, '')
      .trim();

    document.title = sanitized ? `${sanitized} - EduAdapt` : 'EduAdapt';

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

