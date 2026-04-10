import logo from '@/style/images/logo-with-text.png';
import useLanguage from '@/locale/useLanguage';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function SideContent() {
  const translate = useLanguage();

  return (
    <Content
      style={{
        padding: '150px 30px 30px',
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto',
      }}
      className="sideContent"
    >
      <div style={{ width: '100%' }}>
        <img
          src={logo}
          alt="Ubinarys"
          style={{ 
            margin: '0 0 40px', 
            display: 'block',
            maxHeight: '100px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />

        <Title level={1} style={{ fontSize: 24, color: '#13c2c2' }}>
          Ubinarys
        </Title>
        <Text>
          Ubinarys – Gestion de cabinet dentaire en cloud (Maroc)
        </Text>

        <div className="space20"></div>
      </div>
    </Content>
  );
}
