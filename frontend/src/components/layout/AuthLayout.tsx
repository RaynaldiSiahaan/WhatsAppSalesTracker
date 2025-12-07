import { Outlet } from 'react-router-dom';
import brandLogo from '@/assets/brand_logo.png';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <img src={brandLogo} alt="Setya Rasa Logo" className="h-20 w-auto mb-4" />
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Setya Rasa
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
