import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';

import useLanguage from '@/locale/useLanguage';

export default function Users() {
  const translate = useLanguage();
  const entity = 'users';
  const searchConfig = {
    displayLabels: ['name'],
    searchFields: 'name,email',
  };
  const deleteModalLabels = ['name'];

  const Labels = {
    PANEL_TITLE: 'Utilisateur',
    DATATABLE_TITLE: 'Liste des utilisateurs',
    ADD_NEW_ENTITY: 'Ajouter un utilisateur',
    ENTITY_NAME: 'Utilisateur',
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
      createForm={<DynamicForm fields={fields} />}
      updateForm={<DynamicForm fields={fields} />}
      config={config}
    />
  );
}
