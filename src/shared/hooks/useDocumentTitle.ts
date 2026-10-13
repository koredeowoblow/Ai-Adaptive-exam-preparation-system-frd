import { useEffect } from 'react';

/**
 * Sets the document title for the current page.
 * Falls back to the default title when the component unmounts.
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} — EduAdapt`;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
