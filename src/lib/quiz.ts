export type Option = { id: string; correct: boolean };

export function scoreAnswer(options: Option[], selectedOptionIds: string[]): boolean {
  const correct = new Set(options.filter((option) => option.correct).map((option) => option.id));
  const selected = new Set(selectedOptionIds);
  return correct.size === selected.size && [...correct].every((id) => selected.has(id));
}

export function scaledScore(rawCorrect: number, itemCount: number): number {
  return itemCount === 0 ? 0 : Math.round((rawCorrect / itemCount) * 1000);
}

export function shuffleOptions<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
