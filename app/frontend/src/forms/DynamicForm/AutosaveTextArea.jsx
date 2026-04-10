import React, { useState, useEffect, useRef } from 'react';
import { Input, Typography, Space } from 'antd';
import { request } from '@/request';
import { useParams } from 'react-router-dom';
import storePersist from '@/redux/storePersist';

const { Text } = Typography;
const { TextArea } = Input;

export default function AutosaveTextArea({ value, onChange, entity, fieldName }) {
  const { id } = useParams();
  const [status, setStatus] = useState('');
  const [hasRestored, setHasRestored] = useState(false);
  const timeoutRef = useRef(null);
  
  // Obtain current admin context for per-user draft isolation
  const auth = storePersist.get('auth');
  const adminId = auth?.current?._id;

  const isUpdate = !!id;
  const draftPropName = 'draft' + fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

  useEffect(() => {
    if (isUpdate && adminId) {
      request.read({ entity, id }).then(res => {
         if (res && res.result) {
            const draftRoot = res.result[draftPropName] || {};
            const draftVal = draftRoot[adminId];
            const actualVal = res.result[fieldName];
            if (draftVal && draftVal !== actualVal) {
                onChange(draftVal);
                setHasRestored(true);
            }
         }
      });
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [id, entity, fieldName, adminId]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    if (isUpdate && adminId) {
      setStatus('Saving...');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          const payload = {};
          // Dot notation natively updates mapping without overwriting other users' drafts
          payload[`${draftPropName}.${adminId}`] = val; 

          const res = await request.update({ 
            entity, 
            id, 
            jsonData: payload 
          });

          if (res.success) {
            setStatus('Saved');
            setTimeout(() => setStatus(''), 3000);
          } else {
            setStatus('Failed');
          }
        } catch (error) {
          setStatus('Failed');
        }
      }, 1500);
    }
  };

  return (
    <div>
      <TextArea 
        value={value} 
        onChange={handleChange} 
        rows={6} 
      />
      {isUpdate && (status || hasRestored) && (
        <Space style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div>
            {hasRestored && (
              <Text type="warning" style={{ fontSize: '12px' }}>
                ⚠️ Draft restored
              </Text>
            )}
          </div>
          <Text type={status === 'Failed' ? 'danger' : 'secondary'} style={{ fontSize: '12px' }}>
            {status}
          </Text>
        </Space>
      )}
    </div>
  );
}
