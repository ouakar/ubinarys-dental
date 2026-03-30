const currencyList = [
  'MAD',
];

exports.checkCurrency = (code) => {
  return currencyList.includes(code.toUpperCase());
};
