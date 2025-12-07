import { Outlet, Link } from 'react-router-dom';
import brandLogo from '@/assets/brand_logo.png';

const LandingLayout = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="absolute top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={brandLogo} alt="Setya Rasa Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight">Setya Rasa</span>
          </Link>
          <nav>
            <Link
              to="/login"
              className="text-sm font-medium hover:text-blue-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="ml-6 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      <main className="pt-20">
        <Outlet />
      </main>
      <footer className="bg-gray-50 border-t py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Setya Rasa. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout;
