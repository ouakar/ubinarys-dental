import translationDict from './translation/translation';

const getLabel = (key) => {
  try {
    const activeLang = window.localStorage.getItem('app_lang') || 'fr_fr';
    const lang = translationDict[activeLang] || translationDict['fr_fr'];
    
    // First try exact match (useful for specific casing like 'Complete & Bill')
    if (lang[key]) return lang[key];

    const lowerCaseKey = key
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/ /g, '_');

    if (lang[lowerCaseKey]) return lang[lowerCaseKey];

    // Fallback: Title case formatting
    const remove_underscore_fromKey = key.replace(/_/g, ' ').split(' ');
    const conversionOfAllFirstCharacterofEachWord = remove_underscore_fromKey.map(
      (word) => word[0].toUpperCase() + word.substring(1)
    );

    const label = conversionOfAllFirstCharacterofEachWord.join(' ');
    return label;
  } catch (error) {
    return 'No translate';
  }
};

const useLanguage = () => {
  const translate = (value) => getLabel(value);
  return translate;
};

export default useLanguage;
