export interface DiceResult {
  dice1: number;
  dice2: number;
  total: number;
}

export function roll2d6(): DiceResult {
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  return {
    dice1,
    dice2,
    total: dice1 + dice2,
  };
}
