// MOSS (Manu's Overhand Shuffle Simulator) Prototype 3
// Supports arbitrary deck sizes with randomized packet drops and cryptographic randomness

// Utility: Create a deck of arbitrary size
export function createDeck(size = 52) {
    if (size === 52) {
        const suits = ["S", "H", "D", "C"];
        const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push(`${rank}${suit}`);
            }
        }
        return deck;
    } else {
        // Generic deck for arbitrary size
        return Array.from({ length: size }, (_, i) => `Card${i + 1}`);
    }
}

// Utility: Compute KL divergence score
function computeKLScore(before, after) {
    const n = before.length;
    const numBins = Math.max(8, Math.ceil(n / 10));
    const binSize = n / numBins;
    const observed = new Array(numBins).fill(0);
    const uniform = 1 / numBins;
    for (let i = 0; i < n; i++) {
        const card = before[i];
        const newIndex = after.indexOf(card);
        const bin = Math.floor(newIndex / binSize);
        observed[bin]++;
    }
    for (let i = 0; i < numBins; i++) {
        observed[i] /= n;
    }
    let klScore = 0;
    const epsilon = 1e-10;
    for (let i = 0; i < numBins; i++) {
        const p = observed[i] || epsilon;
        klScore += p * Math.log(p / uniform);
    }
    return Math.max(0, klScore);
}

// Utility: Get quality label for KL score
function getQualityLabel(klScore) {
    let label;
    if (klScore > 0.5) label = 'weak';
    else if (klScore > 0.3) label = 'passable';
    else if (klScore > 0.1) label = 'good';
    else if (klScore > 0.05) label = 'excellent';
    else if (klScore > 0.01) label = 'near perfect';
    else label = 'perfect';
    const colorMap = {
        'weak': '#FF6600',
        'passable': '#FF9900',
        'good': '#FFFF00',
        'excellent': '#99FF00',
        'near perfect': '#33FF00',
        'perfect': '#00FF00'
    };
    return { label, color: colorMap[label] };
}

// Utility: Obfuscate split size
function obfuscateSplitSize(size, total) {
    return `~${Math.round((size / total) * 100)}%`;
}

// Utility: Obfuscate drop size
function obfuscateDropSize(size) {
    return `${size} cards`;
}

// Utility: Obfuscate cut size
function obfuscateCutSize(size, total) {
    return `~${Math.round((size / total) * 100)}%`;
}

// Utility: Compute cryptographic commitment
async function computeCommitment(deckId, suffix, size) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${deckId}${suffix}${size}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16);
}

