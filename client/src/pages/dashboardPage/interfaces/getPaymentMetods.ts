import { PaymentMetod } from "./paymentMedod";

export interface GetPaymentMetods {
    success: boolean;
    message: string;
    metods: PaymentMetod[];
}