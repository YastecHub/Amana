export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  bvn?: string;
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
  };
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('amana_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('amana_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('amana_token');
  localStorage.removeItem('amana_user');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('amana_user');
  if (!user) return null;
  try {
    return JSON.parse(user) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('amana_user', JSON.stringify(user));
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'admin';
}
