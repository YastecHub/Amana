import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const {
  MONNIFY_API_KEY,
  MONNIFY_SECRET_KEY,
  MONNIFY_CONTRACT_CODE,
  MONNIFY_BASE_URL,
  MONNIFY_WALLET_ACCOUNT_NUMBER
} = process.env;

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export const getMonnifyToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');

  try {
    const response = await axios.post(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    });

    cachedToken = response.data.responseBody.accessToken;
    // Monnify tokens typically expire in 3600 seconds, buffer by 5 minutes
    tokenExpiry = Date.now() + (response.data.responseBody.expiresIn * 1000) - 300000;
    return cachedToken as string;
  } catch (error) {
    console.error('Error fetching Monnify token', error);
    throw new Error('Failed to authenticate with Monnify');
  }
};

interface CreateAccountParams {
  accountReference: string;
  accountName: string;
  customerEmail: string;
  customerName: string;
  currencyCode: string;
  contractCode: string;
  getAllAvailableBanks: boolean;
}

export const createReservedAccount = async (params: CreateAccountParams) => {
  const token = await getMonnifyToken();

  try {
    const response = await axios.post(`${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.responseBody;
  } catch (error) {
    console.error('Error creating Monnify reserved account', error);
    throw new Error('Failed to create Monnify reserved account');
  }
};

export const verifyBVN = async (bvn: string, name: string) => {
  // Mock implementation for sandbox as requested
  console.log(`Mocking BVN verification for ${bvn}`);
  return { verified: true, name };
};

export const verifyWebhookSignature = (requestBody: string, signature: string, secretKey: string): boolean => {
  const hash = crypto.createHmac('sha512', secretKey).update(requestBody).digest('hex');
  return hash === signature;
};

interface InitiateTransferParams {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  currency: string;
  sourceAccountNumber: string;
}

export const initiateSingleTransfer = async (params: InitiateTransferParams) => {
  const token = await getMonnifyToken();

  try {
    const response = await axios.post(`${MONNIFY_BASE_URL}/api/v2/disbursements/single`, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.responseBody;
  } catch (error) {
    console.error('Error initiating Monnify transfer', error);
    throw new Error('Failed to initiate Monnify transfer');
  }
};

export const getTransactionStatus = async (transactionReference: string) => {
  const token = await getMonnifyToken();

  try {
    const response = await axios.get(`${MONNIFY_BASE_URL}/api/v2/transactions/${encodeURIComponent(transactionReference)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.responseBody;
  } catch (error) {
    console.error('Error fetching Monnify transaction status', error);
    throw new Error('Failed to fetch transaction status');
  }
};
