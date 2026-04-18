import { describe, it, expect } from 'vitest';
import { calculateDijkstraPath } from '../src/algorithms/dijkstra.js';

describe('Dijkstra Algorithm', () => {
  const nodes = {
    'A': { x: 0, y: 0 },
    'B': { x: 10, y: 0 },
    'C': { x: 0, y: 10 },
    'D': { x: 10, y: 10 },
    'E': { x: 20, y: 20 }
  };
  const edges = [
    ['A', 'B'], ['B', 'D'], ['A', 'C'], ['C', 'D'], ['D', 'E']
  ];

  it('calculates the shortest path in a simple graph', () => {
    const path = calculateDijkstraPath('A', 'D', nodes, edges);
    // Any valid path of length 2 edges is fine here since all weights are 1 by default
    expect(path).toHaveLength(3);
    expect(path[0]).toBe('A');
    expect(path[2]).toBe('D');
  });

  it('respects custom weights to avoid high-density nodes', () => {
    // Force path A -> C -> D by making B very heavy
    const getWeight = (n1, n2) => {
      if (n2 === 'B') return 100;
      return 1;
    };
    const path = calculateDijkstraPath('A', 'D', nodes, edges, getWeight);
    expect(path).toEqual(['A', 'C', 'D']);
  });

  it('handles same source and destination', () => {
    const path = calculateDijkstraPath('A', 'A', nodes, edges);
    expect(path).toEqual(['A']);
  });

  it('handles disconnected graph', () => {
    const discNodes = { 'A': {}, 'B': {}, 'C': {} };
    const discEdges = [['A', 'B']];
    const path = calculateDijkstraPath('A', 'C', discNodes, discEdges);
    expect(path).toEqual([]);
  });

  it('handles source or destination not in nodes', () => {
    expect(calculateDijkstraPath('Z', 'A', nodes, edges)).toEqual([]);
    expect(calculateDijkstraPath('A', 'Z', nodes, edges)).toEqual([]);
  });

  it('handles empty nodes or edges', () => {
    expect(calculateDijkstraPath('A', 'B', {}, [])).toEqual([]);
    expect(calculateDijkstraPath('A', 'B', nodes, [])).toEqual([]);
  });

  it('handles null/undefined inputs gracefully', () => {
    // @ts-ignore
    expect(calculateDijkstraPath(null, 'A', nodes, edges)).toEqual([]);
    // @ts-ignore
    expect(calculateDijkstraPath('A', undefined, nodes, edges)).toEqual([]);
  });

  it('finds the correct multi-hop path', () => {
    const path = calculateDijkstraPath('A', 'E', nodes, edges);
    expect(path).toEqual(['A', 'B', 'D', 'E']); // or A, C, D, E
    expect(path).toContain('D');
  });

  it('is efficient with 10+ nodes', () => {
    const largeNodes = {};
    const largeEdges = [];
    for(let i=0; i<20; i++) {
        largeNodes[`n${i}`] = {x:i, y:i};
        if(i > 0) largeEdges.push([`n${i-1}`, `n${i}`]);
    }
    const start = Date.now();
    const path = calculateDijkstraPath('n0', 'n19', largeNodes, largeEdges);
    const end = Date.now();
    expect(path).toHaveLength(20);
    expect(end - start).toBeLessThan(50); // should be sub-millisecond really
  });
});
