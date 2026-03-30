import { Button, Form, message, Upload } from 'antd';

import { UploadOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';
import { useSelector } from 'react-redux';
import { selectCompanySettings } from '@/redux/settings/selectors';
import { FILE_BASE_URL } from '@/config/serverApiConfig';

const BrandingPreview = ({ logo, name, mode }) => {
  const translate = useLanguage();
  const displayLogo = mode === 'logo' || mode === 'both';
  const displayName = mode === 'name' || mode === 'both';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        border: '1px dashed #d9d9d9',
        borderRadius: '8px',
        background: '#fafafa',
        minHeight: '60px',
      }}
    >
      {displayLogo && logo ? (
        <img
          src={FILE_BASE_URL + logo}
          alt="Clinic Logo"
          style={{ maxHeight: '40px', maxWidth: '200px', objectFit: 'contain' }}
        />
      ) : displayLogo ? (
        <div style={{ color: '#bfbfbf', fontStyle: 'italic' }}>
          {translate('No logo uploaded')}
        </div>
      ) : null}

      {displayName && (
        <span style={{ fontSize: '18px', fontWeight: '600' }}>{name || translate('Clinic')}</span>
      )}
    </div>
  );
};

export default function AppSettingForm() {
  const translate = useLanguage();
  const { company_logo, company_name, company_branding_mode } =
    useSelector(selectCompanySettings) || {};

  const beforeUpload = (file) => {
    const acceptedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
    ];
    const isImage = acceptedTypes.includes(file.type);
    if (!isImage) {
      message.error(translate('File format not supported!'));
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(translate('Image must be smaller than 2MB!'));
    }
    return false;
  };
  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontWeight: '500' }}>{translate('Clinic Branding Output Preview (Client Facing)')}:</p>
        <BrandingPreview
          logo={company_logo}
          name={company_name}
          mode={company_branding_mode || 'name'}
        />
        <p style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>
          {translate('This is how your clinic name/logo will appear across the platform and on documents.')}
        </p>
      </div>

      <div
        style={{
          background: '#f0f5ff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #adc6ff',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontWeight: '600', color: '#1d39c4', marginBottom: '8px' }}>
          {translate('Clinic Logo (Optional)')}
        </p>
        <p style={{ marginBottom: '12px', fontSize: '14px' }}>
          {translate('You can upload a clinic logo, or simply use your clinic name without a logo.')}
        </p>

        <p style={{ fontWeight: '600', marginBottom: '4px' }}>{translate('Supported formats')}:</p>
        <p style={{ color: '#595959', marginBottom: '12px' }}>
          JPG, PNG, JPEG, WEBP, SVG, GIF, BMP
        </p>

        <p style={{ fontWeight: '600', marginBottom: '4px' }}>{translate('Maximum size')}:</p>
        <p style={{ color: '#595959', marginBottom: '12px' }}>2MB</p>

        <p style={{ fontWeight: '600', marginBottom: '4px' }}>{translate('Recommended dimensions')}:</p>
        <p style={{ color: '#595959', marginBottom: '12px' }}>
          400–600 {translate('px width')}, 100–150 {translate('px height')}
        </p>

        <p style={{ fontWeight: '600', marginBottom: '4px' }}>{translate('Best result')}:</p>
        <p style={{ color: '#595959', marginBottom: '12px' }}>
          {translate('Use a horizontal logo. PNG with transparent background is recommended.')}
        </p>

        <div
          style={{
            fontSize: '12px',
            color: '#d4380d',
            background: '#fff2e8',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ffbb96',
          }}
        >
          <strong>{translate('Note')}:</strong>{' '}
          {translate(
            'If your logo is light-colored, make sure it has enough contrast to remain visible on light backgrounds.'
          )}
        </div>
      </div>

      <Form.Item
        name="file"
        label={translate('New Logo')}
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
      >
        <Upload
          beforeUpload={beforeUpload}
          listType="picture"
          accept="image/*"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
            {translate('Click to Upload')}
          </Button>
        </Upload>
      </Form.Item>
    </>
  );
}
