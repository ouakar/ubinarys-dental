import currency from 'currency.js';

import { useSelector } from 'react-redux';
import storePersist from '@/redux/storePersist';

import { selectMoneyFormat } from '@/redux/settings/selectors';

const useMoney = () => {
  const money_format_settings = useSelector(selectMoneyFormat);

  const money_format_state = money_format_settings
    ? money_format_settings
    : storePersist.get('settings')?.money_format_settings;

  function currencyFormat({ amount }) {
    const safeAmount = Number(amount) || 0;
    return currency(safeAmount).dollars() > 0 || !money_format_state?.zero_format
      ? currency(safeAmount, {
          separator: money_format_state?.thousand_sep || ' ',
          decimal: money_format_state?.decimal_sep || ',',
          symbol: '',
          precision: money_format_state?.cent_precision || 2,
        }).format()
      : 0 +
          currency(safeAmount, {
            separator: money_format_state?.thousand_sep || ' ',
            decimal: money_format_state?.decimal_sep || ',',
            symbol: '',
            precision: money_format_state?.cent_precision || 2,
          }).format();
  }

  function moneyFormatter({ amount = 0, currency_code = 'MAD' }) {
    const safeAmount = Number(amount) || 0;
    const symbol = 'MAD';
    const position = money_format_state?.currency_position || 'after';
    return position === 'before'
      ? symbol + ' ' + currencyFormat({ amount: safeAmount, currency_code })
      : currencyFormat({ amount: safeAmount, currency_code }) + ' ' + symbol;
  }

  function amountFormatter({ amount = 0, currency_code = 'MAD' }) {
    const safeAmount = Number(amount) || 0;
    return currencyFormat({ amount: safeAmount, currency_code });
  }

  function moneyRowFormatter({ amount = 0, currency_code = 'MAD' }) {
    const safeAmount = Number(amount) || 0;
    const symbol = 'MAD';
    const position = money_format_state?.currency_position || 'after';
    
    return {
      props: {
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      },
      children: (
        <>
          {position === 'before'
            ? symbol + ' ' + currencyFormat({ amount: safeAmount, currency_code })
            : currencyFormat({ amount: safeAmount, currency_code }) + ' ' + symbol}
        </>
      ),
    };
  }

  return {
    moneyRowFormatter,
    moneyFormatter,
    amountFormatter,
    currency_symbol: money_format_state?.currency_symbol,
    currency_code: money_format_state?.currency_code,
    currency_position: money_format_state?.currency_position,
    decimal_sep: money_format_state?.decimal_sep,
    thousand_sep: money_format_state?.thousand_sep,
    cent_precision: money_format_state?.cent_precision,
    zero_format: money_format_state?.zero_format,
  };
};

export default useMoney;
