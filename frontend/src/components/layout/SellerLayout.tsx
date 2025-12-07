import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogOut, LayoutDashboard } from 'lucide-react';
import brandLogo from '@/assets/brand_logo.png';

const SellerLayout = () => {
  const { isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex-shrink-0 hidden md:block">
        <div className="p-6 flex items-center gap-3">
          <img src={brandLogo} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-xl font-bold text-gray-800">Setya Rasa</h1>
        </div>
        <nav className="mt-6">
          <Link
            to="/dashboard"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center px-6 py-3 text-red-600 hover:bg-red-50 mt-auto"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;
