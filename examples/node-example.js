import { MOSS, createDeck } from '../src/moss.js';

// Custom logger
const logMessage = (message) => console.log(`[MOSS] ${message}`);

// Test with different deck sizes
async function runTests() {
    const sizes = [10, 52, 96];
    for (const size of sizes) {
        console.log(`\nTesting deck size: ${size}`);
        const deck = createDeck(size);
        console.log('Initial deck (first 5):', deck.slice(0, Math.min(5, size)));
        const result = await MOSS(deck, `test-deck-${size}`, { logMessage });
        console.log('Shuffled deck (first 5):', result.slice(0, Math.min(5, size)));
    }
}

runTests();