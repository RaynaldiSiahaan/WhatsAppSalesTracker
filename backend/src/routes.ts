import { Router } from 'express';
import * as authController from './controllers/authController';
import * as storeController from './controllers/storeController';
import * as productController from './controllers/productController';
import * as publicController from './controllers/publicController';
import * as uploadController from './controllers/uploadController';
import * as dashboardController from './controllers/dashboardController';
import * as orderController from './controllers/orderController';
import { authMiddleware } from './middleware/authMiddleware';
import { upload } from './utils/upload';

const router = Router();

// --- Auth Routes ---
router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/refresh', authController.refreshToken);

// --- Public Routes (No Auth Required) ---
router.get('/api/public/catalog/:slug', publicController.getCatalog);
router.post('/api/public/orders', publicController.createOrder);

// --- Protected Routes ---
// Apply authMiddleware to all routes below this line
router.use('/api/user', authMiddleware);
router.use('/api/stores', authMiddleware);
router.use('/api/products', authMiddleware);
router.use('/api/upload', authMiddleware);
router.use('/api/seller', authMiddleware);
router.use('/api/orders', authMiddleware);

// Upload
router.post('/api/upload', upload.single('image'), uploadController.uploadImage);

// Dashboard
router.get('/api/seller/dashboard/stats', dashboardController.getDashboardStats);

// User
router.delete('/api/user/account', authController.deleteAccount);
router.patch('/api/user/profile', authController.changePassword);

// Stores
router.post('/api/stores', storeController.createStore);
router.get('/api/stores/my', storeController.getMyStores);
router.get('/api/stores/:storeId/orders', orderController.getStoreOrders);

// Products
router.post('/api/stores/:storeId/products', productController.createProduct);
router.patch('/api/products/:productId/stock', productController.updateStock);
router.delete('/api/products/:productId', productController.deleteProduct);

// Orders
router.patch('/api/orders/:orderId/status', orderController.updateOrderStatus);

export default router;