// Main application logic
document.addEventListener('DOMContentLoaded', () => {
  const shuffleBtn = document.getElementById('shuffle-btn');
  shuffleBtn.addEventListener('click', shuffle);
});

// Handle shuffle button click
async function shuffle() {
  const resultDiv = document.getElementById("result");
  const button = document.querySelector("#shuffle-btn");
  button.disabled = true;
  resultDiv.innerHTML = "<p>Shuffling...</p>";
  logMessage("Shuffling 52-card deck...");

  try {
    const deck = createDeck();
    const shuffledDeck = await mossShuffle(deck);
    const klScore = computeKLScore(deck, shuffledDeck);
    const quality = klScore < 0.05 ? "excellent" : klScore < 0.1 ? "good" : klScore < 0.3 ? "passable" : "weak";
    const positionChange = computePositionChange(deck, shuffledDeck);
    const spearman = computeSpearmanCorrelation(deck, shuffledDeck);

    let similarity;
    if (spearman > 0.5) {
      similarity = "highly similar";
    } else if (spearman > 0.2) {
      similarity = "moderately similar";
    } else if (spearman > -0.2) {
      similarity = "dissimilar";
    } else {
      similarity = "highly dissimilar";
    }

    resultDiv.innerHTML = `
      <p>Top 5 cards: <span class="cards">${shuffledDeck.slice(0, 5).join(", ")}</span></p>
      <p>Randomness: <span class="score">${klScore.toFixed(3)} (${quality})</span></p>
      <p>Avg. Position Change: <span class="metric">${positionChange.toFixed(1)} positions</span></p>
      <p>Order Similarity: <span class="correlation">${spearman.toFixed(3)} (${similarity})</span></p>
      <p class="stats">Shuffles: ${totalShuffles} | Cuts: ${totalCuts} | Errors: ${totalErrors}</p>
    `;
    logMessage(`Shuffle complete. KL Score: ${klScore.toFixed(3)} (${quality})`);
    logMessage(`Position Change: ${positionChange.toFixed(1)}, Spearman: ${spearman.toFixed(3)} (${similarity})`);
    logMessage(`Stats: Shuffles=${totalShuffles}, Cuts=${totalCuts}, Errors=${totalErrors}`);
  } catch (error) {
    totalErrors++;
    resultDiv.innerHTML = "<p>Error during shuffle.</p>";
    logMessage(`Error: ${error.message}`);
  }

  button.disabled = false;
}