import { IAction } from '../types/redux.types';
import { IInvoice } from '../models/invoices.model';
import createAction from './createAction';

export const actionTypes = {
  EDIT_INVOICE: 'EDIT_INVOICE',
  DELETE_INVOICE: 'DELETE_INVOICE',
};

export const addInvoice = createAction('ADD_INVOICE', {
  request: (invoice) => ({ invoice }),
  success: (invoice) => ({ invoice }),
});

export const editInvoice = createAction('EDIT_INVOICE', {
  request: (invoice) => ({ invoice }),
  success: (invoice) => ({ invoice }),
});

export const deleteInvoice = createAction('DELETE_INVOICE', {
  request: (invoiceId) => ({ invoiceId }),
  success: (invoiceId) => ({ invoiceId }),
});
