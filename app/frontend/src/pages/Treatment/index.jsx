import React from 'react';
import CrudModule from '@/modules/CrudModule/CrudModule';
import TreatmentForm from '@/forms/TreatmentForm';
import { fields } from './config';
import useLanguage from '@/locale/useLanguage';

export default function Treatment() {
  const translate = useLanguage();
  const entity = 'treatment';
  
  const searchConfig = {
    displayLabels: ['name'],
    searchFields: 'name,code,category',
  };
  
  const deleteModalLabels = ['name'];

  const Labels = {
    PANEL_TITLE: translate('Treatments Catalog'),
    DATATABLE_TITLE: translate('Treatments List'),
    ADD_NEW_ENTITY: translate('Add New Treatment'),
    ENTITY_NAME: translate('Treatment'),
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

  return (
    <CrudModule
      createForm={<TreatmentForm />}
      updateForm={<TreatmentForm isUpdateForm={true} />}
      config={config}
    />
  );
}
