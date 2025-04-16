// Improved MOSS shuffle algorithm without final riffle shuffle
async function mossShuffle(deck) {
  let result = [...deck];
  const N = 52;
  const randomBytes = new Uint8Array(300); // Increased buffer size
  crypto.getRandomValues(randomBytes);
  let byteIndex = 0;
  
  // More sequences for better mixing
  const numSequences = 15 + (randomBytes[byteIndex++] % 10); // 15-24 sequences
  
  for (let i = 0; i < numSequences; i++) {
    // More variable split size
    const splitSize = 20 + (randomBytes[byteIndex++] % 32); // 20-51 cards
    
    let leftHand = result.slice(0, N - splitSize);
    let rightHand = result.slice(N - splitSize);
    const rightSize = rightHand.length;
    
    // Larger packet sizes with more variability
    const minPacketSize = Math.max(3, Math.floor(rightSize * 0.15));
    const maxPacketSize = Math.min(rightSize, Math.floor(rightSize * 0.4));
    
    while (rightHand.length > 0) {
      const remaining = rightHand.length;
      let packetSize;
      
      if (remaining < 8) {
        packetSize = remaining;
      } else {
        packetSize = minPacketSize + 
                   (randomBytes[byteIndex++] % (maxPacketSize - minPacketSize + 1));
        packetSize = Math.min(packetSize, remaining);
      }
      
      const packet = rightHand.slice(0, packetSize);
      const shouldReverse = randomBytes[byteIndex++] % 3 === 0; // 33% chance to reverse
      leftHand = shouldReverse 
        ? [...packet.reverse(), ...leftHand]
        : [...packet, ...leftHand];
      
      rightHand.splice(0, packetSize);
    }
    
    result = [...leftHand];
    
    // More varied cut sizes with occasional large cuts
    const cutSize = (randomBytes[byteIndex++] % 10 === 0)
      ? 10 + (randomBytes[byteIndex++] % 42) // 10-51 (10% chance)
      : 3 + (randomBytes[byteIndex++] % 20); // 3-22 (90% chance)
    
    result = [...result.slice(cutSize), ...result.slice(0, cutSize)];
    totalCuts++;
  }
  
  if (result.length !== 52 || new Set(result).size !== 52) {
    totalErrors++;
    logMessage("Error: Invalid shuffle output");
    return deck;
  }
  
  totalShuffles += numSequences;
  return result;
}