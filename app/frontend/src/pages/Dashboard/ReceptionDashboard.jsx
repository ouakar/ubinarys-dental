import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Dropdown, Menu, message, Typography, Row, Col, Empty } from 'antd';
import { DownOutlined, MedicineBoxOutlined, ProfileOutlined, ReadOutlined, CheckCircleOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { TrendingUp, BarChart2 } from "lucide-react";
import { request } from '@/request';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/radar-chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

const { Title } = Typography;

const mockChartData = [
  { day: "Monday", routine: 12, emergency: 4 },
  { day: "Tuesday", routine: 15, emergency: 2 },
  { day: "Wednesday", routine: 10, emergency: 6 },
  { day: "Thursday", routine: 18, emergency: 3 },
  { day: "Friday", routine: 14, emergency: 5 },
  { day: "Saturday", routine: 8, emergency: 1 },
];

const chartConfig = {
  routine: {
    label: "Routine Checkup",
    color: "#3b82f6", // blue-500
  },
  emergency: {
    label: "Emergency",
    color: "#ef4444", // red-500
  },
};

export default function ReceptionDashboard() {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(mockChartData); // Safely initialized but resilient

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Col className="col-span-1 lg:col-span-2">
          <Card className="h-full">
             <CardHeader className="items-start pb-4">
               <CardTitle>Appointments Overview</CardTitle>
               <CardDescription>Today's patient schedule and quick actions</CardDescription>
             </CardHeader>
             <CardContent>
                <Table 
                  columns={columns} 
                  dataSource={appointments} 
                  rowKey="_id" 
                  loading={loading}
                  pagination={false}
                  size="small"
                />
             </CardContent>
          </Card>
        </Col>

        <Col className="col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="items-center pb-4">
              <CardTitle>
                Volume Trends
                {chartData && chartData.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-emerald-500 bg-emerald-500/10 border-none ml-2"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>12%</span>
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Routine vs Emergency (Last 7 Days)
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0 flex-1 flex items-center justify-center min-h-[200px]">
              {!chartData || chartData.length === 0 ? (
                <Empty
                  image={<BarChart2 className="w-12 h-12 text-slate-300 mx-auto" />}
                  description={<span className="text-slate-400">No chart data available</span>}
                />
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto w-full max-w-[300px] aspect-square"
                >
                  <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      name="Routine"
                      dataKey="routine"
                      stroke="var(--color-routine)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      name="Emergency"
                      dataKey="emergency"
                      stroke="var(--color-emergency)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </Col>
      </div>
    </div>
  );
}
