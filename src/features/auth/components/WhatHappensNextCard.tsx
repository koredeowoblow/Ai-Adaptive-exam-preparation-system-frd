import * as React from 'react';
import { Layers, BookOpen, Sparkles } from 'lucide-react';

export const WhatHappensNextCard: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Choose your department and level',
      description: 'Select your degree program and academic year (100 to 500 level) so question banks align with your faculty syllabus.',
      icon: <Layers size={18} className="text-[var(--auth-accent)]" aria-hidden="true" />,
    },
    {
      num: '2',
      title: 'Confirm your semester courses',
      description: 'Review your semester course list (such as MTH 101, PHY 101, or CSC 101) and prioritize which areas need the most preparation.',
      icon: <BookOpen size={18} className="text-[var(--auth-accent)]" aria-hidden="true" />,
    },
    {
      num: '3',
      title: 'Practice with adaptive exam questions',
      description: 'Answer curriculum-aligned questions that adjust difficulty as you learn, complete with detailed explanations for every missed concept.',
      icon: <Sparkles size={18} className="text-[var(--auth-accent)]" aria-hidden="true" />,
    },
  ];

  return (
    <div className="bg-[var(--auth-side-bg)] border border-[var(--auth-side-border)] rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--auth-text-muted)]">
          Getting started
        </span>
        <h3 className="text-xl font-bold tracking-[-0.01em] text-[var(--auth-text)] mt-1 mb-2">
          What happens after you sign up
        </h3>
        <p className="text-sm text-[var(--auth-text-muted)] leading-relaxed m-0">
          Account setup takes under one minute. Here is the process before your first mock test.
        </p>
      </div>

      <div className="space-y-5">
        {steps.map((step) => (
          <div
            key={step.num}
            className="flex items-start gap-4 p-4 rounded-xl border border-[var(--auth-card-border)] bg-[var(--auth-card-bg)]"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--auth-accent)]/10 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[var(--auth-link)]">
                  Step {step.num}
                </span>
                <span className="text-sm font-semibold text-[var(--auth-text)]">
                  {step.title}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--auth-text-muted)] leading-relaxed m-0">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--auth-side-border)] flex items-center justify-between text-xs text-[var(--auth-text-muted)]">
        <span>No credit card required</span>
        <span>Free university account</span>
      </div>
    </div>
  );
};
