const useAppSettings = () => {
  let settings = {};
  settings['ubinarys_app_email'] = 'noreply@ubinarysapp.com';
  settings['ubinarys_base_url'] = 'https://cloud.ubinarysapp.com';
  return settings;
};

module.exports = useAppSettings;
