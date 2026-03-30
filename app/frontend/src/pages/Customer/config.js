const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

export const fields = {
  name: {
    type: 'string',
  },
  phone: {
    type: 'phone',
  },
  email: {
    type: 'email',
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
    type: 'string',
    disableForTable: true,
  },
  lastVisit: {
    type: 'custom',
    label: 'Dernière visite',
    render: (value) => formatDate(value),
  },
  nextAppointment: {
    type: 'custom',
    label: 'Prochain RDV',
    render: (value) => formatDate(value),
  },
};
