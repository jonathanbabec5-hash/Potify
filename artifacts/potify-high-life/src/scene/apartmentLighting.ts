/** The window light follows the game clock, measured in minutes after midnight. */
export function apartmentDaylight(minute: number): number {
  return Math.max(0, Math.sin((minute - 360) * Math.PI / 720)) * 0.36;
}
