// Utility functions for formatting numbers with proper units

export function formatCurrency(value: number, decimals: number = 2): string {
  if (value === 0) return '$0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1000000000) {
    return `${sign}$${(absValue / 1000000000).toFixed(decimals)}B`;
  } else if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(decimals)}M`;
  } else if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(decimals)}K`;
  } else {
    return `${sign}$${absValue.toFixed(decimals)}`;
  }
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1000000000) {
    return `${sign}${(absValue / 1000000000).toFixed(decimals)}B`;
  } else if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(decimals)}M`;
  } else if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(decimals)}K`;
  } else {
    return `${sign}${absValue.toFixed(decimals)}`;
  }
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatROI(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}
