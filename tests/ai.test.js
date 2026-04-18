import { describe, it, expect } from 'vitest';
import { CongestionPredictor } from '../src/ai/predictor.js';

describe('CongestionPredictor Logic', () => {
  it('detects a clear increasing trend', () => {
    const data = [0.1, 0.2, 0.4, 0.7, 0.8];
    const analysis = CongestionPredictor.getTrendAnalysis(data);
    expect(analysis.isIncreasing).toBe(true);
    // Flexible match since it could be 'Increasing' or 'Severe spike'
    expect(analysis.message).toMatch(/Increasing|Severe/);
    expect(analysis.trendScore).toBeGreaterThan(0);
  });

  it('detects a stable trend', () => {
    const data = [0.5, 0.51, 0.49, 0.5, 0.5];
    const analysis = CongestionPredictor.getTrendAnalysis(data);
    expect(analysis.isIncreasing).toBe(false);
    expect(analysis.message).toBe('Stable flow.');
  });

  it('detects a decreasing trend', () => {
    const data = [0.8, 0.7, 0.5, 0.3, 0.1];
    const analysis = CongestionPredictor.getTrendAnalysis(data);
    expect(analysis.isIncreasing).toBe(false);
    expect(analysis.message).toContain('dissipating');
    expect(analysis.trendScore).toBeLessThan(0);
  });

  it('calculates higher confidence with more data and consistency', () => {
    const stableLong = [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4];
    const noisyShort = [0.1, 0.8, 0.2];
    
    const analysisHigh = CongestionPredictor.getTrendAnalysis(stableLong);
    const analysisLow = CongestionPredictor.getTrendAnalysis(noisyShort);
    
    expect(analysisHigh.confidence).toBeGreaterThan(analysisLow.confidence);
  });

  it('returns High confidence label for high confidence values', () => {
    expect(CongestionPredictor.getConfidenceLabel(0.9)).toBe('High');
  });

  it('returns Medium confidence label for mid values', () => {
    expect(CongestionPredictor.getConfidenceLabel(0.6)).toBe('Medium');
  });

  it('returns Low confidence label for low values', () => {
    expect(CongestionPredictor.getConfidenceLabel(0.2)).toBe('Low');
  });

  it('handles small data sets (less than 3)', () => {
    const data = [0.5, 0.6];
    const analysis = CongestionPredictor.getTrendAnalysis(data);
    expect(analysis.confidence).toBe(0);
    expect(analysis.message).toBe('Data stabilizing...');
  });

  it('handles empty data', () => {
    const analysis = CongestionPredictor.getTrendAnalysis([]);
    expect(analysis.isIncreasing).toBe(false);
    expect(analysis.confidence).toBe(0);
  });

  it('proactively predicts congestion on rising trend', () => {
    const zone = { density: 0.55 };
    const risingTrend = [0.2, 0.3, 0.4, 0.5];
    const risk = CongestionPredictor.predictProactiveCongestion(zone, risingTrend);
    expect(risk).toBe(true);
  });

  it('does not proactively flag low density stable zones', () => {
    const zone = { density: 0.2 };
    const stableTrend = [0.2, 0.2, 0.2];
    const risk = CongestionPredictor.predictProactiveCongestion(zone, stableTrend);
    expect(risk).toBe(false);
  });

  it('handles null/undefined data gracefully', () => {
    // @ts-ignore
    const analysis = CongestionPredictor.getTrendAnalysis(null);
    expect(analysis.isIncreasing).toBe(false);
    expect(analysis.confidence).toBe(0);
  });

  it('detects severe spikes', () => {
    const spike = [0.1, 0.2, 0.8]; // jump of 0.6
    const analysis = CongestionPredictor.getTrendAnalysis(spike);
    expect(analysis.message).toBe('Severe spike expected.');
  });
});
