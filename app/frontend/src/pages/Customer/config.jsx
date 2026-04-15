import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PhoneOutlined, MailOutlined } from '@ant-design/icons';

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'PT';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
};

export const fields = {
  identity: {
    type: 'custom',
    label: 'Informations du Patient',
    dataIndex: 'name',
    disableForForm: true,
    render: (value, record) => {
      const email = record?.email;
      const phone = record?.phone;
      const name = record?.name || value;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
          <Avatar 
            size={48} 
            className="border border-slate-200 shadow-sm"
            style={{ backgroundColor: '#f0f2f5', color: '#1d39c4', fontWeight: 'bold', flexShrink: 0 }}
          >
            {getInitials(name)}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '4px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827', display: 'block' }}>
              {name}
            </span>
            {phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#6b7280' }}>
                <PhoneOutlined style={{ fontSize: '13px' }} /> {phone}
              </span>
            )}
            {email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#6b7280' }}>
                <MailOutlined style={{ fontSize: '13px' }} /> {email}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  name: {
    type: 'string',
    disableForTable: true,
  },
  phone: {
    type: 'phone',
    disableForTable: true,
  },
  email: {
    type: 'email',
    disableForTable: true,
  },
  country: {
    type: 'country',
    disableForTable: true,
  },
  address: {
    type: 'string',
    disableForTable: true,
  },
  preferredLanguage: {
    type: 'string',
    disableForTable: true,
  },
  medicalHistory: {
    type: 'string',
    disableForTable: true,
  },
  allergies: {
    type: 'string',
    disableForTable: true,
  },
  ongoingConditions: {
    type: 'string',
    disableForTable: true,
  },
  clinicalNotes: {
    type: 'autosave',
    entity: 'client',
    disableForTable: true,
  },
  lastVisit: {
    type: 'custom',
    label: 'Dernière visite',
    disableForForm: true,
    render: (value) => {
      const d = formatDate(value);
      return d !== '—' ? (
        <Badge variant="secondary" className="font-medium px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
          {d}
        </Badge>
      ) : <span className="text-slate-400">—</span>;
    },
  },
  nextAppointment: {
    type: 'custom',
    label: 'Prochain RDV',
    disableForForm: true,
    render: (value) => {
      const d = formatDate(value);
      return d !== '—' ? (
        <Badge variant="info" className="font-medium px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md">
          {d}
        </Badge>
      ) : <span className="text-slate-400">—</span>;
    },
  },
};
