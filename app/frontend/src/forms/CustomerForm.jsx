import { Form, Input, Select } from 'antd';
import { validatePhoneNumber } from '@/utils/helpers';

import useLanguage from '@/locale/useLanguage';

export default function CustomerForm({ isUpdateForm = false }) {
  const translate = useLanguage();
  const validateEmptyString = (_, value) => {
    if (value && value.trim() === '') {
      return Promise.reject(new Error('Field cannot be empty'));
    }

    return Promise.resolve();
  };

  return (
    <>
      <Form.Item
        label={translate('Patient Full Name')}
        name="name"
        rules={[
          {
            validator: validateEmptyString,
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="phone"
        label={translate('Phone')}
        rules={[
          {
            validator: validateEmptyString,
          },
          {
            pattern: validatePhoneNumber,
            message: 'Please enter a valid phone number',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label={translate('email')}
        rules={[
          {
            type: 'email',
          },
          {
            validator: validateEmptyString,
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="address" label={translate('Address')}>
        <Input.TextArea rows={2} />
      </Form.Item>

      <Form.Item
        name="preferredLanguage"
        label={translate('Preferred Language')}
        initialValue="FR"
      >
        <Select options={[ { value: 'FR', label: 'French (FR)' }, { value: 'AR', label: 'Arabic (AR)' } ]} />
      </Form.Item>

      <Form.Item name="medicalHistory" label={translate('Medical History')}>
        <Input.TextArea rows={2} />
      </Form.Item>

      <Form.Item name="allergies" label={translate('Allergies')}>
        <Input.TextArea rows={2} />
      </Form.Item>

      <Form.Item name="ongoingConditions" label={translate('Ongoing Conditions')}>
        <Input.TextArea rows={2} />
      </Form.Item>

      <Form.Item name="clinicalNotes" label={translate('Clinical Remarks')}>
        <Input.TextArea rows={3} />
      </Form.Item>
    </>
  );
}
