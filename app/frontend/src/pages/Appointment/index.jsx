import React from 'react';
import { Tabs } from 'antd';
import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import AppointmentForm from '@/forms/AppointmentForm';
import CalendarView from './CalendarView';
import { fields } from './config';
import useLanguage from '@/locale/useLanguage';

export default function Appointment() {
  const translate = useLanguage();
  const entity = 'appointment';
  const searchConfig = {
    displayLabels: ['status'],
    searchFields: 'status',
  };
  const deleteModalLabels = ['status'];

  const Labels = {
    PANEL_TITLE: translate('Appointment'),
    DATATABLE_TITLE: translate('Appointment List'),
    ADD_NEW_ENTITY: translate('Add New Appointment'),
    ENTITY_NAME: translate('Appointment'),
  };
  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    fields,
    searchConfig,
    deleteModalLabels,
  };

  const crudTab = (
    <CrudModule
      createForm={<AppointmentForm />}
      updateForm={<AppointmentForm isUpdateForm={true} />}
      config={config}
    />
  );

  return (
    <Tabs
      defaultActiveKey="1"
      items={[
        {
          key: '1',
          label: translate('List View'),
          children: crudTab,
        },
        {
          key: '2',
          label: translate('Calendar View'),
          children: <CalendarView />,
        },
      ]}
    />
  );
}
