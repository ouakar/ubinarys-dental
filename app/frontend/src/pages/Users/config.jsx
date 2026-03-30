export const fields = {
  name: {
    title: 'Nom complet',
    required: true,
  },
  email: {
    title: 'Email',
    type: 'email',
    required: true,
  },
  role: {
    title: 'Rôle',
    type: 'select',
    options: [
      { value: 'admin', label: 'Administrateur' },
      { value: 'dentist', label: 'Dentiste' },
      { value: 'reception', label: 'Réception' },
      { value: 'assistant', label: 'Assistant' },
    ],
    required: true,
  },
  enabled: {
    title: 'Actif',
    type: 'boolean',
  },
  password: {
    title: 'Mot de passe',
    type: 'password',
    disableForTable: true,
  },
};
