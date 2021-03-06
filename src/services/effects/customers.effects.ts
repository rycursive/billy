import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { NgRedux as Store } from '@angular-redux/store';
import { ActionsObservable } from 'redux-observable';
import { AngularFire, FirebaseAuth, FirebaseListObservable } from 'angularfire2';
import { ICustomer } from '../models/customers.model';
import { customersActions } from '@services/actions/';

@Injectable()
export default class CustomersEffects {
  private customers$: FirebaseListObservable<ICustomer[]>;

  constructor(private firebase: AngularFire, private firebaseAuth: FirebaseAuth, private store: Store<any>) {
    firebaseAuth.subscribe(authState => {
      if (!authState) return;

      const userId = authState.uid;
      this.customers$ = firebase.database.list(`/customers/${userId}`);

      // Add customers to the store ad application startup
      this.customers$.$ref.once('value', customersSnap => {
        const customersMap = customersSnap.val();

        if (!customersMap) return;

        const customers = Object.keys(customersMap).map(customerId => {
          return { ...customersMap[customerId], id: customerId };
        });
        store.dispatch(customersActions.addCustomers.success(customers));
      });
    });
  }

  addCustomer = (actions$: ActionsObservable<IAction>) => {
    return actions$.ofType(customersActions.addCustomer.types.request)
      .switchMap(action => {
        return Observable.from(this.customers$.push(action.payload.customer))
          .map(customerRef => {
            const customer = { ...action.payload.customer, id: customerRef.key };
            return customersActions.addCustomer.success(customer);
          })
          .catch((error) => Observable.of(customersActions.addCustomer.failure(error.message)));
      });
  }

  editCustomer = (actions$: ActionsObservable<IAction>) => {
    return actions$.ofType(customersActions.editCustomer.types.request)
      .switchMap(action => {
        const customer = action.payload.customer;

        return Observable.from(this.customers$.update(customer.id, customer))
          .map(() => customersActions.editCustomer.success(customer))
          .catch((error) => Observable.of(customersActions.editCustomer.failure(error.message)));
      });
  }

  deleteCustomer = (actions$: ActionsObservable<IAction>) => {
    return actions$.ofType(customersActions.deleteCustomer.types.request)
      .switchMap(action => {
        const customerId = action.payload.customerId;

        return Observable.from(this.customers$.remove(customerId))
          .map(() => customersActions.deleteCustomer.success(customerId))
          .catch((error) => Observable.of(customersActions.deleteCustomer.failure(error.message)));
      });
  }
}