// Main MOSS function
export async function MOSS(array, deckId, { logMessage = console.log } = {}) {
    const N = array.length;
    if (N < 2 || array.includes(undefined)) {
        logMessage(`Error: MOSS invalid input for ${deckId} - Length: ${N}, Undefined: ${array.includes(undefined)}`);
        return [...array];
    }

    let result = [...array];
    const before = [...array];
    const logBuffer = [];
    let totalDrops = 0, totalCuts = 0;

    // Randomness for all sequences
    const maxSequences = 22;
    const maxDropsPerSequence = Math.ceil(N / 10);
    const randomBytes = await crypto.subtle.getRandomValues(
        new Uint8Array(1 + maxSequences * (1 + maxDropsPerSequence + 1 + 1))
    );
    let byteIndex = 0;

    // Number of shuffle sequences (7–22, biased toward 10–19)
    const numSequences = 7 + (randomBytes[byteIndex++] % 16);
    logBuffer.push({ type: "start", message: `MOSS for ${deckId}: ${numSequences} sequences` });

    for (let i = 0; i < numSequences; i++) {
        // Split deck (50%–80%)
        const minSplitSize = Math.floor(N * 0.5);
        const maxSplitSize = Math.floor(N * 0.8);
        const splitSize = minSplitSize + (randomBytes[byteIndex++] % (maxSplitSize - minSplitSize + 1));
        let leftHand = result.slice(0, N - splitSize);
        let rightHand = result.slice(N - splitSize);
        logBuffer.push({
            type: "split",
            sequence: i + 1,
            size: splitSize,
            obfuscated: obfuscateSplitSize(splitSize, N)
        });

        // Packet drops from right to left (randomized sizes)
        let dropCount = 0;
        const minRightHandSize = Math.ceil(N * 0.1);
        const initialRightHandSize = rightHand.length;
        const minPacketSize = Math.ceil(initialRightHandSize * 0.125);
        const maxPacketSize = Math.floor(initialRightHandSize * 0.333);
        const totalDropsEst = Math.ceil(initialRightHandSize / minPacketSize);
        const numHidden = Math.max(1, Math.floor(totalDropsEst / 4));
        const hiddenIndices = new Set();
        for (let j = 0; j < numHidden; j++) {
            hiddenIndices.add(randomBytes[byteIndex++] % totalDropsEst);
        }

        while (rightHand.length > 0) {
            if (rightHand.length < minRightHandSize) {
                const size = rightHand.length;
                leftHand.unshift(...rightHand.reverse());
                logBuffer.push({
                    type: "drop",
                    sequence: i + 1,
                    dropNum: dropCount + 1,
                    size,
                    obfuscated: hiddenIndices.has(dropCount)
                        ? `Dropped [hidden] cards`
                        : `Dropped remaining ${obfuscateDropSize(size)}`
                });
                if (hiddenIndices.has(dropCount)) {
                    logBuffer[logBuffer.length - 1].commit = await computeCommitment(deckId, `_hiddenDrop${i}_${dropCount}`, size);
                }
                rightHand = [];
                dropCount++;
                totalDrops++;
                break;
            }

            const maxAvailable = Math.min(maxPacketSize, rightHand.length);
            const packetSize = minPacketSize + (randomBytes[byteIndex++] % (maxAvailable - minPacketSize + 1));
            const packet = rightHand.slice(0, packetSize);
            leftHand.unshift(...packet.reverse());
            rightHand.splice(0, packetSize);
            logBuffer.push({
                type: "drop",
                sequence: i + 1,
                dropNum: dropCount + 1,
                size: packetSize,
                obfuscated: hiddenIndices.has(dropCount)
                    ? `Dropped [hidden] cards`
                    : `Dropped ${obfuscateDropSize(packetSize)}`
            });
            if (hiddenIndices.has(dropCount)) {
                logBuffer[logBuffer.length - 1].commit = await computeCommitment(deckId, `_hiddenDrop${i}_${dropCount}`, packetSize);
            }
            dropCount++;
            totalDrops++;
        }

        result.splice(0, result.length, ...leftHand, ...rightHand);

        // Cut (3.85%–98.08%)
        const minCutSize = Math.max(2, Math.ceil(N * 0.0385));
        const maxCutSize = Math.floor(N * 0.9808);
        const cutSize = minCutSize + (randomBytes[byteIndex++] % (maxCutSize - minCutSize + 1));
        const topPacket = result.slice(0, cutSize);
        const bottomPacket = result.slice(cutSize);
        result.splice(0, result.length, ...bottomPacket, ...topPacket);
        logBuffer.push({
            type: "cut",
            sequence: i + 1,
            size: cutSize,
            obfuscated: `Moved ${obfuscateCutSize(cutSize, N)} to bottom`
        });
        totalCuts++;
    }

    // Validate result
    if (result.length !== N || result.includes(undefined)) {
        logMessage(`Error: MOSS invalid for ${deckId} - Length: ${result.length}, Undefined: ${array.includes(undefined)}`);
        return [...array];
    }
    const cardSet = new Set(result);
    if (cardSet.size !== N) {
        logMessage(`Error: MOSS produced duplicates for ${deckId}`);
        return [...array];
    }

    // Compute KL score and quality
    const klScore = computeKLScore(before, result);
    const { label, color } = getQualityLabel(klScore);

    // Log summary
    logMessage(`MOSS for ${deckId}: Performed ${numSequences} sequences with ${totalDrops} drops and ${totalCuts} cuts, KL Score: ${klScore.toFixed(3)} (<span class="bold" style="color: ${color}">${label}</span>)`);
    logMessage(`Top 5 cards: ${result.slice(0, Math.min(5, N)).join(", ")}`);

    // Flush detailed logs
    logBuffer.forEach(entry => {
        let message = `[Seq ${entry.sequence || 0}] ${entry.obfuscated}`;
        if (entry.commit) {
            message += ` (Commit: ${entry.commit.substring(0, 8)}...)`;
        }
        logMessage(message);
    });

    return result;
}

// Example usage (Node.js)
if (typeof window === 'undefined') {
    (async () => {
        const deck = createDeck(52);
        console.log('Initial deck:', deck.slice(0, 5), '...');
        const result = await MOSS(deck, 'test-deck');
        console.log('Shuffled deck:', result.slice(0, 5), '...');
    })();
}