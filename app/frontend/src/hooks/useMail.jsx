import { erp } from '@/redux/erp/actions';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { message, Modal } from 'antd';
import { selectMailItem } from '@/redux/erp/selectors';
import useLanguage from '@/locale/useLanguage';

export default function useMail({ entity }) {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const { isLoading, isSuccess, error } = useSelector(selectMailItem);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    if (isSuccess) {
      message.success(translate('Email sent successfully / Email envoyé avec succès'));
      dispatch(erp.resetAction({ actionType: 'mail' }));
    }
    if (error) {
      message.error(translate('Failed to send email. Check SMTP configuration. / Échec de l\'envoi. Vérifiez le SMTP.'));
      dispatch(erp.resetAction({ actionType: 'mail' }));
    }
  }, [isSuccess, error, translate, dispatch]);

  const send = (id) => {
    setCurrentId(id);
    Modal.confirm({
      title: translate('Confirm email dispatch / Confirmer l\'envoi'),
      content: translate('Are you sure you want to send this document by email? / Voulez-vous envoyer ce document par email ?'),
      okText: translate('Send / Envoyer'),
      cancelText: translate('Cancel / Annuler'),
      onOk: () => {
        dispatch(erp.mail({ entity, jsonData: { id } }));
      },
    });
  };

  return { send, isLoading };
}
