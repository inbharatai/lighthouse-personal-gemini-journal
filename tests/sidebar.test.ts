import { describe, it, expect } from 'vitest';
import { formatLastActive } from '../src/components/Sidebar.js';

describe('Sidebar formatLastActive Unit Tests', () => {
  it('returns "Just now" for timestamps within the last 40 seconds', () => {
    const now = new Date().toISOString();
    expect(formatLastActive(now)).toBe('Just now');

    const thirtySecAgo = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatLastActive(thirtySecAgo)).toBe('Just now');
  });

  it('returns minute increments for recent activity within an hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatLastActive(fiveMinAgo)).toBe('5m ago');

    const fortyFiveMinAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    expect(formatLastActive(fortyFiveMinAgo)).toBe('45m ago');
  });

  it('returns hour increments for activity within 24 hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatLastActive(twoHoursAgo)).toBe('2h ago');

    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    expect(formatLastActive(twentyHoursAgo)).toBe('20h ago');
  });

  it('returns "Yesterday" for activity 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
    expect(formatLastActive(oneDayAgo)).toBe('Yesterday');
  });

  it('returns days ago for activity between 2 and 6 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatLastActive(threeDaysAgo)).toBe('3d ago');
  });

  it('handles invalid timestamps gracefully without throwing', () => {
    expect(formatLastActive('invalid-date-format')).toBe('Recently');
    expect(formatLastActive('')).toBe('Recently');
  });
});
