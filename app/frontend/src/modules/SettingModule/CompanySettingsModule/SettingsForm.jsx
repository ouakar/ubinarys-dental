import { Form, Input, InputNumber, Select, Switch } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useSelector } from 'react-redux';

const formItems = [
  {
    settingKey: 'company_name',
    label: 'Clinic Name',
    valueType: 'string',
    required: true,
  },
  {
    settingKey: 'company_branding_mode',
    label: 'Branding Mode',
    valueType: 'select',
    options: [
      { value: 'name', label: 'Clinic Name Only' },
      { value: 'logo', label: 'Clinic Logo Only' },
      { value: 'both', label: 'Clinic Logo + Name' },
    ],
  },
  { settingKey: 'company_address', label: 'Clinic Address', valueType: 'string' },
  { settingKey: 'company_phone', label: 'Clinic Phone', valueType: 'string' },
  { settingKey: 'company_email', label: 'Clinic Email', valueType: 'string' },
  { settingKey: 'default_vat_rate', label: 'Default VAT Rate (%)', valueType: 'number', defaultValue: 0 },
  { settingKey: 'currency', label: 'Default Currency (e.g. MAD)', valueType: 'string', defaultValue: 'MAD' },
];

export default function SettingForm() {
  const translate = useLanguage();

  return (
    <div>
      {formItems.map((item) => {
        return (
          <Form.Item
            key={item.settingKey}
            label={item.label ? translate(item.label) : translate(item.settingKey)}
            name={item.settingKey}
            rules={[
              {
                required: item.required || false,
              },
            ]}
            valuePropName={item.valueType === 'boolean' ? 'checked' : 'value'}
          >
            {item.valueType === 'string' && <Input autoComplete="off" />}
            {item.valueType === 'number' && <InputNumber min={0} style={{ width: '100%' }} />}
            {item.valueType === 'boolean' && (
              <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
            )}
            {item.valueType === 'select' && (
              <Select
                options={item.options.map((option) => ({
                  ...option,
                  label: translate(option.label),
                }))}
                style={{ width: '100%' }}
              />
            )}
            {item.valueType === 'array' && (
              <Select
                mode="tags"
                style={{
                  width: '100%',
                }}
                tokenSeparators={[',']}
              />
            )}
          </Form.Item>
        );
      })}
    </div>
  );
}
