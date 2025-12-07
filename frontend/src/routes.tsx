import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import SellerLayout from '@/components/layout/SellerLayout';
import PublicLayout from '@/components/layout/PublicLayout';
import LandingLayout from '@/components/layout/LandingLayout';

// Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/seller/Dashboard';
import StoreManager from '@/pages/seller/StoreManager';
import ProductDetail from '@/pages/seller/ProductDetail';
import AddProduct from '@/pages/seller/AddProduct';
import OrderList from '@/pages/seller/OrderList';
import LandingPage from '@/pages/LandingPage';
import Storefront from '@/pages/public/Storefront';
import OrderSuccess from '@/pages/public/OrderSuccess';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public / Marketing */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Seller Private Area */}
      <Route element={<SellerLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/manage/:storeId" element={<StoreManager />} />
        <Route path="/manage/:storeId/product/:productId" element={<ProductDetail />} />
        <Route path="/manage/:storeId/add-product" element={<AddProduct />} />
        <Route path="/manage/:storeId/orders" element={<OrderList />} />
      </Route>

      {/* Public Storefront */}
      <Route element={<PublicLayout />}>
        <Route path="/s/:slug" element={<Storefront />} />
        <Route path="/order-status/:code" element={<OrderSuccess />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;