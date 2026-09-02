import { Order, AppSettings } from './types';
export declare const generateWhatsAppQuoteMessage: (order: Order, settings: AppSettings) => string;
export declare const getWhatsAppUrl: (phone: string | undefined, message: string) => string;
