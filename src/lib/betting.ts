export interface BetEntryInput {
  team: string;
  amount: number;
}

export interface ValidationResult {
  valid: boolean;
  deficit: number;
  deficitTeam: string | null;
}

export interface PayoutResult {
  team: string;
  amount: number;
  result: number;
}

export function computeValidation(entries: BetEntryInput[]): ValidationResult {
  const team1Entries = entries.filter((e) => e.team === "team1");
  const team2Entries = entries.filter((e) => e.team === "team2");

  if (team1Entries.length === 0 || team2Entries.length === 0) {
    return { valid: false, deficit: 0, deficitTeam: null };
  }

  const totalAmount1 = team1Entries.reduce((sum, e) => sum + e.amount, 0);
  const totalAmount2 = team2Entries.reduce((sum, e) => sum + e.amount, 0);

  if (totalAmount1 === totalAmount2) {
    return { valid: true, deficit: 0, deficitTeam: null };
  }

  const higherTeam = totalAmount1 > totalAmount2 ? "team1" : "team2";
  const lowerTeam = higherTeam === "team1" ? "team2" : "team1";
  const higherAmount = higherTeam === "team1" ? totalAmount1 : totalAmount2;
  const lowerAmount = higherTeam === "team1" ? totalAmount2 : totalAmount1;
  const higherCount = higherTeam === "team1" ? team1Entries.length : team2Entries.length;
  const lowerCount = higherTeam === "team1" ? team2Entries.length : team1Entries.length;

  const requiredAmount =
    higherCount > lowerCount
      ? (higherAmount / higherCount) * lowerCount
      : higherAmount;

  if (lowerAmount >= requiredAmount) {
    return { valid: true, deficit: 0, deficitTeam: null };
  }
  return {
    valid: false,
    deficit: requiredAmount - lowerAmount,
    deficitTeam: lowerTeam,
  };
}

export function computePayouts(
  entries: BetEntryInput[],
  winningTeam: string
): PayoutResult[] {
  const totalPool = entries.reduce((sum, e) => sum + e.amount, 0);
  const winningBets = entries
    .filter((e) => e.team === winningTeam)
    .reduce((sum, e) => sum + e.amount, 0);

  return entries.map((e) => {
    if (e.team === winningTeam) {
      const payout = (e.amount / winningBets) * totalPool;
      return { ...e, result: Math.round(payout - e.amount) };
    }
    return { ...e, result: -e.amount };
  });
}
