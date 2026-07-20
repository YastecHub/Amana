import { redirect } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function Home() {
  const token = getToken();
  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
