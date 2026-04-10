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
    label: 'Patient Information',
    dataIndex: 'name',
    disableForForm: true,
    render: (value, record) => {
      const email = record?.email;
      const phone = record?.phone;
      return (
        <div className="flex items-center gap-4 py-2">
          <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
            <AvatarFallback className="bg-slate-50 text-slate-700 font-semibold">{getInitials(value)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-medium text-slate-900">{value}</span>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              {phone && (
                <span className="flex items-center gap-1 truncate">
                  <PhoneOutlined className="text-[10px]" />
                  {phone}
                </span>
              )}
              {email && (
                <span className="flex items-center gap-1 truncate">
                  <MailOutlined className="text-[10px]" />
                  {email}
                </span>
              )}
            </div>
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
