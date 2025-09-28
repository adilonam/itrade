/**
 * Investment calculation utilities
 */

export interface InvestmentCalculation {
  monthlyReturn: number;
  totalReturn: number;
  totalAmount: number;
  effectiveAnnualRate: number;
}

export interface InvestmentProjection {
  month: number;
  monthlyReturn: number;
  cumulativeReturn: number;
  totalAmount: number;
}

/**
 * Calculate investment returns based on amount, annual rate, and duration
 */
export function calculateInvestmentReturns(
  amount: number,
  annualRate: number,
  durationMonths: number
): InvestmentCalculation {
  const annualReturn = (amount * annualRate) / 100;
  const monthlyReturn = annualReturn / 12;
  const totalReturn = monthlyReturn * durationMonths;
  const totalAmount = amount + totalReturn;

  // Calculate effective annual rate considering compounding if applicable
  const effectiveAnnualRate = annualRate;

  return {
    monthlyReturn,
    totalReturn,
    totalAmount,
    effectiveAnnualRate
  };
}

/**
 * Calculate compound interest returns (for reinvestment scenarios)
 */
export function calculateCompoundReturns(
  principal: number,
  annualRate: number,
  durationMonths: number,
  compoundingFrequency: number = 12 // monthly compounding by default
): InvestmentCalculation {
  const rate = annualRate / 100;
  const periodsPerYear = compoundingFrequency;
  const years = durationMonths / 12;

  const totalAmount =
    principal * Math.pow(1 + rate / periodsPerYear, periodsPerYear * years);
  const totalReturn = totalAmount - principal;
  const monthlyReturn = totalReturn / durationMonths;

  const effectiveAnnualRate =
    (Math.pow(1 + rate / periodsPerYear, periodsPerYear) - 1) * 100;

  return {
    monthlyReturn,
    totalReturn,
    totalAmount,
    effectiveAnnualRate
  };
}

/**
 * Generate month-by-month investment projections
 */
export function generateInvestmentProjection(
  amount: number,
  annualRate: number,
  durationMonths: number,
  isCompound: boolean = false
): InvestmentProjection[] {
  const projections: InvestmentProjection[] = [];

  if (isCompound) {
    // Compound growth
    const monthlyRate = annualRate / 100 / 12;
    let currentAmount = amount;

    for (let month = 1; month <= durationMonths; month++) {
      const monthlyGain = currentAmount * monthlyRate;
      currentAmount += monthlyGain;

      projections.push({
        month,
        monthlyReturn: monthlyGain,
        cumulativeReturn: currentAmount - amount,
        totalAmount: currentAmount
      });
    }
  } else {
    // Simple interest
    const monthlyReturn = (amount * annualRate) / 100 / 12;

    for (let month = 1; month <= durationMonths; month++) {
      const cumulativeReturn = monthlyReturn * month;

      projections.push({
        month,
        monthlyReturn,
        cumulativeReturn,
        totalAmount: amount + cumulativeReturn
      });
    }
  }

  return projections;
}

/**
 * Calculate investment progress based on start and end dates
 */
export function calculateInvestmentProgress(
  startDate: Date,
  endDate: Date
): {
  progress: number;
  daysRemaining: number;
  daysTotal: number;
  daysElapsed: number;
} {
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const remaining = endDate.getTime() - now.getTime();

  const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  const daysRemaining = Math.max(
    0,
    Math.ceil(remaining / (1000 * 60 * 60 * 24))
  );
  const daysTotal = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.ceil(elapsed / (1000 * 60 * 60 * 24)));

  return {
    progress,
    daysRemaining,
    daysTotal,
    daysElapsed
  };
}

/**
 * Validate investment amount against constraints
 */
export function validateInvestmentAmount(
  amount: number,
  minInvestment: number,
  maxInvestment?: number | null,
  userBalance?: number,
  availableCapacity?: number | null
): string[] {
  const errors: string[] = [];

  if (amount < minInvestment) {
    errors.push(`Minimum investment is ${formatCurrency(minInvestment)}`);
  }

  if (maxInvestment && amount > maxInvestment) {
    errors.push(`Maximum investment is ${formatCurrency(maxInvestment)}`);
  }

  if (userBalance !== undefined && amount > userBalance) {
    errors.push('Insufficient balance');
  }

  if (availableCapacity && amount > availableCapacity) {
    errors.push('Amount exceeds available capacity');
  }

  return errors;
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate investment maturity date
 */
export function calculateMaturityDate(
  startDate: Date,
  durationMonths: number
): Date {
  const maturityDate = new Date(startDate);
  maturityDate.setMonth(maturityDate.getMonth() + durationMonths);
  return maturityDate;
}

/**
 * Get risk level color and styling
 */
export function getRiskLevelStyle(riskLevel: string): {
  color: string;
  bgColor: string;
  textColor: string;
} {
  switch (riskLevel) {
    case 'LOW':
      return {
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900',
        textColor: 'text-green-800 dark:text-green-300'
      };
    case 'HIGH':
      return {
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900',
        textColor: 'text-red-800 dark:text-red-300'
      };
    default: // MEDIUM
      return {
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
        textColor: 'text-yellow-800 dark:text-yellow-300'
      };
  }
}

/**
 * Calculate investment capacity usage
 */
export function calculateCapacityUsage(
  currentCapacity: number,
  totalCapacity?: number | null
): {
  percentage: number;
  remaining: number | null;
  isUnlimited: boolean;
} {
  if (!totalCapacity) {
    return {
      percentage: 0,
      remaining: null,
      isUnlimited: true
    };
  }

  const percentage = Math.min(100, (currentCapacity / totalCapacity) * 100);
  const remaining = Math.max(0, totalCapacity - currentCapacity);

  return {
    percentage,
    remaining,
    isUnlimited: false
  };
}
