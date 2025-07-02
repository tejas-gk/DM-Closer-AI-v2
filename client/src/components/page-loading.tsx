import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface PageLoadingProps {
  children: React.ReactNode;
}

export function PageLoadingWrapper({ children }: PageLoadingProps) {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [previousLocation, setPreviousLocation] = useState(location);

  useEffect(() => {
    if (location !== previousLocation) {
      setIsLoading(true);
      setPreviousLocation(location);
      
      // Short delay to show loading state, then hide it
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [location, previousLocation]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function NavigationLoader() {
  const [location] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [previousLocation, setPreviousLocation] = useState(location);

  useEffect(() => {
    if (location !== previousLocation) {
      setIsNavigating(true);
      setPreviousLocation(location);
      
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [location, previousLocation]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
      <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%', animation: 'loading-bar 0.3s ease-in-out' }}></div>

    </div>
  );
}