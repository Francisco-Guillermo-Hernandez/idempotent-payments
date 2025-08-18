import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { MainCard } from './main-card';
import { BillsService } from './bills.service';
import { DetailsService } from '../details/details.service';
import { Bill } from '../utils/types';

describe('MainCard', () => {
  let component: MainCard;
  let fixture: ComponentFixture<MainCard>;

  const mockBill: Bill = {
    npe: '123456789012',
    amount: 250.5,
    PaymentStatus: false,
    UpdatedDate: 1710000000000,
    ServiceProvider: 'Provider A',
    ExpirationDate: 1720000000000,
  };

  const billsServiceMock = {
    retrieveDetails: jasmine.createSpy('retrieveDetails').and.returnValue(of([mockBill])),
  };

  const detailsServiceMock = {
    updateInformation: jasmine.createSpy('updateInformation'),
    bill: jasmine.createSpy('bill').and.returnValue(mockBill),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainCard],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: BillsService, useValue: billsServiceMock },
        { provide: DetailsService, useValue: detailsServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MainCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the bill getter', () => {
    expect(component.bill).toBe(mockBill);
  });

  it('should call retrieveDetails and update details on send', fakeAsync(() => {

    component.form.setValue({ npe: '123456789012' });

    expect(component.loading()).toBeFalse();


    console.log(`is invalid?: ${component.form.invalid}`);

    component.send();

    fixture.detectChanges();

    console.log(`to Be true ${component.loading()}`)


    // expect(component.loading()).toBeTrue();


    // Assert
    expect(billsServiceMock.retrieveDetails).toHaveBeenCalledWith('123456789012');


    fixture.detectChanges();

    expect(detailsServiceMock.updateInformation).toHaveBeenCalledWith(mockBill);
    tick(500);

    expect(component.loading()).toBeFalse();
    expect(component.form.get('npe')?.disabled).toBeTrue();
  }));

  it('should handle errors from retrieveDetails', fakeAsync(() => {

    billsServiceMock.retrieveDetails.and.returnValue(throwError(() => new Error('boom')));
    component.form.setValue({ npe: '123456789012' });

    expect(component.loading()).toBeFalse();
    // fixture.detectChanges();

    // Act
    component.send();

    // fixture.detectChanges();
    // expect(component.loading()).toBeTrue();

    // tick(500);

    // Assert
    expect(component.loading()).toBeFalse();
  }));
});
