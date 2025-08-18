import { TestBed } from '@angular/core/testing';
import { DetailsService } from './details.service';
import { Bill } from '../utils/types';

describe('DetailsService', () => {
  const sampleBill: Bill = {
    npe: '0000000000000000',
    amount: 10,
    PaymentStatus: false,
    UpdatedDate: 0,
    ServiceProvider: 'Provider',
    ExpirationDate: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    const service = TestBed.inject(DetailsService);
    expect(service).toBeTruthy();
  });

  it('initially exposes a null bill', () => {
    const service = TestBed.inject(DetailsService);
    expect(service.bill()).toBeNull();
  });

  it('updates the bill when updateInformation is called', () => {
    const service = TestBed.inject(DetailsService);
    service.updateInformation(sampleBill);
    expect(service.bill()).toEqual(sampleBill);
  });

  it('reacts to multiple updates', () => {
    const service = TestBed.inject(DetailsService);


    const firstBill: Bill = {
        npe: '1111111111111111',
        amount: 25.25,
        PaymentStatus: false,
        UpdatedDate: 0,
        ServiceProvider: 'Provider B',
        ExpirationDate: 1
    };
    service.updateInformation(firstBill);
    expect(service.bill()).toEqual(firstBill);

    const secondBill: Bill = {
      npe: '2222222222222222',
      amount: 49.49,
      PaymentStatus: false,
      UpdatedDate: 0,
      ServiceProvider: 'Provider C',
      ExpirationDate: 1
    };
    service.updateInformation(secondBill);
    expect(service.bill()).toEqual(secondBill);
  });

  it('is a singleton across the test module', () => {
    const firstInstance = TestBed.inject(DetailsService);
    const secondInstance = TestBed.inject(DetailsService);

    expect(firstInstance).toBe(secondInstance);

    firstInstance.updateInformation(sampleBill);
    expect(secondInstance.bill()).toEqual(sampleBill);
  });
});
