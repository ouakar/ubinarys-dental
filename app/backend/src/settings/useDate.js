const useDate = ({ settings }) => {
  const { ubinarys_app_date_format } = settings;

  const dateFormat = ubinarys_app_date_format;

  return {
    dateFormat,
  };
};

module.exports = useDate;
