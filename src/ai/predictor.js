/**
 * Enhanced Congestion Predictor.
 * Uses weighted rate of change to provide proactive traffic intelligence.
 */
export class CongestionPredictor {
  /**
   * Analyzes historical density to identify trends.
   * @param {number[]} historicalData - Array of recent density values.
   * @returns {Object} { isIncreasing, confidence, message, trendScore }
   */
  static getTrendAnalysis(historicalData) {
    if (!historicalData || historicalData.length < 3) {
      return { 
        isIncreasing: false, 
        confidence: 0, 
        message: "Data stabilizing..." 
      };
    }

    // Calculate changes between intervals
    const deltas = [];
    for (let i = 1; i < historicalData.length; i++) {
        deltas.push(historicalData[i] - historicalData[i - 1]);
    }

    // Calculate weighted average of changes (most recent weights more)
    let weightedSum = 0;
    let weightTotal = 0;
    deltas.forEach((d, i) => {
        const weight = (i + 1);
        weightedSum += d * weight;
        weightTotal += weight;
    });

    const weightedRate = weightedSum / weightTotal;
    const isIncreasing = weightedRate > 0.005; // 0.5% growth threshold
    
    // Confidence based on consistency and data volume
    const consistency = 1 - Math.min(1, Math.abs(deltas[deltas.length - 1] - weightedRate) * 5);
    let confidence = Math.max(0.2, consistency * (historicalData.length / 10)); // Higher base confidence
    confidence = Math.min(0.99, confidence);

    // Human-readable message
    let message = "Stable flow.";
    if (weightedRate > 0.04) message = "Severe spike expected.";
    else if (weightedRate > 0.01) message = "Increasing congestion.";
    else if (weightedRate < -0.01) message = "Traffic dissipating.";

    return {
      isIncreasing,
      confidence: parseFloat(confidence.toFixed(2)),
      message,
      trendScore: weightedRate // useful for penalties
    };
  }

  /**
   * Deterministic confidence label
   */
  static getConfidenceLabel(confidence) {
    if (confidence > 0.8) return 'High';
    if (confidence > 0.5) return 'Medium';
    return 'Low';
  }

  /**
   * Proactive congestion check
   */
  static predictProactiveCongestion(zone, historicalData) {
    const analysis = this.getTrendAnalysis(historicalData);
    // If it's already high OR increasing rapidly, it's a risk
    return zone.density > 0.7 || (analysis.isIncreasing && zone.density > 0.5);
  }
}
