import React from 'react';
import { Tag } from 'antd';

const categoryColors = {
  Consultation: 'blue',
  Hygiène: 'cyan',
  Chirurgie: 'red',
  Soins: 'green',
  Prothèse: 'magenta',
  Implantologie: 'purple',
  Esthétique: 'gold',
  Orthodontie: 'geekblue',
  Radiologie: 'orange',
  Endodontie: 'volcano',
};

export const fields = [
  {
    title: 'Code',
    dataIndex: 'code',
  },
  {
    title: 'Nom du traitement',
    dataIndex: 'name',
  },
  {
    title: 'Catégorie',
    dataIndex: 'category',
    render: (category) => {
      const color = categoryColors[category] || 'default';
      return <Tag color={color}>{category}</Tag>;
    },
  },
  {
    title: 'Prix (MAD)',
    dataIndex: 'price',
    render: (value) =>
      value != null
        ? `${Number(value).toLocaleString('fr-MA')} MAD`
        : '0 MAD',
  },
  {
    title: 'Durée (min)',
    dataIndex: 'duration',
    render: (value) => (value ? `${value} min` : '—'),
  },
];
