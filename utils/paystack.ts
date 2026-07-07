import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here';

export interface PaystackPaymentParams {
  amount: number;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export const initiatePaystackPayment = async ({
  amount,
  email,
  reference,
  callbackUrl,
  metadata = {},
}: PaystackPaymentParams): Promise<boolean> => {
  if (Platform.OS === 'web') {
    // For web, open in same window or popup
    const params = new URLSearchParams({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: (amount * 100).toString(), // Paystack expects amount in kobo
      reference,
      callback_url: callbackUrl,
      metadata: JSON.stringify(metadata),
    });

    const paystackUrl = `https://checkout.paystack.com/?${params.toString()}`;
    
    // Open in new window for web
    const newWindow = window.open(paystackUrl, '_blank', 'width=600,height=700');
    
    if (!newWindow) {
      // If popup blocked, redirect in same window
      window.location.href = paystackUrl;
    }
    
    return true;
  } else {
    // For native, use WebBrowser
    const params = new URLSearchParams({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: (amount * 100).toString(),
      reference,
      callback_url: callbackUrl,
      metadata: JSON.stringify(metadata),
    });

    const paystackUrl = `https://checkout.paystack.com/?${params.toString()}`;
    
    try {
      const result = await WebBrowser.openAuthSessionAsync(paystackUrl, callbackUrl);
      
      if (result.type === 'success') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Paystack payment error:', error);
      return false;
    }
  }
};

export const generatePaymentReference = (userId: string, type: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `tap2crack_${type}_${userId}_${timestamp}_${random}`;
};
