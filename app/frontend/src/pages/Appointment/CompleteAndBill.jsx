import React, { useState, useEffect } from 'react';
import { Button, Modal, Select, InputNumber, Row, Col, Typography, message, Space, Divider } from 'antd';
import { FileAddOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { request } from '@/request';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import calculate from '@/utils/calculate';

const { Text } = Typography;

export default function CompleteAndBill({ record }) {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalVisible) {
      request.listAll({ entity: 'treatment' }).then(res => {
        if (res.success) setTreatmentsList(res.result);
      });
      // Start with one empty slot
      setItems([{ treatmentId: null, quantity: 1 }]);
    }
  }, [isModalVisible]);

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  const addItem = () => {
    setItems([...items, { treatmentId: null, quantity: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChangeTreatment = (value, index) => {
    const newItems = [...items];
    newItems[index].treatmentId = value;
    setItems(newItems);
  };

  const handleChangeQty = (value, index) => {
    const newItems = [...items];
    newItems[index].quantity = value;
    setItems(newItems);
  };

  let subTotalHT = 0;
  let vatTotal = 0;
  let totalTTC = 0;

  const validItems = items.filter(i => i.treatmentId);
  const payloadItems = validItems.map(item => {
    const treatment = treatmentsList.find(t => t._id === item.treatmentId);
    if (!treatment) return null;

    const qty = item.quantity || 1;
    const price = treatment.price || treatment.defaultPriceMAD || 0;
    const vatRate = treatment.defaultVAT || 0;

    const lineHT = calculate.multiply(qty, price);
    const lineVAT = calculate.multiply(lineHT, vatRate / 100);
    const lineTTC = calculate.add(lineHT, lineVAT);

    subTotalHT = calculate.add(subTotalHT, lineHT);
    vatTotal = calculate.add(vatTotal, lineVAT);
    totalTTC = calculate.add(totalTTC, lineTTC);

    return {
      name: treatment.name,
      description: treatment.description,
      quantity: qty,
      price: price,
      taxRate: vatRate
    };
  }).filter(Boolean);

  const formatMAD = (val) => `${val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MAD`;

  const handleSubmit = async () => {
    if (payloadItems.length === 0) {
      return message.error('Please select at least one treatment');
    }
    setLoading(true);

    try {
      const payload = {
        appointment: record._id,
        client: record.patient?._id,
        date: new Date(),
        expiredDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        year: new Date().getFullYear(),
        number: 0, // Auto-computed in backend via setting
        treatments: payloadItems
      };

      const res = await request.create({ entity: 'invoice/create-from-appointment', jsonData: payload });

      if (res.success) {
        message.success('Invoice created successfully!');
        setIsModalVisible(false);
        // Force navigate to invoice read page
        navigate(`/invoice/read/${res.result._id}`);
      } else {
        message.error(res.message || 'Error creating invoice');
      }
    } catch (err) {
      console.error(err);
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        type="primary" 
        icon={<FileAddOutlined />} 
        onClick={showModal}
        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
      >
        Complete & Bill
      </Button>

      <Modal
        title={translate('Complete Appointment & Generate Invoice')}
        open={isModalVisible}
        onCancel={handleCancel}
        width={700}
        footer={[
          <Button key="back" onClick={handleCancel}>
            {translate('Cancel')}
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            {translate('Generate Invoice')}
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{translate('Select treatments performed during this session:')}</Text>
          {items.map((item, index) => (
            <Row gutter={8} key={index} align="middle">
              <Col span={14}>
                <Select
                  style={{ width: '100%' }}
                  placeholder={translate('Select Treatment')}
                  value={item.treatmentId}
                  onChange={(val) => handleChangeTreatment(val, index)}
                  showSearch
                  optionFilterProp="children"
                >
                  {treatmentsList.map(t => (
                    <Select.Option key={t._id} value={t._id}>
                      {t.code ? `[${t.code}] ` : ''}{t.name} ({formatMAD(t.price || t.defaultPriceMAD || 0)})
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <InputNumber 
                  min={1} 
                  value={item.quantity} 
                  onChange={(val) => handleChangeQty(val, index)} 
                  addonBefore="Qty"
                  style={{ width: '100%' }} 
                />
              </Col>
              <Col span={4}>
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
              </Col>
            </Row>
          ))}
          <Button type="dashed" onClick={addItem} block icon={<PlusOutlined />}>
            {translate('Add another treatment')}
          </Button>
          
          <Divider />
          <Row justify="end">
            <Col span={10}>
              <Row>
                <Col span={12}><Text type="secondary">Subtotal (H.T):</Text></Col>
                <Col span={12} style={{ textAlign: 'right' }}><Text>{formatMAD(subTotalHT)}</Text></Col>
              </Row>
              <Row>
                <Col span={12}><Text type="secondary">VAT:</Text></Col>
                <Col span={12} style={{ textAlign: 'right' }}><Text>{formatMAD(vatTotal)}</Text></Col>
              </Row>
              <Row style={{ marginTop: '8px' }}>
                <Col span={12}><Text strong>Total TTC:</Text></Col>
                <Col span={12} style={{ textAlign: 'right' }}><Text strong>{formatMAD(totalTTC)}</Text></Col>
              </Row>
            </Col>
          </Row>
        </Space>
      </Modal>
    </>
  );
}
