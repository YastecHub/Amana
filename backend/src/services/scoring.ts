import prisma from '../lib/prisma';

export interface ScoreBreakdown {
  repaymentReliability: { score: number; weight: number; raw: number; label: string };
  contributionConsistency: { score: number; weight: number; raw: number; label: string };
  membershipTenure: { score: number; weight: number; raw: number; label: string };
  savingsDepth: { score: number; weight: number; raw: number; label: string };
}

export interface ScoreResult {
  value: number;
  band: 'A' | 'B' | 'C' | 'D';
  label: string;
  breakdown: ScoreBreakdown;
  maxLoan: number;
  availableLoan: number;
  totalSavings: number;
  isThinFile: boolean;
}

export const calculateMemberScore = async (memberId: string): Promise<ScoreResult> => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      contributions: true,
      loans: { include: { repayments: true } },
      cooperative: true
    }
  });

  if (!member) throw new Error('Member not found');

  const now = new Date();
  const joinDate = new Date(member.joinDate);
  const monthsSinceJoin = Math.max(0, (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

  const contributions = member.contributions.filter(c => c.status === 'confirmed');
  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

  const loans = member.loans;
  const isThinFile = loans.length === 0;

  // Defaults and weights
  let weights = {
    repayment: 0.35,
    contribution: 0.35,
    tenure: 0.15,
    savings: 0.15
  };

  if (isThinFile) {
    weights = {
      repayment: 0,
      contribution: 0.50,
      tenure: 0.25,
      savings: 0.25
    };
  }

  // 1. Repayment Reliability
  let repaymentScore = 0;
  let repaymentRaw = 0;
  if (!isThinFile) {
    let totalRepayments = 0;
    let onTimeRepayments = 0;

    loans.forEach(loan => {
      loan.repayments.forEach(rep => {
        totalRepayments++;
        if (rep.status === 'paid' || rep.paidAt) {
          onTimeRepayments++; // Simplified: assuming paid is on time for now
        }
      });
    });

    if (totalRepayments > 0) {
      repaymentRaw = onTimeRepayments / totalRepayments;
      repaymentScore = repaymentRaw * 100 * weights.repayment;
    }
  }

  // 2. Contribution Consistency
  const expectedContributions = Math.max(1, Math.floor(monthsSinceJoin));
  let contributionRaw = Math.min(contributions.length / expectedContributions, 1.0);
  const contributionScore = contributionRaw * 100 * weights.contribution;

  // 3. Membership Tenure
  const tenureRaw = Math.min(monthsSinceJoin, 24) / 24;
  const tenureScore = tenureRaw * 100 * weights.tenure;

  // 4. Savings Depth
  const savingsRaw = Math.min(totalContributed / 50000, 1.0);
  const savingsScore = savingsRaw * 100 * weights.savings;

  const totalScoreValue = repaymentScore + contributionScore + tenureScore + savingsScore;

  let band: 'A' | 'B' | 'C' | 'D' = 'D';
  if (totalScoreValue >= 80) band = 'A';
  else if (totalScoreValue >= 60) band = 'B';
  else if (totalScoreValue >= 40) band = 'C';

  const maxLoanMultiple = band === 'A' ? 3 : band === 'B' ? 2 : band === 'C' ? 1 : 0;
  
  const outstandingLoanBalance = loans
    .filter(l => ['disbursed', 'repaying', 'defaulted'].includes(l.status))
    .reduce((sum, l) => {
      const paid = l.repayments.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
      return sum + (l.principal - paid); // Simplified: not accounting for interest
    }, 0);

  const availableLoan = Math.max(0, (maxLoanMultiple * totalContributed) - outstandingLoanBalance);

  const breakdown: ScoreBreakdown = {
    repaymentReliability: { score: repaymentScore, weight: weights.repayment, raw: repaymentRaw, label: 'Repayment Reliability' },
    contributionConsistency: { score: contributionScore, weight: weights.contribution, raw: contributionRaw, label: 'Contribution Consistency' },
    membershipTenure: { score: tenureScore, weight: weights.tenure, raw: tenureRaw, label: 'Membership Tenure' },
    savingsDepth: { score: savingsScore, weight: weights.savings, raw: savingsRaw, label: 'Savings Depth' },
  };

  const result: ScoreResult = {
    value: parseFloat(totalScoreValue.toFixed(2)),
    band,
    label: \`Band \${band} (\${totalScoreValue.toFixed(0)}/100)\`,
    breakdown,
    maxLoan: maxLoanMultiple * totalContributed,
    availableLoan,
    totalSavings: totalContributed,
    isThinFile
  };

  await prisma.score.create({
    data: {
      memberId: member.id,
      value: result.value,
      band: result.band,
      breakdownJson: JSON.stringify(result.breakdown),
      label: result.label
    }
  });

  return result;
};

export const getMemberScoreHistory = async (memberId: string) => {
  return prisma.score.findMany({
    where: { memberId },
    orderBy: { computedAt: 'desc' }
  });
};
