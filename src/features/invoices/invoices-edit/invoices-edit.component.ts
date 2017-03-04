import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ActivatedRoute } from '@angular/router';
import CustomersModel, { ICustomer } from '@services/models/customers.model';
import InvoicesModel, { IInvoice, ITask } from '@services/models/invoices.model';
import TaxesModel, { ITax } from '@services/models/taxes.model';
import { IDeactivateComponent } from '@services/deactivate-guard.service';
import isNaN = require('lodash/isNaN');
import set = require('lodash/fp/set');

@Component({
  selector: 'invoices-edit',
  templateUrl: './invoices-edit.component.html',
  styleUrls: ['./invoices-edit.component.css'],
})
export default class InvoicesEditComponent implements OnInit, OnDestroy, IDeactivateComponent {
  customers: ICustomer[];
  availableTaxes: ITax[];
  invoice: IInvoice;

  private dirty: boolean = false;

  private customersSub: Subscription;
  private taxesSub: Subscription;
  private invoiceSub: Subscription;

  private editInvoice(path: string, value: any) {
    this.invoice = set(path, value, this.invoice) as IInvoice;
    this.dirty = true;
  }

  constructor(
    private customersModel: CustomersModel,
    private invoicesModel: InvoicesModel,
    private taxesModel: TaxesModel,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.invoiceSub = Observable.combineLatest(
      [this.invoicesModel.invoices$, this.route.params],
      (invoices, params) => {
        const invoiceId = params['invoiceId'];
        return invoices.find(invoice => invoice.id === invoiceId);
      },
    )
    .subscribe(invoice => this.invoice = invoice);

    this.customersSub = this.customersModel.customers$.subscribe(customers => this.customers = customers);
    this.taxesSub = this.taxesModel.taxes$.subscribe(taxes => {
      if (this.availableTaxes && taxes.length === this.availableTaxes.length + 1) {
        /**
         * If the new list of taxes has a new tax it means that the user added a
         * new tax and the server saved it successfully. This is a dirty trick
         * used to add an async item and without moving the internal Invoice state
         * to the global state for now.
         */
        const newTax = taxes[taxes.length - 1];
        this.editInvoice('taxes', this.invoice.taxes.concat(newTax));
      }
      this.availableTaxes = taxes;
    });
  }

  ngOnDestroy() {
    this.customersSub.unsubscribe();
    this.taxesSub.unsubscribe();
    this.invoiceSub.unsubscribe();
  }

  canDeactivate() {
    if (this.dirty) return window.confirm('Your changes could be lost if you leave before saving.');

    return true;
  }

  handleSaveInvoice() {
    this.dirty = false;
    this.invoicesModel.editInvoice(this.invoice);
  }

  handleBusinessChange(newBusinessInfo): void {
    const updatedUser = { ...this.invoice.user, ...newBusinessInfo };
    this.editInvoice('user', updatedUser);
  }

  handleAddCustomer(newCustomer: ICustomer): void {
    this.customersModel.addCustomer(newCustomer);
  }

  handleEditCustomer(newCustomer: ICustomer): void {
    const updatedCustomer = { ...this.invoice.customer, ...newCustomer };
    this.editInvoice('customer', updatedCustomer);
  }

  handleRemoveCustomer(): void {
    this.editInvoice('customer', null);
  }

  handleSelectCustomer(selectedCustomerId: string): void {
    const newCustomer = this.customers.find(customer => customer.id === selectedCustomerId);
    this.editInvoice('customer', newCustomer);
  }

  /**
   * Invoice location, date and number event listeners
   */

  handleEditDate(newDate: string): void {
    this.editInvoice('date', newDate);
  }

  handleEditLocation(newLocation: string): void {
    this.editInvoice('location', newLocation);
  }

  handleEditNumber(newNumber: number): void {
    if (isNaN(newNumber)) return;

    this.editInvoice('number', newNumber);
  }

  /**
   * Invoice tasks event listeners
   */

  handleAddTask(task: ITask) {
    const taskId = this.invoicesModel.generateId('TASK');
    const newTask = Object.assign({}, task, { id: taskId });
    this.editInvoice('tasks', this.invoice.tasks.concat(newTask));
  }

  handleEditTask(updatedTask: ITask) {
    const updatedTasks = this.invoice.tasks.map(task => {
      if (task.id === updatedTask.id) return updatedTask;
      return task;
    });

    this.editInvoice('tasks', updatedTasks);
  }

  handleRemoveTask(taskId: string) {
    this.editInvoice('tasks', this.invoice.tasks.filter(task => task.id !== taskId));
  }

  /**
   * Invoice taxes event listeners
   */

  handleAddTax() {
    this.taxesModel.addTax();
  }

  handleAddInvoiceTax(taxId: string) {
    const tax = this.availableTaxes.find(item => item.id === taxId);
    this.editInvoice('taxes', this.invoice.taxes.concat(tax));
  }

  handleEditTax(updatedTax: ITax) {
    const updatedTaxes = this.invoice.taxes.map(tax => {
      if (tax.id === updatedTax.id) return updatedTax;
      return tax;
    });

    this.editInvoice('taxes', updatedTaxes);
  }

  handleRemoveTax(taxId: string) {
    this.editInvoice('taxes', this.invoice.taxes.filter(tax => tax.id !== taxId));
  }

  handleNotesChange(notes: string) {
    this.editInvoice('notes', notes);
  }
}
