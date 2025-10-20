export const formatCurrency = (n: number) =>
  n.toLocaleString('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  });
