import express from 'express';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import authRoutes from './authRoutes.js';
import heroRoutes from './heroRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import navigationCategoryRoutes from './navigationCategoryRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import currencyRoutes from './currencyRoutes.js';
import footerRoutes from './footerRoutes.js';
import announcementRoutes from './announcementRoutes.js';
import backgroundRoutes from './backgroundRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import giftCardRoutes from './giftCardRoutes.js';
import couponRoutes from './couponRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/hero', heroRoutes);
router.use('/settings', settingsRoutes);
router.use('/categories', categoryRoutes);
router.use('/navigation-categories', navigationCategoryRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/currency', currencyRoutes);
router.use('/footer', footerRoutes);
router.use('/announcements', announcementRoutes);
router.use('/backgrounds', backgroundRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/gift-cards', giftCardRoutes);
router.use('/coupons', couponRoutes);

export default router;