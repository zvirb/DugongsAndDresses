// Max value of a 32-bit unsigned integer
const MAX_UINT32 = 0xFFFFFFFF;

export function secureRoll(sides: number): number {
    // Safety check: A die must have at least 1 side.
    if (sides < 1) return 1;

    // Rejection sampling to avoid modulo bias
    // We discard values that would bias the result towards smaller numbers
    const range = MAX_UINT32 + 1;
    const remainder = range % sides;
    const limit = MAX_UINT32 - remainder;

    const array = new Uint32Array(1);
    let random: number;

    // Use Web Crypto API which is available in modern browsers and Node.js (via globalThis)
    const crypto = typeof window !== 'undefined' ? window.crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);

    if (crypto && crypto.getRandomValues) {
        do {
            crypto.getRandomValues(array);
            random = array[0];
        } while (random > limit);
    } else {
        // Fallback for environments without global crypto (should be rare in modern environments)
        // Try to use node:crypto if available via require (in a try-catch to avoid build errors in client)
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodeCrypto = require('crypto');
            do {
                const buf = nodeCrypto.randomBytes(4);
                random = buf.readUInt32LE(0);
            } while (random > limit);
        } catch (e) {
            console.warn("[Dice] Secure RNG unavailable. Using Math.random fallback.");
            do {
                random = Math.floor(Math.random() * (MAX_UINT32 + 1));
            } while (random > limit);
        }
    }

    return (random % sides) + 1;
}
