// Compute KL divergence score for randomness quality
function computeKLScore(before, after) {
  const n = 52;
  const numBins = 8;
  const binSize = n / numBins;
  const observed = new Array(numBins).fill(0);
  
  for (let i = 0; i < n; i++) {
    const card = before[i];
    const newIndex = after.indexOf(card);
    observed[Math.floor(newIndex / binSize)]++;
  }
  
  for (let i = 0; i < numBins; i++) {
    observed[i] /= n;
  }
  
  let score = 0;
  for (let p of observed) {
    if (p > 0) score += p * Math.log(p * numBins);
  }
  return Math.max(0, score);
}

// Compute average position change
function computePositionChange(before, after) {
  let totalChange = 0;
  for (let i = 0; i < 52; i++) {
    const card = before[i];
    const newIndex = after.indexOf(card);
    totalChange += Math.abs(newIndex - i);
  }
  return totalChange / 52;
}

// Compute Spearman's rank correlation
function computeSpearmanCorrelation(before, after) {
  const n = 52;
  const ranksBefore = new Array(n);
  const ranksAfter = new Array(n);
  
  for (let i = 0; i < n; i++) {
    ranksBefore[before[i]] = i;
    ranksAfter[after[i]] = i;
  }
  
  let sumDiffSquared = 0;
  for (let i = 0; i < n; i++) {
    const diff = ranksBefore[before[i]] - ranksAfter[before[i]];
    sumDiffSquared += diff * diff;
  }
  
  return 1 - (6 * sumDiffSquared) / (n * (n * n - 1));
}