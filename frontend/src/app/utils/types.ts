

export type Bill = {
  npe: string;
  amount: number;
  PaymentStatus: boolean;
  UpdatedDate: number;
  ServiceProvider: string;
  ExpirationDate: number;
};

export type ErrorResponse = {
  message: string;
  statusCode?: number;
}
