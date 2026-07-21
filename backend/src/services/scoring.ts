import prisma from '../lib/prisma';

export interface ScoreBreakdown {
  repaymentReliability: {
    score: number;
    weight: number;
    raw: number;
    label: string;
    details: string;
  };
  contributionConsistency: {
    score: number;
    weight: number;
    raw: number;
    label: string;
    details: string;
  };
  membershipTenure: {
    score: number;
    weight: number;
    raw: number;
    label: string;
    details: string;
  };
  savingsDepth: {
    score: number;
    weight: number;
    raw: number;
    label: string;
    details: string;
  };
}

export interface ScoreResult {
  value: number;
  band: 'A' | 'B' | 'C' | 'D';
  label: string;
  breakdown: ScoreBreakdown;
  maxLoanMultiple: number;
  maxLoan: number;
  availableLoan: number;
  totalSavings: number;
  isThinFile: boolean;
}

function getBand(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function getLoanMultiple(band: 'A' | 'B' | 'C' | 'D'): number {
  switch (band) {
    case 'A': return 3;
    case 'B': return 2;
    case 'C': return 1;
    case 'D': return 0;
  }
}

function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

export async function computeScore(memberId: string): Promise<ScoreResult> {
  const now = new Date();

  // Fetch all member data
  const member = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    include: {
      contributions: { orderBy: { paidAt: 'asc' } },
      loans: {
        include: { repayments: true },
        where: { status: { not: 'requested' } }, // only loans with a decision
      },
      cooperative: true,
    },
  });

  // --- Membership Tenure ---
  const activeMonths = monthsBetween(new Date(member.joinDate), now);
  const tenureRaw = Math.min(activeMonths, 24) / 24;

  // --- Savings Depth ---
  const totalSavings = member.contributions.reduce((sum, c) => sum + c.amount, 0);
  const SAVINGS_BENCHMARK = 50000; // ₦50,000 = full score
  const savingsRaw = Math.min(totalSavings / SAVINGS_BENCHMARK, 1.0);

  // --- Contribution Consistency ---
  const expectedContributions = Math.max(1, activeMonths); // 1 per month
  const actualContributions = member.contributions.length;
  const consistencyRaw = Math.min(actualContributions / expectedContributions, 1.0);

  // --- Repayment Reliability (thin-file detection) ---
  const allRepayments = member.loans.flatMap((l) => l.repayments);
  const repaidRepayments = allRepayments.filter(
    (r) => r.status === 'paid' && r.paidAt !== null
  );
  const onTimeRepayments = repaidRepayments.filter((r) => {
    if (!r.dueDate || !r.paidAt) return false;
    return new Date(r.paidAt) <= new Date(r.dueDate);
  });

  const isThinFile = allRepayments.length === 0;

  let totalScore: number;
  let breakdown: ScoreBreakdown;

  if (isThinFile) {
    // Thin-file: redistribute weights — no repayment factor
    const consistencyScore = consistencyRaw * 50;
    const tenureScore = tenureRaw * 25;
    const savingsScore = savingsRaw * 25;
    totalScore = Math.round(consistencyScore + tenureScore + savingsScore);

    breakdown = {
      repaymentReliability: {
        score: 0,
        weight: 0,
        raw: 0,
        label: 'Repayment Reliability',
        details: 'No loan history yet',
      },
      contributionConsistency: {
        score: Math.round(consistencyScore),
        weight: 50,
        raw: Math.round(consistencyRaw * 100),
        label: 'Contribution Consistency',
        details: `${actualContributions} of ${expectedContributions} expected contributions`,
      },
      membershipTenure: {
        score: Math.round(tenureScore),
        weight: 25,
        raw: activeMonths,
        label: 'Membership Tenure',
        details: `${activeMonths} months active (24 = full score)`,
      },
      savingsDepth: {
        score: Math.round(savingsScore),
        weight: 25,
        raw: Math.round(savingsRaw * 100),
        label: 'Savings Depth',
        details: `₦${totalSavings.toLocaleString()} saved (₦${SAVINGS_BENCHMARK.toLocaleString()} = full score)`,
      },
    };
  } else {
    // Full scoring with repayment history
    const repaymentRaw =
      allRepayments.length > 0 ? onTimeRepayments.length / allRepayments.length : 0;

    const repaymentScore = repaymentRaw * 40;
    const consistencyScore = consistencyRaw * 30;
    const tenureScore = tenureRaw * 15;
    const savingsScore = savingsRaw * 15;
    totalScore = Math.round(repaymentScore + consistencyScore + tenureScore + savingsScore);

    breakdown = {
      repaymentReliability: {
        score: Math.round(repaymentScore),
        weight: 40,
        raw: Math.round(repaymentRaw * 100),
        label: 'Repayment Reliability',
        details: `${onTimeRepayments.length} of ${allRepayments.length} repayments on time`,
      },
      contributionConsistency: {
        score: Math.round(consistencyScore),
        weight: 30,
        raw: Math.round(consistencyRaw * 100),
        label: 'Contribution Consistency',
        details: `${actualContributions} of ${expectedContributions} expected contributions`,
      },
      membershipTenure: {
        score: Math.round(tenureScore),
        weight: 15,
        raw: activeMonths,
        label: 'Membership Tenure',
        details: `${activeMonths} months active (24 = full score)`,
      },
      savingsDepth: {
        score: Math.round(savingsScore),
        weight: 15,
        raw: Math.round(savingsRaw * 100),
        label: 'Savings Depth',
        details: `₦${totalSavings.toLocaleString()} saved (₦${SAVINGS_BENCHMARK.toLocaleString()} = full score)`,
      },
    };
  }

  const band = getBand(totalScore);
  const maxLoanMultiple = getLoanMultiple(band);
  const maxLoan = maxLoanMultiple * totalSavings;

  // Outstanding loan balance
  const activeLoans = await prisma.loan.findMany({
    where: {
      memberId,
      status: { in: ['approved', 'disbursed', 'repaying'] },
    },
    include: { repayments: true },
  });

  const outstandingBalance = activeLoans.reduce((sum, loan) => {
    const repaid = loan.repayments
      .filter((r) => r.status === 'paid')
      .reduce((s, r) => s + r.amount, 0);
    return sum + (loan.principal - repaid);
  }, 0);

  const availableLoan = Math.max(0, maxLoan - outstandingBalance);

  const label = isThinFile ? 'Provisional — building history' : '';

  // Persist score
  await prisma.score.create({
    data: {
      memberId,
      value: totalScore,
      band,
      breakdownJson: JSON.stringify(breakdown),
      label,
    },
  });

  return {
    value: totalScore,
    band,
    label,
    breakdown,
    maxLoanMultiple,
    maxLoan,
    availableLoan,
    totalSavings,
    isThinFile,
  };
}

export async function getLatestScore(memberId: string) {
  return prisma.score.findFirst({
    where: { memberId },
    orderBy: { computedAt: 'desc' },
  });
}

export async function getMemberScoreHistory(memberId: string) {
  return prisma.score.findMany({
    where: { memberId },
    orderBy: { computedAt: 'desc' },
    take: 20,
  });
}
