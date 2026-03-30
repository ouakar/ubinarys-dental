import React from 'react';
import { Form, Input, Select, DatePicker, Row, Col } from 'antd';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import SelectAsync from '@/components/SelectAsync';
import useLanguage from '@/locale/useLanguage';

export default function AppointmentForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  return (
    <Row gutter={[12, 0]}>
      <Col className="gutter-row" span={24}>
        <Form.Item
          name="patient"
          label={translate('Patient')}
        >
          <AutoCompleteAsync
            entity={'client'}
            displayLabels={['name']}
            searchFields={'name'}
            redirectLabel={'Add New Patient'}
            withRedirect
            urlToRedirect={'/customer'}
          />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={24}>
        <Form.Item
          name="dentist"
          label={translate('Dentist')}
        >
          <SelectAsync
            entity={'admin'}
            displayLabels={['name', 'surname']}
            outputValue={'_id'}
          />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={12}>
        <Form.Item
          name="startTime"
          label={translate('Start Time')}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={12}>
        <Form.Item
          name="endTime"
          label={translate('End Time')}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={12}>
        <Form.Item
          name="status"
          label={translate('status')}
          initialValue="booked"
        >
          <Select
            options={[
              { value: 'booked', label: translate('booked') },
              { value: 'confirmed', label: translate('confirmed') },
              { value: 'in-chair', label: translate('in-chair') },
              { value: 'done', label: translate('done') },
              { value: 'no-show', label: translate('no-show') },
            ]}
          />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={12}>
        <Form.Item
          name="treatment"
          label={translate('Traitement')}
        >
          <SelectAsync
            entity={'treatment'}
            displayLabels={['name']}
            outputValue={'_id'}
          />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={12}>
        <Form.Item
          name="chairRoom"
          label={translate('Room/Chair')}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={24}>
        <Form.Item
          name="reason"
          label={translate('Reason')}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={24}>
        <Form.Item
          name="notes"
          label={translate('Notes')}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
      </Col>
    </Row>
  );
}
