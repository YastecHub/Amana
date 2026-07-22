import axios from 'axios';
import { getToken, clearToken } from './auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: unknown;
};

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return typeof payload === 'object' && payload !== null && 'data' in payload;
}

function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  return isApiEnvelope<T>(payload) ? payload.data : payload;
}

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

type BackendMember = {
  id: string;
  joinDate: string;
  status?: string;
  bvn?: string;
  totalSaved?: number;
  totalContributed?: number;
  score?: number;
  band?: string;
  name?: string;
  phone?: string;
  user?: {
    name?: string;
    phone?: string;
  };
  latestScore?: {
    value?: number;
    score?: number;
    band?: string;
  } | null;
  virtualAccount?: {
    accountNumber?: string;
    bankName?: string;
  } | null;
};

function normalizeBand(band: unknown): Member['band'] {
  if (band === 'A' || band === 'B' || band === 'C' || band === 'D') return band;
  return 'D';
}

function normalizeStatus(status: unknown): Member['status'] {
  return status === 'suspended' ? 'suspended' : 'active';
}

function mapMember(member: BackendMember): Member {
  return {
    id: member.id,
    name: member.name ?? member.user?.name ?? '',
    phone: member.phone ?? member.user?.phone ?? '',
    joinDate: member.joinDate,
    score: member.score ?? member.latestScore?.value ?? member.latestScore?.score ?? 0,
    band: normalizeBand(member.band ?? member.latestScore?.band),
    totalSaved: member.totalSaved ?? member.totalContributed ?? 0,
    status: normalizeStatus(member.status),
    bvn: member.bvn ?? '',
    virtualAccount: {
      accountNumber: member.virtualAccount?.accountNumber ?? '',
      bankName: member.virtualAccount?.bankName ?? '',
    },
  };
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
    const res = await api.post<ApiEnvelope<{ token: string; user: { id: string; name: string; phone: string; role: string } }> | { token: string; user: { id: string; name: string; phone: string; role: string } }>('/auth/login', { phone, password });
    return unwrapApiData(res.data);
  }
};

export const members = {
  list: async () => {
    const res = await api.get<ApiEnvelope<BackendMember[]> | BackendMember[]>('/members');
    const payload = unwrapApiData(res.data);
    return Array.isArray(payload) ? payload.map(mapMember) : [];
  },
  get: async (id: string) => {
    const res = await api.get<ApiEnvelope<BackendMember> | BackendMember>(`/members/${id}`);
    return mapMember(unwrapApiData(res.data));
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post(`/members`, data);
    return unwrapApiData(res.data);
  },
  getScore: async (id: string) => {
    const res = await api.get<ApiEnvelope<ScoreData> | ScoreData>(`/members/${id}/score`);
    return unwrapApiData(res.data);
  },
  getContributions: async (id: string) => {
    const res = await api.get<ApiEnvelope<Contribution[]> | Contribution[]>(`/members/${id}/contributions`);
    return unwrapApiData(res.data);
  }
};

export const loans = {
  list: async () => {
    const res = await api.get<ApiEnvelope<Loan[]> | Loan[]>('/loans');
    return unwrapApiData(res.data);
  },
  get: async (id: string) => {
    const res = await api.get<ApiEnvelope<Loan> | Loan>(`/loans/${id}`);
    return unwrapApiData(res.data);
  },
  create: async (memberId: string, principal: number) => {
    const res = await api.post('/loans', { memberId, principal });
    return unwrapApiData(res.data);
  },
  approve: async (id: string) => {
    const res = await api.post(`/loans/${id}/approve`);
    return unwrapApiData(res.data);
  },
  disburse: async (id: string) => {
    const res = await api.post(`/loans/${id}/disburse`);
    return unwrapApiData(res.data);
  },
  repay: async (id: string, amount: number) => {
    const res = await api.post(`/loans/${id}/repay`, { amount });
    return unwrapApiData(res.data);
  },
  getExplanation: async (id: string) => {
    const res = await api.get<ApiEnvelope<{ explanation: string }> | { explanation: string }>(`/loans/${id}/explanation`);
    return unwrapApiData(res.data);
  }
};

export const webhooks = {
  simulate: async (memberId: string, amount: number) => {
    const res = await api.post('/webhooks/simulate', { memberId, amount });
    return unwrapApiData(res.data);
  }
};

export const assistant = {
  query: async (question: string) => {
    const res = await api.post<ApiEnvelope<{ answer: string }> | { answer: string }>('/assistant/query', { question });
    return unwrapApiData(res.data);
  }
};
