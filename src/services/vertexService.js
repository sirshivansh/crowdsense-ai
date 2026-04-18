/**
 * Vertex AI Service Layer — CrowdSense AI
 *
 * This service acts as the integration point for Google Cloud Vertex AI.
 * Currently running in SIMULATION mode — replace the stub body of
 * `callVertexEndpoint` with a real fetch() to your deployed model endpoint
 * when ready for production deployment.
 *
 * Deployment path:
 *   1. Deploy CongestionPredictor as a Vertex AI custom model
 *   2. Set VERTEX_ENDPOINT_URL to your endpoint resource name
 *   3. Replace simulateVertexResponse() with a real authenticated fetch
 */

const VERTEX_ENDPOINT_URL = 'https://us-central1-aiplatform.googleapis.com/v1/projects/crowdsense-ai-7d584/locations/us-central1/endpoints/YOUR_ENDPOINT_ID:predict';

/**
 * Simulates a Vertex AI model response.
 * Mirrors the output contract of CongestionPredictor.getTrendAnalysis().
 *
 * @param {number[]} historicalData - Recent density readings
 * @returns {{ predictionType: string, isIncreasing: boolean, confidence: number, message: string, trendScore: number }}
 */
function simulateVertexResponse(historicalData) {
  if (!historicalData || historicalData.length < 2) {
    return {
      predictionType: 'STABLE',
      isIncreasing: false,
      confidence: 0.2,
      message: 'Insufficient data — defaulting to stable.',
      trendScore: 0,
    };
  }

  // Reproduce WRC logic to generate a plausible simulated response
  const deltas = historicalData.slice(1).map((v, i) => v - historicalData[i]);
  const weightedSum = deltas.reduce((sum, d, i) => sum + d * (i + 1), 0);
  const weightTotal = deltas.reduce((sum, _, i) => sum + (i + 1), 0);
  const trendScore = weightedSum / weightTotal;
  const isIncreasing = trendScore > 0.005;

  let predictionType = 'STABLE';
  let message = 'Stable flow.';
  if (trendScore > 0.04) { predictionType = 'SEVERE'; message = 'Severe spike expected.'; }
  else if (trendScore > 0.01) { predictionType = 'RISING'; message = 'Increasing congestion.'; }
  else if (trendScore < -0.01) { predictionType = 'DISSIPATING'; message = 'Traffic dissipating.'; }

  const confidence = parseFloat(Math.min(0.99, Math.max(0.2, 0.7 + trendScore * 5)).toFixed(2));

  return { predictionType, isIncreasing, confidence, message, trendScore };
}

/**
 * Sends crowd density data to Vertex AI for inference.
 * Falls back gracefully on any error so the system never crashes.
 *
 * @param {{ historicalData: number[], zones?: object[] }} data
 * @returns {Promise<object>} Inference result matching CongestionPredictor's output contract
 */
export async function getPredictionFromVertex(data) {
  console.log('📡 Sending data to Vertex AI', { endpoint: VERTEX_ENDPOINT_URL, dataPoints: data.historicalData?.length });

  try {
    // ----- PRODUCTION: swap this block for a real fetch() -----
    // const response = await fetch(VERTEX_ENDPOINT_URL, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ instances: [data] })
    // });
    // const json = await response.json();
    // const prediction = json.predictions[0];
    // ----------------------------------------------------------

    // Simulate network latency (50–120ms)
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 70));

    const prediction = simulateVertexResponse(data.historicalData);

    console.log('🤖 Vertex AI response received', prediction);
    return prediction;

  } catch (error) {
    console.warn('[VertexService] Inference failed — falling back to local predictor.', error);
    return null; // caller handles null by using local logic
  }
}
