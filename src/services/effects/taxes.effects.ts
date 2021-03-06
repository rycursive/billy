import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { NgRedux as Store } from '@angular-redux/store';
import { ActionsObservable } from 'redux-observable';
import { AngularFire, FirebaseAuth, FirebaseListObservable } from 'angularfire2';
import { ITax } from '../models/taxes.model';
import { taxesActions } from '@services/actions/';

@Injectable()
export default class TaxesEffects {
  private taxes$: FirebaseListObservable<ITax[]>;

  constructor(private firebase: AngularFire, private firebaseAuth: FirebaseAuth, private store: Store<any>) {
    firebaseAuth.subscribe(authState => {
      if (!authState) return;

      const userId = authState.uid;
      this.taxes$ = firebase.database.list(`/taxes/${userId}`);

      // Add taxes to the store ad application startup
      this.taxes$.$ref.once('value', taxesSnap => {
        const taxesMap = taxesSnap.val();

        if (!taxesMap) return;

        const taxes = Object.keys(taxesMap).map(taxId => {
          return { ...taxesMap[taxId], id: taxId };
        });
        store.dispatch(taxesActions.addTaxes.success(taxes));
      });
    });
  }

  addTax = (actions$: ActionsObservable<IAction>) => {
    return actions$.ofType(taxesActions.addTax.types.request)
      .switchMap(action => {
        return Observable.from(this.taxes$.push(action.payload.tax))
          .map(taxRef => {
            const tax = { ...action.payload.tax, id: taxRef.key };
            return taxesActions.addTax.success(tax);
          })
          .catch((error) => Observable.of(taxesActions.addTax.failure(error.message)));
      });
  }

  editTax = (actions$: ActionsObservable<IAction>) => {
    return actions$.ofType(taxesActions.editTax.types.request)
      .switchMap(action => {
        const tax = action.payload.tax;

        return Observable.from(this.taxes$.update(tax.id, tax))
          .map(() => taxesActions.editTax.success(tax))
          .catch((error) => Observable.of(taxesActions.editTax.failure(error.message)));
      });
  }

  deleteTax = (actions$: ActionsObservable<IAction>) => {
    return actions$.ofType(taxesActions.deleteTax.types.request)
      .switchMap(action => {
        const taxId = action.payload.taxId;

        return Observable.from(this.taxes$.remove(taxId))
          .map(() => taxesActions.deleteTax.success(taxId))
          .catch((error) => Observable.of(taxesActions.deleteTax.failure(error.message)));
      });
  }
}
