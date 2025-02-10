export const nodeResolution = 40;

export function calculateScaledFidelity(radius) {
    return Math.floor(Math.log10(radius + 2) * nodeResolution);
}