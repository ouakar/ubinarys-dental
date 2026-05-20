const currency = require('currency.js');

function numberToFrench(number) {
  if (number === 0) return 'zéro';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function convertGroup(n, isLastGroup) {
    let result = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    // Hundreds
    if (h > 0) {
      if (h === 1) {
        result += 'cent';
      } else {
        result += units[h] + ' cent';
        if (t === 0 && u === 0 && isLastGroup) {
          result += 's';
        }
      }
    }

    // Tens and Units
    const tu = n % 100;
    if (tu > 0) {
      if (result) result += ' ';
      if (tu < 10) {
        result += units[tu];
      } else if (tu < 20) {
        result += teens[tu - 10];
      } else {
        if (t === 7) {
          if (u === 1) {
            result += 'soixante et onze';
          } else {
            result += 'soixante-' + teens[u];
          }
        } else if (t === 9) {
          result += 'quatre-vingt-' + teens[u];
        } else {
          let tenStr = tens[t];
          if (t === 8 && u === 0) {
            if (isLastGroup) {
              tenStr += 's';
            }
          }
          result += tenStr;
          if (u > 0) {
            if (u === 1 && t !== 8) {
              result += ' et un';
            } else {
              result += '-' + units[u];
            }
          }
        }
      }
    }

    return result;
  }

  let parts = [];
  let n = Math.floor(number);

  const billion = Math.floor(n / 1000000000);
  n %= 1000000000;
  const million = Math.floor(n / 1000000);
  n %= 1000000;
  const thousand = Math.floor(n / 1000);
  const remainder = n % 1000;

  if (billion > 0) {
    parts.push(convertGroup(billion, million === 0 && thousand === 0 && remainder === 0) + (billion > 1 ? ' milliards' : ' milliard'));
  }
  if (million > 0) {
    parts.push(convertGroup(million, thousand === 0 && remainder === 0) + (million > 1 ? ' millions' : ' million'));
  }
  if (thousand > 0) {
    if (thousand === 1) {
      parts.push('mille');
    } else {
      parts.push(convertGroup(thousand, remainder === 0) + ' mille');
    }
  }
  if (remainder > 0 || parts.length === 0) {
    parts.push(convertGroup(remainder, true));
  }

  return parts.join(' ');
}

const currencyNames = {
  'MAD': { main: 'Dirham', mainPlural: 'Dirhams', sub: 'centime', subPlural: 'centimes' },
  'DH': { main: 'Dirham', mainPlural: 'Dirhams', sub: 'centime', subPlural: 'centimes' },
  'EUR': { main: 'Euro', mainPlural: 'Euros', sub: 'centime', subPlural: 'centimes' },
  '€': { main: 'Euro', mainPlural: 'Euros', sub: 'centime', subPlural: 'centimes' },
  'USD': { main: 'Dollar', mainPlural: 'Dollars', sub: 'cent', subPlural: 'cents' },
  '$': { main: 'Dollar', mainPlural: 'Dollars', sub: 'cent', subPlural: 'cents' }
};

function amountToFrenchWords(amount, currencyCode = 'MAD') {
  const cleanCode = (currencyCode || 'MAD').toUpperCase().trim();
  const names = currencyNames[cleanCode] || { main: cleanCode, mainPlural: cleanCode, sub: 'centime', subPlural: 'centimes' };

  const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;
  const integerPart = Math.floor(roundedAmount);
  const decimalPart = Math.round((roundedAmount - integerPart) * 100);

  let result = '';

  if (integerPart === 0) {
    result += 'zéro ' + names.main;
  } else if (integerPart === 1) {
    result += 'un ' + names.main;
  } else {
    result += numberToFrench(integerPart) + ' ' + names.mainPlural;
  }

  if (decimalPart > 0) {
    if (decimalPart === 1) {
      result += ' et un ' + names.sub;
    } else {
      result += ' et ' + numberToFrench(decimalPart) + ' ' + names.subPlural;
    }
  }

  // Capitalize the first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

module.exports = amountToFrenchWords;
