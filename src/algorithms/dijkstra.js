export function calculateDijkstraPath(startId, endId, nodes, edges, getWeightFn) {
  if (!nodes || !edges || !Array.isArray(edges)) return [];
  const distances = {};
  const previous = {};
  const activeNodes = new Set(Object.keys(nodes));

  // Initialize
  for (let node of activeNodes) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[startId] = 0;

  while (activeNodes.size > 0) {
    // Get node with min distance
    let current = null;
    for (let node of activeNodes) {
      if (!current || distances[node] < distances[current]) {
        current = node;
      }
    }

    if (current === endId) break;
    if (distances[current] === Infinity) break;

    activeNodes.delete(current);

    // Neighbors
    const neighbors = edges
      .filter(e => e[0] === current || e[1] === current)
      .map(e => e[0] === current ? e[1] : e[0]);

    for (let neighbor of neighbors) {
      if (!activeNodes.has(neighbor)) continue;
      
      const weight = getWeightFn ? getWeightFn(current, neighbor) : 1;
      const alt = distances[current] + weight;
      
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }

  // Trace back
  const path = [];
  let curr = endId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }
  
  return path.length > 0 && path[0] === startId ? path : [];
}
