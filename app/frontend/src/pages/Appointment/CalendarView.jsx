import React, { useEffect, useState } from 'react';
import { Badge, Calendar } from 'antd';
import { request } from '@/request';

export default function CalendarView() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // Fetch appointments
    const fetchAppointments = async () => {
      try {
        const response = await request.listAll({ entity: 'appointment' });
        if (response?.success) {
          setAppointments(response.result);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchAppointments();
  }, []);

  const getListData = (value) => {
    const listData = [];
    const targetDate = value.format('YYYY-MM-DD');

    appointments.forEach((appt) => {
      const apptDate = new Date(appt.startTime).toISOString().split('T')[0];
      if (apptDate === targetDate) {
        let type = 'success';
        if (appt.status === 'booked') type = 'warning';
        if (appt.status === 'no-show') type = 'error';
        if (appt.status === 'in-chair') type = 'processing';
        
        listData.push({
          type,
          content: `${new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${appt.patient?.name || 'Unknown'}`,
        });
      }
    });

    return listData;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ padding: '24px', background: '#fff' }}>
      <Calendar dateCellRender={dateCellRender} />
    </div>
  );
}
