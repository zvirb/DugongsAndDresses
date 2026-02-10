export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function calcModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}
