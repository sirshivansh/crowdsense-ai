import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Routing } from '../components/Routing.js';

// Mock the simulator module
vi.mock('../data/simulation.js', () => ({
  simulator: {
    state: {
      zones: [
        { id: 'gate_a', density: 0.3 },
        { id: 'gate_b', density: 0.2 },
        { id: 'section_101', density: 0.4 },
        { id: 'section_205', density: 0.5 },
        { id: 'food_court', density: 0.6 },
        { id: 'restroom_north', density: 0.1 }
      ]
    }
  }
}));

// Mock DOM elements
global.document = {
  getElementById: vi.fn(() => null)
};

describe('Routing Algorithm - calculatePath()', () => {
  let routing;

  beforeEach(() => {
    // Create a fresh Routing instance for each test
    routing = new Routing('test-layer');
  });

  // TEST 1: Normal shortest path between two nodes
  describe('Normal shortest path', () => {
    it('should find path from gate_a to gate_b', () => {
      const path = routing.calculatePath('gate_a', 'gate_b');
      
      // Path should start with gate_a and end with gate_b
      expect(path[0]).toBe('gate_a');
      expect(path[path.length - 1]).toBe('gate_b');
      // Path should have multiple nodes (not direct if not adjacent)
      expect(path.length).toBeGreaterThanOrEqual(2);
    });

    it('should find path from restroom_north to food_court', () => {
      const path = routing.calculatePath('restroom_north', 'food_court');
      
      expect(path[0]).toBe('restroom_north');
      expect(path[path.length - 1]).toBe('food_court');
      expect(path.length).toBeGreaterThanOrEqual(2);
    });

    it('should find path between adjacent nodes', () => {
      const path = routing.calculatePath('gate_a', 'nw_corner');
      
      // gate_a and nw_corner are connected in edges
      expect(path[0]).toBe('gate_a');
      expect(path[path.length - 1]).toBe('nw_corner');
      // Adjacent nodes should have short path
      expect(path.length).toBeLessThanOrEqual(3);
    });
  });

  // TEST 2: Edge case - same start and end node
  describe('Same start and end node', () => {
    it('should return path with single node when start === end', () => {
      const path = routing.calculatePath('gate_a', 'gate_a');
      
      // Should return array with just the node itself
      expect(path.length).toBe(1);
      expect(path[0]).toBe('gate_a');
    });

    it('should handle single node path for different zones', () => {
      const path = routing.calculatePath('section_101', 'section_101');
      
      expect(path).toEqual(['section_101']);
    });
  });

  // TEST 3: Disconnected nodes (no path exists)
  describe('Disconnected graph scenarios', () => {
    it('should return incomplete path if node is unreachable', () => {
      // Create a copy with disconnected nodes
      const testRouting = new Routing('test-layer');
      
      // Add isolated node not connected to any edges
      testRouting.nodes['isolated'] = { x: 1000, y: 1000, isZone: false };
      
      const path = testRouting.calculatePath('gate_a', 'isolated');
      
      // Path should be very short (just the unreachable node) or length 1
      // meaning no intermediate nodes were found
      expect(path.length).toBeLessThanOrEqual(2);
      // But should still end at the requested node if that's what was asked for
      expect(path[path.length - 1]).toBe('isolated');
    });

    it('should handle path request with non-existent node gracefully', () => {
      // Even if node doesn't exist, Dijkstra should handle it
      const path = routing.calculatePath('gate_a', 'non_existent_node');
      
      // Should return a path but won't reach non-existent node
      expect(Array.isArray(path)).toBe(true);
    });
  });

  // TEST 4: Empty/Invalid input
  describe('Empty and edge case input', () => {
    it('should handle empty string nodes', () => {
      const path = routing.calculatePath('', 'gate_a');
      
      expect(Array.isArray(path)).toBe(true);
    });

    it('should handle null-like node references', () => {
      const path = routing.calculatePath('gate_a', '');
      
      expect(Array.isArray(path)).toBe(true);
    });

    it('should work with all valid node references', () => {
      const nodeKeys = Object.keys(routing.nodes);
      const firstNode = nodeKeys[0];
      const lastNode = nodeKeys[nodeKeys.length - 1];
      
      const path = routing.calculatePath(firstNode, lastNode);
      
      expect(path[0]).toBe(firstNode);
      expect(path.length).toBeGreaterThanOrEqual(1);
    });
  });

  // TEST 5: Path structure validation
  describe('Path structure and validity', () => {
    it('should return valid path where consecutive nodes are connected', () => {
      const path = routing.calculatePath('gate_a', 'food_court');
      
      // Check that path starts correct
      expect(path[0]).toBe('gate_a');
      
      // Verify consecutive nodes are connected by edges
      for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];
        
        const isConnected = routing.edges.some(
          edge => (edge[0] === current && edge[1] === next) ||
                   (edge[0] === next && edge[1] === current)
        );
        expect(isConnected).toBe(true, 
          `Nodes ${current} and ${next} should be connected by an edge`);
      }
    });

    it('should return only valid node IDs in path', () => {
      const path = routing.calculatePath('gate_a', 'section_205');
      const validNodeIds = Object.keys(routing.nodes);
      
      for (let nodeId of path) {
        expect(validNodeIds).toContain(nodeId);
      }
    });

    it('should not have duplicate nodes in path (except single node case)', () => {
      const path = routing.calculatePath('gate_a', 'food_court');
      
      if (path.length > 1) {
        const uniqueNodes = new Set(path);
        expect(uniqueNodes.size).toBe(path.length);
      }
    });
  });

  // TEST 6: Multiple paths - consistency
  describe('Path consistency', () => {
    it('should return consistent results for same input', () => {
      const path1 = routing.calculatePath('gate_a', 'food_court');
      const path2 = routing.calculatePath('gate_a', 'food_court');
      
      expect(path1).toEqual(path2);
    });

    it('should return valid path for multiple node pairs', () => {
      const testPairs = [
        ['gate_a', 'gate_b'],
        ['restroom_north', 'section_205'],
        ['section_101', 'food_court']
      ];
      
      for (let [start, end] of testPairs) {
        const path = routing.calculatePath(start, end);
        expect(path[0]).toBe(start);
        expect(path[path.length - 1]).toBe(end);
      }
    });
  });
});