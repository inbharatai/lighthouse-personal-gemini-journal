import { describe, it, expect } from 'vitest';
import { SummarySchema } from '../shared/types.js';
import {
  COMPANION_SYSTEM_INSTRUCTION,
  SUMMARY_SYSTEM_INSTRUCTION,
} from '../server/gemini.js';

describe('Gemini Boundary & Summary Validation Unit Tests', () => {
  it('SummarySchema validates valid Gemini structured summary JSON', () => {
    const validJson = {
      abstract: 'The user reflected on their recent architecture designs and prioritized modular decoupling.',
      themes: ['Architecture', 'Refactoring', 'Priorities'],
      updatedAt: new Date().toISOString(),
      throughMessageCount: 4,
    };

    const parsed = SummarySchema.parse(validJson);
    expect(parsed.abstract).toBe(validJson.abstract);
    expect(parsed.themes.length).toBe(3);
  });

  it('SummarySchema rejects malformed summary with empty abstract or invalid counts', () => {
    const invalidEmpty = {
      abstract: '',
      themes: [],
      updatedAt: new Date().toISOString(),
      throughMessageCount: -1,
    };

    expect(() => SummarySchema.parse(invalidEmpty)).toThrow();
  });

  it('Companion system instruction enforces non-diagnostic medical boundary and safety', () => {
    expect(COMPANION_SYSTEM_INSTRUCTION).toContain('NOT a therapist');
    expect(COMPANION_SYSTEM_INSTRUCTION).toContain('UNTRUSTED USER DATA');
    expect(COMPANION_SYSTEM_INSTRUCTION).toContain('crisis lifeline');
  });

  it('Summary system instruction specifies neutral factual synopsis and theme constraints', () => {
    expect(SUMMARY_SYSTEM_INSTRUCTION).toContain('abstract');
    expect(SUMMARY_SYSTEM_INSTRUCTION).toContain('themes');
    expect(SUMMARY_SYSTEM_INSTRUCTION).toContain('700 characters');
  });
});
