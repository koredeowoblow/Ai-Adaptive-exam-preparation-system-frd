import React, { useMemo } from 'react';

interface ExamWatermarkProps {
  studentName?: string;
  studentEmail?: string;
  sessionId?: string;
}

export const ExamWatermark: React.FC<ExamWatermarkProps> = ({
  studentName,
  studentEmail,
  sessionId,
}) => {
  const timestamp = useMemo(() => new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }), []);

  const watermarkText = useMemo(() => {
    const identifier = studentEmail || studentName || 'Student';
    const shortSession = sessionId ? sessionId.slice(-8) : '';
    return `${identifier} • ${shortSession ? `ID:${shortSession} • ` : ''}${timestamp}`;
  }, [studentName, studentEmail, sessionId, timestamp]);

  // Generate an SVG data URI pattern for the repeating diagonal watermark
  const svgPatternUri = useMemo(() => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200" viewBox="0 0 360 200">
      <text 
        x="20" 
        y="120" 
        fill="currentColor" 
        opacity="0.04" 
        font-size="12" 
        font-family="monospace" 
        font-weight="600" 
        letter-spacing="0.08em"
        transform="rotate(-22 20 120)">
        ${watermarkText}
      </text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }, [watermarkText]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 35,
        pointerEvents: 'none',
        userSelect: 'none',
        backgroundImage: `url("${svgPatternUri}")`,
        backgroundRepeat: 'repeat',
        color: 'var(--color-text-primary, #0f172a)',
      }}
    />
  );
};
