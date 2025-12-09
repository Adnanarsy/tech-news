import { describe, it, expect } from 'vitest';
import { timeAgo } from '@/lib/time';

function isoOffset(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

describe('timeAgo', () => {
  it('returns "just now" for <1 minute', () => {
    const iso = new Date().toISOString();
    const actual = timeAgo(iso);
    expect(actual).toBe('just now');
  });

  it('formats 1 minute', () => {
    expect(timeAgo(isoOffset(1))).toBe('1 min ago');
  });

  it('formats 59 minutes', () => {
    expect(timeAgo(isoOffset(59))).toBe('59 mins ago');
  });

  it('formats 1 hour', () => {
    expect(timeAgo(isoOffset(60))).toBe('1 hour ago');
  });

  it('formats 23 hours', () => {
    expect(timeAgo(isoOffset(23 * 60))).toBe('23 hours ago');
  });

  it('formats 1 day', () => {
    expect(timeAgo(isoOffset(24 * 60))).toBe('1 day ago');
  });
});
