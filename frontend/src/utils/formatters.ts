/**
 * Utility functions for formatting values
 */

/**
 * Format a number as USD currency
 * @param value Number to format
 * @param decimalPlaces Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | undefined | null, decimalPlaces = 0): string => {
  if (value === undefined || value === null) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
};

/**
 * Format a number as a percentage
 * @param value Number to format (as decimal, e.g. 0.05 for 5%)
 * @param decimalPlaces Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number | undefined | null, decimalPlaces = 2): string => {
  if (value === undefined || value === null) return '0%';
  
  // If value is already in percentage form (e.g. 5 instead of 0.05)
  // This handles different conventions in the codebase
  const multiplier = Math.abs(value) < 1 ? 100 : 1;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value / 100 * multiplier);
};

/**
 * Format a number with decimal places
 * @param value Number to format
 * @param decimalPlaces Number of decimal places (default: 2)
 * @returns Formatted decimal string
 */
export const formatDecimal = (value: number | undefined | null, decimalPlaces = 2): string => {
  if (value === undefined || value === null) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
};

/**
 * Format a date string or Date object
 * @param dateStr Date string or Date object
 * @param format Format style ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string | Date | undefined | null, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  if (!dateStr) return 'N/A';
  
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  let options: Intl.DateTimeFormatOptions;
  
  switch (format) {
    case 'short':
      options = { month: 'numeric', day: 'numeric', year: 'numeric' };
      break;
    case 'long':
      options = { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' };
      break;
    case 'medium':
    default:
      options = { month: 'short', day: 'numeric', year: 'numeric' };
      break;
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}; 