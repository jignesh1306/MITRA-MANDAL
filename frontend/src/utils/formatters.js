/**
 * Formats integer paise or rupees to Indian currency string (e.g. ₹50,000)
 */
export const formatCurrency = (paiseOrRupees, isAlreadyRupees = false) => {
  if (paiseOrRupees === undefined || paiseOrRupees === null || isNaN(paiseOrRupees)) return '₹0';
  const rupees = isAlreadyRupees ? paiseOrRupees : paiseOrRupees / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rupees);
};

/**
 * Formats JS Date to Indian format DD/MM/YYYY
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
