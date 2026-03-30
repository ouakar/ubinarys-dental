import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Row, Col, Button, Statistic } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';

const { Title } = Typography;

export default function MonthlyOverview() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await request.get({ entity: 'invoice/monthly-overview' });
      if (res.success) {
        setData(res.result || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const columns = [
    {
      title: translate('Month'),
      dataIndex: 'monthName',
      key: 'monthName',
    },
    {
      title: translate('Dentist'),
      dataIndex: 'dentistName',
      key: 'dentistName',
    },
    {
      title: translate('Treated Appointments'),
      dataIndex: 'treatedAppointments',
      key: 'treatedAppointments',
      align: 'center',
    },
    {
      title: translate('Unpaid Invoices'),
      dataIndex: 'unpaidInvoices',
      key: 'unpaidInvoices',
      align: 'center',
    },
    {
      title: translate('Total Revenue TTC'),
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (val) => moneyFormatter({ amount: val }),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: '10px' }} />
            {translate('Monthly Financial Overview')}
          </Title>
        </Col>
        <Col>
          <Button type="primary" onClick={fetchOverview}>
            {translate('Refresh')}
          </Button>
        </Col>
      </Row>

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey={(record) => `${record.year}-${record.month}-${record.dentistName}`}
          pagination={false}
        />
      </Card>
    </div>
  );
}
