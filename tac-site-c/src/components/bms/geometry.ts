// Shared building dimensions (used by the 3D twin and the project pictures).
export const FH = 3.2 // floor height (m)
/** Tower footprint (m) from the number of units per floor. */
export const footprint = (units: number) => ({ w: 16 + Math.min(units, 30) * 0.7, l: 14 + Math.min(units, 30) * 0.3 })
