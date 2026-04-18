import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeCache } from '../src/utils/cache.js';
import { Routing } from '../src/components/Routing.js';
import { simulator } from '../src/simulation/simulator.js';
import { CongestionPredictor } from '../src/ai/predictor.js';

// Mock the whole simulator module
vi.mock('../src/simulation/simulator.js', () => {
  return {
    simulator: {
      state: {
        zones: [
          { id: 'gate_a', name: 'Gate A', density: 0.1 },
          { id: 'gate_b', name: 'Gate B', density: 0.1 },
          { id: 'section_101', name: 'Section 101', density: 0.1 },
          { id: 'section_205', name: 'Section 205', density: 0.1 },
          { id: 'food_court', name: 'Food Court', density: 0.1 },
          { id: 'restroom_north', name: 'Restrooms', density: 0.1 }
        ],
        historicalDensity: [0.3, 0.3, 0.3, 0.3, 0.3]
      },
      on: vi.fn()
    }
  };
});

describe('Routing Integration', () => {
  let routing;

  beforeEach(() => {
    routeCache.clear();
    // Directly mutate the state of the mocked simulator
    simulator.state.historicalDensity = [0.3, 0.3, 0.3, 0.3, 0.3];
    simulator.state.zones.forEach(z => z.density = 0.1);

    vi.stubGlobal('document', {
      getElementById: vi.fn().mockReturnValue({ innerHTML: '' })
    });
    routing = new Routing('mock-layer');
  });

  it('calculates a basic path', () => {
    const path = routing.calculatePath('gate_a', 'section_101');
    expect(path.length).toBeGreaterThan(1);
  });

  it('applies reactive penalty for high density', () => {
    simulator.state.zones.find(z => z.id === 'section_101').density = 0.9;
    const dist = routing.getDistance('nw_corner', 'section_101');
    const weight = routing.getWeight('nw_corner', 'section_101');
    expect(weight).toBeGreaterThan(dist + 1000);
  });

  it('applies proactive penalty when congestion is trending upwards', () => {
    // Use a node that is a zone (isZone: true) to ensure penalty is applied
    const weightStable = routing.getWeight('gate_a', 'section_101');

    // Force the predictor to see an increasing trend
    simulator.state.historicalDensity = [0.1, 0.5, 0.9];
    
    const weightRising = routing.getWeight('gate_a', 'section_101');
    
    expect(weightRising).toBeGreaterThan(weightStable);
  });

  it('handles same start and end', () => {
    expect(routing.calculatePath('gate_a', 'gate_a')).toEqual(['gate_a']);
  });
});
