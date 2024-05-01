"use client"

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('nrv-user') as any) ;

    if (!token) {
      router.push('/sign-in');
    }
  }, [router]);

  return <>{children}</>;
};

export default ProtectedRoute;
