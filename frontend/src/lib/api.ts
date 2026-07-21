import axios from 'axios';
import { getToken, clearToken } from './auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Member {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  score: number;
  band: 'A'|'B'|'C'|'D';
  totalSaved: number;
  status: 'active' | 'suspended';
  bvn: string;
  virtualAccount: { accountNumber: string; bankName: string; };
}

export interface ScoreData {
  score: number;
  band: 'A'|'B'|'C'|'D';
  factors: {
    name: string;
    weight: number;
    value: number;
    contribution: number;
  }[];
}

export interface Contribution {
  id: string;
  amount: number;
  date: string;
  reference: string;
  status: string;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  principal: number;
  status: 'requested' | 'approved' | 'disbursed' | 'repaying' | 'closed' | 'defaulted';
  scoreAtDecision: number;
  dateRequested: string;
  dateApproved?: string;
  dateDisbursed?: string;
  outstandingBalance: number;
}

export const auth = {
  login: async (phone: string, password: string) => {
    const res = await api.post('/auth/login', { phone, password });
    return res.data.data;
  }
};

export const members = {
  list: async () => {
    const res = await api.get<Member[]>('/members');
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Member>(`/members/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/members', data);
    return res.data;
  },
  getScore: async (id: string) => {
    const res = await api.get<ScoreData>(`/members/${id}/score`);
    return res.data;
  },
  getContributions: async (id: string) => {
    const res = await api.get<Contribution[]>(`/members/${id}/contributions`);
    return res.data;
  }
};

export const loans = {
  list: async () => {
    const res = await api.get<Loan[]>('/loans');
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Loan>(`/loans/${id}`);
    return res.data;
  },
  create: async (memberId: string, principal: number) => {
    const res = await api.post('/loans', { memberId, principal });
    return res.data;
  },
  approve: async (id: string) => {
    const res = await api.post(`/loans/${id}/approve`);
    return res.data;
  },
  disburse: async (id: string) => {
    const res = await api.post(`/loans/${id}/disburse`);
    return res.data;
  },
  repay: async (id: string, amount: number) => {
    const res = await api.post(`/loans/${id}/repay`, { amount });
    return res.data;
  },
  getExplanation: async (id: string) => {
    const res = await api.get<{ explanation: string }>(`/loans/${id}/explanation`);
    return res.data;
  }
};

export const webhooks = {
  simulate: async (memberId: string, amount: number) => {
    const res = await api.post('/webhooks/simulate', { memberId, amount });
    return res.data;
  }
};

export const assistant = {
  query: async (question: string) => {
    const res = await api.post<{ answer: string }>('/assistant/query', { question });
    return res.data;
  }
};
