import { Button, Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title={'Ubinarys Dental'}
      subTitle={translate('Moroccan cloud dental management platform for modern dental clinics')}
      extra={
        <>
          <p>
            Contact Number : <a href="tel:+212660598211">+212 660-598211</a>{' '}
          </p>
          <p>
            Website : <a href="https://ubinarys.com">www.ubinarys.com</a>{' '}
          </p>
          <Button
            type="primary"
            onClick={() => {
              window.open(`https://ubinarys.com`);
            }}
          >
            {translate('Contact us')}
          </Button>
        </>
      }
    />
  );
};

export default About;
