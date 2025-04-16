# MOSS: Manu's Overhand Shuffle Simulator (Prototype 3)

A JavaScript implementation of the MOSS algorithm for simulating an overhand card shuffle, supporting arbitrary deck sizes with cryptographically secure randomness, randomized packet drops, and KL divergence scoring.

## Features
- Supports any deck size (≥2 cards), with a standard 52-card deck as default.
- Randomized packet drops (12.5–33.3% of right hand) with obfuscated logging and cryptographic commitments.
- Cryptographically secure randomness via Web Crypto API.
- KL divergence scoring to assess shuffle quality.
- Detailed logging of splits, drops, and cuts with obfuscation.
- Modular design for browser or Node.js environments.
- Includes a visual UI example inspired by Prototype 1.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/AVBpodcast/moss.git