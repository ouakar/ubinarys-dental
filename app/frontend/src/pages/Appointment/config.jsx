import React from 'react';
import { Tag } from 'antd';
import CompleteAndBill from './CompleteAndBill';

const appointmentStatusLabels = {
  done: 'Terminé',
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  'no-show': 'Absent',
  'in-chair': 'En salle',
  booked: 'Réservé',
};

const statusColors = {
  done: 'success',
  pending: 'default',
  confirmed: 'processing',
  cancelled: 'error',
  'no-show': 'warning',
  'in-chair': 'blue',
  booked: 'cyan',
};

import dayjs from 'dayjs';

const formatDateTime = (value) => {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
};

export const fields = [
  {
    title: 'Patient',
    dataIndex: ['patient', 'name'],
    render: (text) => text || '—',
  },
  {
    title: 'Médecin',
    dataIndex: ['dentist', 'name'],
    render: (text) => text || '—',
  },
  {
    title: 'Date',
    dataIndex: 'startTime',
    render: (value) => formatDateTime(value),
  },
  {
    title: 'Fin',
    dataIndex: 'endTime',
    render: (value) => formatDateTime(value),
  },
  {
    title: 'Statut',
    dataIndex: 'status',
    render: (status) => (
      <Tag color={statusColors[status] || 'default'}>
        {appointmentStatusLabels[status] || status}
      </Tag>
    ),
  },
  {
    title: 'Traitement',
    dataIndex: ['treatment', 'name'],
    render: (text) => text || '—',
  },
  {
    title: 'Actions',
    dataIndex: '',
    render: (_, record) => {
      if (['done', 'in-chair', 'confirmed'].includes(record.status)) {
        return <CompleteAndBill record={record} />;
      }
      return null;
    },
  },
];
