import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  const location = useLocation();

  // Reset scroll position when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-base-100">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
        
        {/* Right side - Image/Pattern */}
        <div className="hidden lg:block lg:w-1/2 bg-base-200 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center max-w-lg">
              <h2 className="text-4xl font-bold text-primary mb-4">Welcome to PULSECHAT</h2>
              <p className="text-lg text-base-content/80">
                Connect with friends and colleagues in real-time with our secure messaging platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
