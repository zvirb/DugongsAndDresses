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
    let random;

    do {
        window.crypto.getRandomValues(array);
        random = array[0];
    } while (random > limit);

    return (random % sides) + 1;
}
