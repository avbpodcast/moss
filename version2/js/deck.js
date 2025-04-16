// Global counters
let totalCuts = 0;
let totalShuffles = 0;
let totalErrors = 0;

// Create a standard 52-card deck
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

// Log messages to the log area
function logMessage(message) {
  const log = document.getElementById("log");
  const timestamp = new Date().toLocaleTimeString();
  log.innerHTML += `[${timestamp}] ${message}\n`;
  log.scrollTop = log.scrollHeight;
}