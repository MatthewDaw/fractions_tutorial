// U8 — interleaved mixed review: eligibility gate + the type-identification surface.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { eligibleMixSkills } from '../../src/kitchenProgress.js';
import MixedReview from '../../src/MixedReview.jsx';

function est(o = {}) {
  return {
    P_known: 0.1, fluency_stats: { median_latency: null, slope: null, n: 0 },
    max_scaffold_passed: null, transfer_passed: false, hint_dependence: 0,
    last_retention_probe: null, mastered_at: null, ...o,
  };
}

describe('U8 eligibleMixSkills — introduced recipes only', () => {
  it('includes mastered / lapsed / elevated-evidence skills, excludes cold-start', () => {
    const map = {
      ADD_SAME_DEN: est({ P_known: 0.97, max_scaffold_passed: 3, transfer_passed: true }), // mastered
      SIMPLIFY: est({ mastered_at: 123 }),       // was mastered (lapsed) → introduced
      ADD_UNLIKE_COPRIME: est({ P_known: 0.4 }), // elevated evidence → introduced
      IMPROPER_TO_MIXED: est({ P_known: 0.1 }),  // cold-start → NOT introduced
    };
    const out = eligibleMixSkills(map);
    expect(out).toContain('ADD_SAME_DEN');
    expect(out).toContain('SIMPLIFY');
    expect(out).toContain('ADD_UNLIKE_COPRIME');
    expect(out).not.toContain('IMPROPER_TO_MIXED');
  });
  it('returns [] for a null map', () => {
    expect(eligibleMixSkills(null)).toEqual([]);
  });
});

describe('U8 MixedReview surface', () => {
  it('shows the empty state when fewer than 2 recipes are introduced', () => {
    render(<MixedReview skills={['ADD_SAME_DEN']} onExit={() => {}} />);
    expect(screen.getByText(/Cook a few more recipes/i)).toBeTruthy();
  });
  it('asks "which recipe is this?" with a choice per eligible recipe', () => {
    render(<MixedReview skills={['ADD_SAME_DEN', 'SIMPLIFY']} onExit={() => {}} />);
    expect(screen.getByText(/Which recipe is this/i)).toBeTruthy();
    expect(screen.getByText('Same Denominators')).toBeTruthy();
    expect(screen.getByText('Simplify')).toBeTruthy();
  });
});
