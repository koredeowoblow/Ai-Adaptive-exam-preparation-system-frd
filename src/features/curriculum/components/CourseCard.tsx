import * as React from 'react';
import type { Course } from '../../../types/course.types';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

export interface CourseCardProps {
  course: Course;
  index?: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link
      to="/courses/$courseId"
      params={{ courseId: course._id }}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div
        className="course-card"
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          padding: '24px', cursor: 'pointer',
          background: 'var(--color-surface-0)',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em',
            padding: '2px 8px', borderRadius: 4, background: 'var(--color-surface-1)',
            color: 'var(--color-text-primary)', border: '1px solid var(--color-border)',
          }}>
            {course.code}
          </span>
          {course.level && (
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              padding: '2px 8px', borderRadius: 12,
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
            }}>
              {course.level}L
            </span>
          )}
        </div>

        <h3 style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 600,
          fontSize: '1.15rem', lineHeight: 1.3, margin: '0 0 16px 0',
          color: 'var(--color-text-primary)',
          flex: 1,
        }}>
          {course.title}
        </h3>

        <div style={{
          marginTop: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <span>View course</span>
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    </Link>
  );
};
