import { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogOut, LayoutDashboard, Menu, X, MessageSquare } from 'lucide-react'; // Added MessageSquare
import brandLogo from '@/assets/brand_logo.png';

const SellerLayout = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src={brandLogo} alt="Logo" className="h-8 w-auto" />
          <h1 className="text-lg font-bold text-gray-800">Setya Rasa</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="text-gray-600 p-1 rounded hover:bg-gray-100"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={brandLogo} alt="Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-gray-800">Setya Rasa</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-2 px-4 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          {/* New AI Chat Link */}
          <Link
            to="/ai-chat"
            className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            Diskusi Ide dengan AI
          </Link>
          <button
            onClick={() => {
              logout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-100 relative">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;
