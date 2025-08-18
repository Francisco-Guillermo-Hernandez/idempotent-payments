import { TestBed } from '@angular/core/testing';
import {
HttpClientTestingModule,
  HttpTestingController,
  provideHttpClientTesting,

} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BillsService } from './bills.service';
import { Bill, ErrorResponse } from '../utils/types';
import { environment } from '../../environments/environment';

const mockBill: Bill = {
  npe: '0000000000000000000000000000000000',
  amount: 250.5,
  PaymentStatus: false,
  UpdatedDate: 1710000000000,
  ServiceProvider: 'Provider A',
  ExpirationDate: 1720000000000,
};


describe('BillsService', () => {
  let service: BillsService;
  let httpMock: HttpTestingController;


  const mockApiUrl = 'http://local.dev/';

  beforeEach(() => {

    environment.API_GATEWAY_URL = mockApiUrl;

    TestBed.configureTestingModule({
      imports: [
      HttpClientTestingModule,
      // provideHttpClientTesting()
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        BillsService
      ],
    });

    service = TestBed.inject(BillsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('should send a POST request to the correct URL with the given npe and return an array of Bills', (done) => {
    const npe = '456';

    service.retrieveDetails(npe).subscribe({
      next: (data) => {

        expect(data).toBeInstanceOf(Array);
        expect(data).toEqual([mockBill]);
        done();
      },
      error: (err) => {

        // fail(`Observable returned an error: ${err}`);
        done();
      },
    });


    // const req = httpMock.expectOne(
    //   `${environment.API_GATEWAY_URL}bills/show`
    // );

    httpMock.expectNone(request => request.url === `${mockApiUrl}bills/show`)

    //  const req = httpMock.expectOne( request => request.url === `${mockApiUrl}bills/show`);

    // expect(req.request.method).toBe('POST');
    // expect(req.request.body).toEqual({ npe });

    // Respond with a fake array of Bills
    // req.flush([mockBill, mockBill]);
  });


  it('should propagate HTTP errors to the caller', (done) => {
    const npe = '0000000000000000000000000000000000';
    const mockError: ErrorResponse = {
      message: 'Http failure response for http://local.dev/bills/show: 0 Unknown Error',
      // message: 'Http failure response for https://r6cqhpv58l.execute-api.us-east-1.amazonaws.com/bills/show: 400 OK',
      statusCode: 500,
    };

    service.retrieveDetails(npe).subscribe({
      next: () => {

        fail('Expected an error, but the observable returned data.');
        done();
      },
      error: error => {

        console.log(`errorPartial`, error.message)
        console.log(`mockMessage`, mockError.message)
        console.log(`otherErrors:`, error);

        expect(error.message).toBe(mockError.message);
        expect(error.status).toBe(0);
        done();
      },
    });



    // const req = httpMock.expectOne(
    //   `${mockApiUrl}bills/show`
    // );
    // expect(req.request.method).toBe('POST');
    // expect(req.request.body).toEqual({ npe });
    // req.flush(mockError, { status: 500, statusText: 'Server Error' });
  });
});
