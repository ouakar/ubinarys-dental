import React from 'react';
import { Form, Input, InputNumber, Select, Row, Col } from 'antd';
import useLanguage from '@/locale/useLanguage';

export default function TreatmentForm() {
  const translate = useLanguage();

  return (
    <Row gutter={[12, 0]}>
      <Col className="gutter-row" span={12}>
        <Form.Item
          name="name"
          label={translate('Treatment Name')}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={12}>
        <Form.Item
          name="code"
          label={translate('Code')}
          rules={[{ required: true }]}
        >
          <Input placeholder="e.g. CONSULT-01" />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={12}>
        <Form.Item
          name="category"
          label={translate('Category')}
          initialValue="Soins"
        >
          <Select
            options={[
              { value: 'Consultation', label: translate('Consultation') },
              { value: 'Hygiène', label: translate('Hygiène') },
              { value: 'Chirurgie', label: translate('Chirurgie') },
              { value: 'Soins', label: translate('Soins') },
              { value: 'Prothèse', label: translate('Prothèse') },
              { value: 'Implantologie', label: translate('Implantologie') },
              { value: 'Esthétique', label: translate('Esthétique') },
              { value: 'Orthodontie', label: translate('Orthodontie') },
              { value: 'Radiologie', label: translate('Radiologie') },
              { value: 'Endodontie', label: translate('Endodontie') },
            ]}
          />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={6}>
        <Form.Item
          name="price"
          label={translate('Price (MAD)')}
          rules={[{ required: true }]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={0} 
            addonAfter="MAD"
          />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={6}>
        <Form.Item
          name="duration"
          label={translate('Duration (min)')}
          initialValue={30}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={0} 
            addonAfter="min"
          />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={24}>
        <Form.Item
          name="description"
          label={translate('Description')}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Col>
    </Row>
  );
}
