import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeCache } from '../src/utils/cache.js';
import { Routing } from '../src/components/Routing.js';

describe('Robustness and Performance', () => {
  describe('Route Cache', () => {
    beforeEach(() => {
      routeCache.clear();
    });

    it('stores and retrieves a route', () => {
      const path = ['A', 'B', 'C'];
      routeCache.set('A', 'C', path);
      expect(routeCache.get('A', 'C')).toEqual(path);
    });

    it('returns null for missing keys', () => {
      expect(routeCache.get('A', 'Z')).toBeNull();
    });

    it('expires entries after timeout', () => {
      vi.useFakeTimers();
      const path = ['A', 'B'];
      routeCache.set('A', 'B', path);
      
      vi.advanceTimersByTime(31000); // Default timeout is 30s
      expect(routeCache.get('A', 'B')).toBeNull();
      vi.useRealTimers();
    });

    it('clears all entries', () => {
      routeCache.set('A', 'B', ['A', 'B']);
      routeCache.clear();
      expect(routeCache.get('A', 'B')).toBeNull();
    });
  });

  describe('Integration Performance', () => {
    beforeEach(() => {
      routeCache.clear();
      vi.stubGlobal('document', {
        getElementById: vi.fn().mockReturnValue({ innerHTML: '' })
      });
    });

    it('caching makes repeated requests faster', () => {
      const routing = new Routing('mock');
      
      const start1 = performance.now();
      routing.calculatePath('gate_a', 'gate_b');
      const end1 = performance.now();
      
      const start2 = performance.now();
      routing.calculatePath('gate_a', 'gate_b');
      const end2 = performance.now();
      
      const time1 = end1 - start1;
      const time2 = end2 - start2;
      
      // The second call should be significantly faster (near zero)
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Edge Cases & Robustness', () => {
    beforeEach(() => {
      routeCache.clear();
    });

    it('handles unexpected node structures in Routing', () => {
      const routing = new Routing('mock');
      // @ts-ignore
      routing.nodes = { 'invalid': null };
      expect(routing.calculatePath('invalid', 'gate_a')).toEqual([]);
    });

    it('handles empty edge lists', () => {
      const routing = new Routing('mock');
      // @ts-ignore
      routing.edges = [];
      expect(routing.calculatePath('gate_a', 'gate_b')).toEqual([]);
    });

    it('gracefully handles missing DOM elements', () => {
      vi.stubGlobal('document', { getElementById: () => null });
      const routing = new Routing('missing');
      expect(() => routing.showRoute('gate_a', 'gate_b')).not.toThrow();
    });
  });
});
