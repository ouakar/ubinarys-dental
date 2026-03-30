import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Dropdown, Menu, message, Typography, Card, Row, Col } from 'antd';
import { DownOutlined, MedicineBoxOutlined, ProfileOutlined, ReadOutlined, CheckCircleOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { request } from '@/request';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';

const { Title, Text } = Typography;

export default function ReceptionDashboard() {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await request.get({ entity: 'appointment/today' });
      if (res.success) {
        setAppointments(res.result || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setLoading(true);
    try {
      const res = await request.update({ entity: 'appointment', id, jsonData: { status } });
      if (res.success) {
        message.success(`Status updated to ${status}`);
        fetchToday();
      }
    } catch (err) {
      message.error(err.message || 'Error updating status');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'booked': return 'blue';
      case 'confirmed': return 'cyan';
      case 'in-chair': return 'processing';
      case 'done': return 'success';
      case 'no-show': return 'error';
      default: return 'default';
    }
  };

  const actionMenu = (record) => (
    <Menu>
      <Menu.Item key="in-chair" icon={<MedicineBoxOutlined />} onClick={() => handleUpdateStatus(record._id, 'in-chair')}>
        {translate('Mark In-Chair')}
      </Menu.Item>
      <Menu.Item key="done" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record._id, 'done')}>
        {translate('Mark Done')}
      </Menu.Item>
      <Menu.Item key="no-show" icon={<UserDeleteOutlined />} onClick={() => handleUpdateStatus(record._id, 'no-show')}>
        {translate('Mark No-Show')}
      </Menu.Item>
      <Menu.Divider />
      {record.patient && (
        <Menu.Item key="view-patient" icon={<ProfileOutlined />} onClick={() => navigate(`/customer/read/${record.patient._id}`)}>
          {translate('View Patient')}
        </Menu.Item>
      )}
      {record.invoiceId && (
        <Menu.Item key="view-invoice" icon={<ReadOutlined />} onClick={() => navigate(`/invoice/read/${record.invoiceId}`)}>
          {translate('View Invoice')}
        </Menu.Item>
      )}
    </Menu>
  );

  const columns = [
    {
      title: translate('Time'),
      dataIndex: 'startTime',
      render: (val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      title: translate('Patient'),
      dataIndex: ['patient', 'name'],
      render: (text, record) => (
         <Button type="link" onClick={() => navigate(`/customer/read/${record.patient?._id}`)}>{text}</Button>
      ),
    },
    {
      title: translate('Phone'),
      dataIndex: ['patient', 'phone'],
    },
    {
      title: translate('Dentist'),
      dataIndex: ['dentist', 'name'],
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{translate(status)}</Tag>,
    },
    {
      title: translate('Quick Actions'),
      key: 'actions',
      render: (_, record) => (
        <Dropdown overlay={actionMenu(record)} trigger={['click']}>
          <Button type="primary" size="small">
            {translate('Actions')} <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{translate("Today's Dashboard (Reception)")}</Title>
        </Col>
        <Col>
          <Button type="primary" onClick={fetchToday}>{translate('Refresh')}</Button>
        </Col>
      </Row>

      <Card bordered={false}>
        <Table 
          columns={columns} 
          dataSource={appointments} 
          rowKey="_id" 
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
