import * as React from 'react';
import { GraduationCap } from 'lucide-react';

export const EduAdaptLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => (
  <GraduationCap size={size} className={`shrink-0 ${className}`} aria-hidden="true" />
);
