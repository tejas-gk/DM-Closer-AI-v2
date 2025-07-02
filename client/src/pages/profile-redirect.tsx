import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ProfileRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/dashboard/settings');
  }, [setLocation]);

  return null;
}