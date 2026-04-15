import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Dropdown, Menu, message, Typography, Row, Col, Empty, Card } from 'antd';
import { DownOutlined, MedicineBoxOutlined, ProfileOutlined, ReadOutlined, CheckCircleOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { TrendingUp, BarChart2 } from "lucide-react";
import { request } from '@/request';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/radar-chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const { Title, Text } = Typography;

// Data initialized empty, fetched from backend
const initialChartData = [];

// Config remains static but labels will be handled via translate in the component if needed, 
// or kept generic since ChartContainer handles mapping.


export default function ReceptionDashboard() {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);

  const chartConfig = {
    routine: {
      label: translate("Routine"),
      color: "#1890ff",
    },
    emergency: {
      label: translate("Emergency"),
      color: "#722ed1",
    },
  };

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
  const fetchTrends = async () => {
    try {
      const res = await request.get({ entity: 'appointment/trends' });
      if (res.success) {
        setChartData(res.result || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchToday();
    fetchTrends();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setLoading(true);
    try {
      const res = await request.update({ entity: 'appointment', id, jsonData: { status } });
      if (res.success) {
        message.success(`${translate('Status updated to')} ${translate(status)}`);
        fetchToday();
      }
    } catch (err) {
      message.error(err.message || translate('Error updating status'));
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
      render: (text) => text || '—',
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Col className="col-span-1 lg:col-span-2">
          <Card 
            title={translate("Appointments Overview")} 
            bordered={false} 
            style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%' }}
            headStyle={{ borderBottom: 'none', paddingBottom: 0 }}
             extra={<Text type="secondary">{translate("Today's patient schedule and quick actions")}</Text>}
          >
            <Table 
              columns={columns} 
              dataSource={appointments} 
              rowKey="_id" 
              loading={loading}
              pagination={{ pageSize: 15 }}
              size="middle"
              className="mt-4"
            />
          </Card>
        </Col>

        <Col className="col-span-1">
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {translate("Volume Trends")}
                {chartData && chartData.length > 0 && (
                  <Tag color="success" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, borderRadius: '4px' }}>
                    <TrendingUp className="h-3 w-3" />
                    12%
                  </Tag>
                )}
              </div>
            }
            bordered={false} 
            style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}
             extra={<Text type="secondary">{translate("Routine vs Emergency (Last 7 Days)")}</Text>}
          >
            <div className="pb-0 flex-1 flex items-center justify-center min-h-[200px] mt-8">
              {!chartData || chartData.length === 0 ? (
                <Empty
                  image={<BarChart2 className="w-12 h-12 text-slate-300 mx-auto" />}
                  description={<span className="text-slate-400">{translate("No data available")}</span>}
                />
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto w-full max-w-[300px] aspect-square"
                >
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                    <defs>
                      <linearGradient id="colorRoutine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-routine)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-routine)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-emergency)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-emergency)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={10}
                      tick={{ fill: '#8c8c8c', fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={10}
                      tick={{ fill: '#8c8c8c', fontSize: 11 }}
                    />
                    <ChartTooltip 
                      cursor={false} 
                      content={
                        <ChartTooltipContent 
                          labelFormatter={(value) => value}
                          formatter={(value, name) => [value, translate(name)]}
                        />
                      } 
                    />
                    <Area
                      type="monotone"
                      name="Routine"
                      dataKey="routine"
                      stroke="var(--color-routine)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRoutine)"
                    />
                    <Area
                      type="monotone"
                      name="Emergency"
                      dataKey="emergency"
                      stroke="var(--color-emergency)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEmergency)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </div>
          </Card>
        </Col>
      </div>
    </div>
  );
}
