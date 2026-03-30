import React, { useEffect, useState } from 'react';
import { Badge, Calendar } from 'antd';
import { request } from '@/request';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
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
      // Robustly parse the date, handling both ISO and DD/MM/YYYY HH:mm formats
      let parsedDate = dayjs(appt.startTime);
      if (!parsedDate.isValid()) {
        parsedDate = dayjs(appt.startTime, "DD/MM/YYYY HH:mm", true); // Strict parsing
      }
      if (!parsedDate.isValid()) {
        parsedDate = dayjs(appt.startTime, "MM/DD/YYYY HH:mm"); // Fallback
      }

      if (!parsedDate.isValid()) return;

      const apptDate = parsedDate.format('YYYY-MM-DD');
      if (apptDate === targetDate) {
        let type = 'success';
        if (appt.status === 'booked') type = 'warning';
        if (appt.status === 'no-show') type = 'error';
        if (appt.status === 'in-chair') type = 'processing';
        
        listData.push({
          type,
          content: `${parsedDate.format('HH:mm')} - ${appt.patient?.name || 'Unknown'}`,
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
