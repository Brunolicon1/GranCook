export const formatCurrency = (val: string | number): string => {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatCurrencyParts = (val: string | number): string => {
  return Number(val).toFixed(2).replace('.', ',');
};
