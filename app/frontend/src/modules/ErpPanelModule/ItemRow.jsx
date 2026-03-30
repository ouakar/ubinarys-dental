import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Row, Col } from 'antd';

import { DeleteOutlined } from '@ant-design/icons';
import { useMoney, useDate } from '@/settings';
import calculate from '@/utils/calculate';

export default function ItemRow({ field, remove, current = null, form = null }) {
  const [totalState, setTotal] = useState(0);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);

  const money = useMoney();
  const currencySymbol = money.currency_symbol || 'MAD';
  const updateQt = (value) => {
    setQuantity(Number(value) || 0);
  };
  const updatePrice = (value) => {
    setPrice(Number(value) || 0);
  };

  useEffect(() => {
    if (current) {
      // When it accesses the /payment/ endpoint,
      // it receives an invoice.item instead of just item
      // and breaks the code, but now we can check if items exists,
      // and if it doesn't we can access invoice.items.

      const { items, invoice } = current;

      if (invoice) {
        const item = invoice[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      } else {
        const item = items[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      }
    }
  }, [current]);

  useEffect(() => {
    const currentTotal = calculate.multiply(price, quantity);
    setTotal(currentTotal);
    if (form) {
      form.setFieldsValue({
        items: {
          [field.name]: {
            total: currentTotal,
          },
        },
      });
    }
  }, [price, quantity]);

  return (
    <Row gutter={[12, 12]} style={{ position: 'relative' }}>
      <Col className="gutter-row" span={5}>
        <Form.Item
          name={[field.name, 'itemName']}
          rules={[
            {
              required: true,
              message: 'Missing itemName name',
            },
            {
              pattern: /^(?!\s*$)[\s\S]+$/, // Regular expression to allow spaces, alphanumeric, and special characters, but not just spaces
              message: 'Item Name must contain alphanumeric or special characters',
            },
          ]}
        >
          <Input placeholder="Item Name" />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={7}>
        <Form.Item name={[field.name, 'description']}>
          <Input placeholder="description Name" />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={3}>
        <Form.Item name={[field.name, 'quantity']} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} onChange={updateQt} />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={4}>
        <Form.Item name={[field.name, 'price']} rules={[{ required: true }]}>
          <InputNumber
            className="moneyInput"
            onChange={updatePrice}
            min={0}
            controls={false}
            addonAfter={money.currency_position !== 'before' ? currencySymbol : undefined}
            addonBefore={money.currency_position === 'before' ? currencySymbol : undefined}
          />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={5}>
        <Form.Item name={[field.name, 'total']} initialValue={0}>
          <InputNumber
            readOnly
            className="moneyInput"
            value={totalState}
            min={0}
            controls={false}
            addonAfter={currencySymbol}
            formatter={(value) =>
              money.amountFormatter({ amount: totalState, currency_code: 'MAD' })
            }
          />
        </Form.Item>
      </Col>

      <div style={{ position: 'absolute', right: '-20px', top: ' 5px' }}>
        <DeleteOutlined onClick={() => remove(field.name)} />
      </div>
    </Row>
  );
}
