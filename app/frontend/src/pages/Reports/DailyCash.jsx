import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Card, Row, Col, Typography, Tag, Space, Button } from 'antd';
import { EyeOutlined, RedoOutlined } from '@ant-design/icons';
import { request } from '@/request';
import { Link } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function DailyCash() {
  const translate = useLanguage();
  const [loading, setLoading] = useState(false);
  const [reportDate, setReportDate] = useState(dayjs());
  const [groupedData, setGroupedData] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);

  const fetchReport = async (date) => {
    setLoading(true);
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const res = await request.get({ entity: 'invoice/daily-cash?date=' + formattedDate });
      
      if (res.success) {
        setGroupedData(res.result.groupedByDentist || []);
        setUnpaidInvoices(res.result.unpaidInvoices || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(reportDate);
  }, [reportDate]);

  const onDateChange = (date) => {
    if (date) {
      setReportDate(date);
    }
  };

  const formatMAD = (val) => `${val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MAD`;

  const columnsGrouped = [
    {
      title: translate('Dentist'),
      dataIndex: 'dentistName',
      key: 'dentistName',
    },
    {
      title: translate('Appointments Invoiced'),
      dataIndex: 'invoicesCount',
      key: 'invoicesCount',
    },
    {
      title: translate('Total H.T'),
      dataIndex: 'totalHT',
      key: 'totalHT',
      render: (val) => formatMAD(val),
    },
    {
      title: translate('VAT'),
      dataIndex: 'totalVAT',
      key: 'totalVAT',
      render: (val) => formatMAD(val),
    },
    {
      title: translate('Total TTC'),
      dataIndex: 'totalTTC',
      key: 'totalTTC',
      render: (val) => <Text strong>{formatMAD(val)}</Text>,
    },
  ];

  const columnsUnpaid = [
    {
      title: translate('Invoice Number'),
      dataIndex: 'number',
      key: 'number',
      render: (text, record) => <Link to={`/invoice/read/${record._id}`}>{record.year}/{text}</Link>,
    },
    {
      title: translate('Patient'),
      dataIndex: ['client', 'name'],
      key: 'client',
    },
    {
      title: translate('Status'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => <Tag color="volcano">{translate(status)}</Tag>
    },
    {
      title: translate('Total TTC'),
      dataIndex: 'total',
      key: 'total',
      render: (val) => formatMAD(val),
    },
    {
      title: translate('Action'),
      key: 'action',
      render: (_, record) => (
        <Link to={`/invoice/read/${record._id}`}>
          <Button type="link" icon={<EyeOutlined />}>{translate('View')}</Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{translate('Daily Cash Report')}</Title>
        </Col>
        <Col>
          <Space>
            <DatePicker 
              value={reportDate} 
              onChange={onDateChange} 
              allowClear={false}
              format="YYYY-MM-DD"
            />
            <Button icon={<RedoOutlined />} onClick={() => fetchReport(reportDate)}>
              {translate('Refresh')}
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title={translate('Revenue by Dentist (Paid & Unpaid)')} bordered={false}>
            <Table 
              columns={columnsGrouped} 
              dataSource={groupedData} 
              rowKey="dentistName" 
              pagination={false}
              loading={loading}
              summary={pageData => {
                let totalTTC = 0;
                pageData.forEach(({ totalTTC: t }) => {
                  totalTTC += t;
                });
                return (
                  <Table.Summary.Row style={{ background: '#fafafa' }}>
                    <Table.Summary.Cell index={0} colSpan={4}><Text strong>{translate('Grand Total')}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Text strong>{formatMAD(totalTTC)}</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title={translate('Pending Unpaid Invoices')} bordered={false}>
            <Table 
              columns={columnsUnpaid} 
              dataSource={unpaidInvoices} 
              rowKey="_id" 
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
