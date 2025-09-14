import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Eye, Truck, Send, MapPin } from 'lucide-react';
import { OrderModal } from './OrderModal';
import { AddOrderModal } from './AddOrderModal';
import { DeliveryAssignmentModal } from './DeliveryManagement/DeliveryAssignmentModal';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
  };
  quantity: number;
  price: number;
  size?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  currency?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'cod';
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  deliveryStatus?: string;
  deliveryTrackingNumber?: string;
  deliveryCompany?: {
    _id: string;
    name: string;
    code: string;
  };
  deliveryAssignedAt?: string;
  deliveryEstimatedDate?: string;
  deliveryActualDate?: string;
}

export function Orders() {
  const { settings } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const { currency } = useCurrency();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.getWithRetry('/orders/all');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.putWithRetry(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleSendToDelivery = async (orders: Order[]) => {
    if (orders.length === 1) {
      // For single order, open the delivery assignment modal
      setSelectedOrder(orders[0]);
      setIsDeliveryModalOpen(true);
      return;
    }

    // For multiple orders, use the batch delivery process
    console.log('🚚 Starting batch delivery process for', orders.length, 'orders');
    
    try {
      // First, get available delivery companies to use the first active one
      console.log('📋 Fetching active delivery companies...');
  const companiesResponse = await api.getWithRetry('/delivery/companies/public/active');
  const companiesData = companiesResponse.data;
  const companies = Array.isArray(companiesData) ? companiesData : (companiesData?.data ?? []);
      
      console.log('📋 Found', companies.length, 'active delivery companies:', companies.map((c: any) => c.name));
      
      if (!companies || companies.length === 0) {
        toast.error('No active delivery companies available');
        console.log('❌ No active delivery companies found');
        return;
      }

      // Use the first available delivery company
      const defaultCompany = companies[0];
      console.log('✅ Using delivery company:', defaultCompany.name, '(ID:', defaultCompany._id, ')');

      console.log('📦 Sending orders to delivery service...');
      const results = await Promise.allSettled(orders.map(async (order, index) => {
        console.log(`📦 Processing order ${index + 1}/${orders.length}: #${order.orderNumber}`);
  return api.postWithRetry('/delivery/order', { 
          order,
          companyId: defaultCompany._id
        });
      }));

      // Count successful and failed deliveries
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      if (successful > 0) {
        console.log(`✅ ${successful} orders sent successfully`);
        toast.success(`${successful} orders sent to delivery service successfully`);
      }
      
      if (failed > 0) {
        console.log(`❌ ${failed} orders failed to send`);
        toast.error(`${failed} orders failed to send to delivery service`);
      }
      
      fetchOrders();
      setSelectedOrders([]);
    } catch (error: any) {
      console.error('❌ Delivery error:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to send orders to delivery service';
      toast.error(errorMessage);
      
      // If it's a 404 error, let's show a more specific message
      if (error.response?.status === 404) {
        toast.error('Delivery service endpoint not found. Please check server configuration.');
        console.log('❌ 404 Error: The delivery endpoint was not found');
      }
      
      // If it's an auth error
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
        console.log('❌ 401 Error: Authentication required');
      }
    }
  };

  const handleDeliveryAssignmentSuccess = () => {
    setIsDeliveryModalOpen(false);
    setSelectedOrder(null);
    fetchOrders(); // Refresh orders to show updated delivery status
    setSelectedOrders([]); // Clear selected orders
  };

  // Waybill size state for bulk printing
  const [waybillSize, setWaybillSize] = useState<'A4' | 'A5' | '4x6' | '10x10' | '10x15'>('A4');
    // Helper: 10x15 waybill template (matches attached design)
  const waybill10x15 = (order: Order) => `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>Waybill #${order.orderNumber}</title>
          <style>
            @page { size: 10cm 15cm; margin: 0; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 10cm; height: 15cm; margin: 0; box-sizing: border-box; }
            .waybill10x15-container { border: 2px solid #000; width: 9.8cm; height: 14.8cm; margin: 0.1cm auto; padding: 0.2cm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start; }
            .waybill10x15-header { display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; margin-bottom: 0.2cm; }
            .waybill10x15-storeinfo { text-align: left; font-size: 1em; line-height: 1.2; min-width: 4.5cm; }
            .waybill10x15-barcode { text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; }
            .waybill10x15-barcode img { height: 38px; margin-bottom: 2px; }
            .waybill10x15-barcode-num { font-size: 0.95em; letter-spacing: 1px; margin-bottom: 2px; }
            .waybill10x15-barcode-extra { font-size: 1em; margin-bottom: 2px; }
            .waybill10x15-date { font-size: 1em; text-align: left; }
            .waybill10x15-main { display: flex; flex-direction: row; gap: 0.3cm; margin-bottom: 0.2cm; }
            .waybill10x15-products, .waybill10x15-recipient { border: 1px solid #000; border-radius: 6px; background: #fff; padding: 0.15cm 0.2cm; min-width: 4.2cm; }
            .waybill10x15-products { margin-bottom: 0; }
            .waybill10x15-products-table { width: 100%; border-collapse: collapse; font-size: 1em; }
            .waybill10x15-products-table th, .waybill10x15-products-table td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
            .waybill10x15-products-table th { background: #fff; font-weight: bold; }
            .waybill10x15-label { font-weight: bold; font-size: 1em; border-bottom: 1px solid #000; margin-bottom: 2px; text-align: right; }
            .waybill10x15-value { margin-bottom: 2px; }
            .waybill10x15-footer { display: flex; flex-direction: row; justify-content: flex-start; align-items: flex-end; gap: 0.5cm; margin-top: 0.5cm; }
            .waybill10x15-total { font-weight: bold; font-size: 1.1em; }
            .waybill10x15-notes { font-size: 1em; }
          </style>
        </head>
        <body>
          <div class="waybill10x15-container">
            <div class="waybill10x15-header">
              <div class="waybill10x15-storeinfo">
                <div>${settings?.name || 'Mini Store'}</div>
                <div class="waybill10x15-date">التاريخ: ${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} <br/>${new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
              </div>
              <div class="waybill10x15-barcode">
                <img src="https://barcode.tec-it.com/barcode.ashx?data=${order.orderNumber}&code=Code128&translate-esc=true" alt="barcode" />
                <div class="waybill10x15-barcode-num">${order.orderNumber}</div>
                <div class="waybill10x15-barcode-extra">${settings?.phone || ''}</div>
              </div>
            </div>
            <div class="waybill10x15-main">
              <div class="waybill10x15-recipient">
                <div class="waybill10x15-label">المستلم</div>
                <div class="waybill10x15-value"><b>${order.customerInfo.firstName} ${order.customerInfo.lastName || ''}</b></div>
                <div class="waybill10x15-value">${order.customerInfo.mobile}</div>
                <div class="waybill10x15-value">${order.shippingAddress.city}</div>
                <div class="waybill10x15-value">${settings?.name || 'Mini Store'}</div>
              </div>
              <div class="waybill10x15-products">
                <div class="waybill10x15-label">المنتجات</div>
                <table class="waybill10x15-products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم المنتج</th>
                      <th>الكمية</th>
                      <th>وحدة السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map((item: OrderItem, idx: number) => `
                      <tr>
                        <td>${idx + 1}</td>
                        <td>${item.product.name}</td>
                        <td>X${item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div style="text-align:left; margin-top:4px;">المجموع: ${order.totalAmount.toFixed(2)}</div>
              </div>
            </div>
            <div class="waybill10x15-footer">
              <div class="waybill10x15-total">اسم المستلم والتوقيع:</div>
              <div class="waybill10x15-notes">ملاحظات<br/>تسليم يوم الاربعاء</div>
            </div>
          </div>
        </body>
      </html>
    `;

  const handlePrintOrders = (orders: Order[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Helper: 10x10 waybill template (matches modal)
  const waybill10x10 = (order: Order) => `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>Waybill #${order.orderNumber}</title>
          <style>
            @page { size: 10cm 10cm; margin: 0; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 10cm; height: 10cm; margin: 0; box-sizing: border-box; }
            .waybill-container { border: 2px solid #000; width: 9.8cm; height: 9.8cm; margin: 0.1cm auto; padding: 0.2cm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
            .waybill-header { display: flex; justify-content: space-between; align-items: flex-start; }
            .waybill-date { font-size: 0.9em; font-weight: bold; }
            .waybill-logo { text-align: right; }
            .waybill-logo img { height: 32px; }
            .waybill-main { display: flex; flex: 1; gap: 0.2cm; margin-top: 0.2cm; }
            .waybill-box { border: 1px solid #000; border-radius: 6px; padding: 0.15cm 0.2cm; background: #fff; }
            .waybill-products { flex: 1.2; display: flex; flex-direction: column; }
            .waybill-products-table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
            .waybill-products-table th, .waybill-products-table td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
            .waybill-products-table th { background: #f3f3f3; font-weight: bold; }
            .waybill-recipient { flex: 1; display: flex; flex-direction: column; gap: 2px; }
            .waybill-label { font-weight: bold; font-size: 0.95em; border-bottom: 1px solid #000; margin-bottom: 2px; text-align: right; }
            .waybill-value { margin-bottom: 2px; }
            .waybill-footer { display: flex; gap: 0.2cm; margin-top: 0.2cm; }
            .waybill-total { flex: 1.2; text-align: center; border: 1px solid #000; border-radius: 6px; font-size: 1.2em; font-weight: bold; background: #f3f3f3; display: flex; flex-direction: column; justify-content: center; align-items: center; }
            .waybill-barcode { flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; }
            .barcode-label { font-size: 0.8em; margin-bottom: 2px; }
            .barcode-img { margin-bottom: 2px; }
            .serial { font-size: 0.9em; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="waybill-container">
            <div class="waybill-header">
              <div class="waybill-date">${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ${new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
              <div class="waybill-logo">
                <b>Mini Store</b>
                <div style="font-size:0.9em; font-weight:bold;">${order.customerInfo.mobile}</div>
              </div>
            </div>
            <div class="waybill-main">
              <div class="waybill-products waybill-box">
                <div class="waybill-label">المنتجات / Products</div>
                <table class="waybill-products-table">
                  <tbody>
                    ${order.items.map((item: OrderItem) => `
                      <tr>
                        <td>${item.price.toFixed(2)}</td>
                        <td>X${item.quantity}</td>
                        <td>${item.product.name}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="waybill-recipient waybill-box">
                <div class="waybill-label">المستلم / Recipient</div>
                <div class="waybill-value">${order.customerInfo.firstName} ${order.customerInfo.lastName || ''}</div>
                <div class="waybill-value">${order.customerInfo.mobile}</div>
                <div class="waybill-value">${order.shippingAddress.city}</div>
                <div class="waybill-value">Mini Store :المرسل</div>
              </div>
            </div>
            <div class="waybill-footer">
              <div class="waybill-total">
                <div>مجموع قيمة التحصيل<br/>Total Amount</div>
                <div style="font-size:1.4em; color:#000;">${order.totalAmount.toLocaleString('en-US')}</div>
              </div>
              <div class="waybill-barcode">
                <div class="barcode-label">تسلسل المتجر / Store Serial</div>
                <div class="barcode-img">
                  <img src="https://barcode.tec-it.com/barcode.ashx?data=${order.orderNumber}&code=Code128&translate-esc=true" alt="barcode" height="32" />
                </div>
                <div class="serial">${order.orderNumber}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Helper: A5 waybill template (matches attached design)
  const waybillA5 = (order: Order) => `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>Waybill #${order.orderNumber}</title>
          <style>
            @page { size: A5; margin: 8mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; box-sizing: border-box; }
            .a5-container { border: 2px solid #000; width: 100%; min-height: 98%; margin: 0 auto; padding: 8px; box-sizing: border-box; }
            .a5-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
            .a5-logo { width: 120px; }
            .a5-barcode { text-align: center; flex: 1; }
            .a5-barcode img { height: 40px; }
            .a5-storeinfo { text-align: right; min-width: 120px; font-size: 0.95em; }
            .a5-date { font-size: 0.95em; }
            .a5-main { display: flex; gap: 8px; }
            .a5-products, .a5-recipient { border: 1px solid #000; border-radius: 6px; background: #fff; padding: 6px; }
            .a5-products { flex: 2.2; margin-bottom: 8px; }
            .a5-products-table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
            .a5-products-table th, .a5-products-table td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
            .a5-products-table th { background: #f3f3f3; font-weight: bold; }
            .a5-recipient { flex: 1.2; display: flex; flex-direction: column; gap: 2px; min-width: 220px; }
            .a5-label { font-weight: bold; font-size: 1em; border-bottom: 1px solid #000; margin-bottom: 2px; text-align: right; }
            .a5-value { margin-bottom: 2px; }
            .a5-delivery { border: 1px solid #000; border-radius: 6px; background: #fff; padding: 6px; margin-top: 8px; min-width: 220px; }
            .a5-footer { display: flex; gap: 8px; margin-top: 8px; }
            .a5-total { flex: 2.2; text-align: left; font-weight: bold; font-size: 1.1em; }
            .a5-notes { flex: 1.2; text-align: right; font-size: 0.95em; }
          </style>
        </head>
        <body>
          <div class="a5-container">
            <div class="a5-header">
              <div class="a5-logo">
                <img src="/favicon.svg" alt="Logo" style="height:32px;" />
                <div>07700130637</div>
              </div>
              <div class="a5-barcode">
                <img src="https://barcode.tec-it.com/barcode.ashx?data=${order.orderNumber}&code=Code128&translate-esc=true" alt="barcode" />
                <div>${order.orderNumber}</div>
              </div>
              <div class="a5-storeinfo">
                <div>Mini Store</div>
                <div class="a5-date">التاريخ: ${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ${new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
              </div>
            </div>
            <div class="a5-main">
              <div class="a5-products">
                <div class="a5-label">المنتجات</div>
                <table class="a5-products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم المنتج</th>
                      <th>الكمية</th>
                      <th>وحدة السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map((item: OrderItem, idx: number) => `
                      <tr>
                        <td>${idx + 1}</td>
                        <td>${item.product.name}</td>
                        <td>X${item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div style="text-align:left; margin-top:4px;">المجموع: ${order.totalAmount.toFixed(2)}</div>
              </div>
              <div class="a5-recipient">
                <div class="a5-label">المستلم</div>
                <div class="a5-value"><b>${order.customerInfo.firstName} ${order.customerInfo.lastName || ''}</b></div>
                <div class="a5-value">${order.customerInfo.mobile}</div>
                <div class="a5-value">${order.customerInfo.mobile}</div>
                <div class="a5-value">${order.shippingAddress.city}</div>
                <div class="a5-value">mystore</div>
                <div class="a5-value">Mini Store</div>
              </div>
            </div>
            <div class="a5-main">
              <div class="a5-delivery">
                <div class="a5-label">معلومات التوصيل</div>
                <div class="a5-value">شركة التوصيل</div>
                <div class="a5-value">المجموع<br/>${order.totalAmount.toFixed(1)}</div>
              </div>
            </div>
            <div class="a5-footer">
              <div class="a5-total">اسم المستلم والتوقيع:</div>
              <div class="a5-notes">ملاحظات<br/>تسليم يوم الاربعاء</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Helper: A4, 4x6 templates (simple summary, can be customized)
  const summaryTemplate = (orders: Order[]) => `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orders Summary</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order { margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { text-align: right; font-weight: bold; margin-top: 10px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Orders Summary</h1>
            <p>Generated on ${format(new Date(), 'PPP')}</p>
          </div>
          ${orders.map((order: Order) => `
            <div class="order">
              <h2>Order #${order.orderNumber}</h2>
              <p>Date: ${format(new Date(order.createdAt), 'PPP')}</p>
              <div class="section">
                <h3>Customer Information</h3>
                <p>Name: ${order.customerInfo.firstName} ${order.customerInfo.lastName}</p>
                <p>Email: ${order.customerInfo.email}</p>
                <p>Phone: ${order.customerInfo.mobile}</p>
              </div>
              <div class="section">
                <h3>Shipping Address</h3>
                <p>${order.shippingAddress.street}</p>
                <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                <p>${order.shippingAddress.country}</p>
              </div>
              <div class="section">
                <h3>Order Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map((item: OrderItem) => `
                      <tr>
                        <td>${item.product.name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatPrice(item.price, currency)}</td>
                        <td>${formatPrice(item.price * item.quantity, currency)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="total">
                  Total: ${formatPrice(order.totalAmount, currency)}
                </div>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    let printContent = '';
    if (waybillSize === '10x10') {
      // Print each order as a separate 10x10 waybill page
      printContent = orders.map(order => waybill10x10(order)).join('<div style="page-break-after:always"></div>');
    } else if (waybillSize === 'A5') {
      // Print each order as a separate A5 waybill page
      printContent = orders.map(order => waybillA5(order)).join('<div style="page-break-after:always"></div>');
    } else if (waybillSize === '10x15') {
      // Print each order as a separate 10x15 waybill page
      printContent = orders.map(order => waybill10x15(order)).join('<div style="page-break-after:always"></div>');
    } else {
      // Use summary template for other sizes (customize as needed)
      printContent = summaryTemplate(orders);
    }

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    setSelectedOrders(prev => 
      prev.length === filteredOrders.length
        ? []
        : filteredOrders.map(order => order._id)
    );
  };

  const filteredOrders = orders.filter(order => {
    // Search filter
    const searchMatch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;

    // Payment filter
    const paymentMatch = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    // Date filter
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    let dateMatch = true;

    switch (dateFilter) {
      case 'today':
        dateMatch = orderDate.toDateString() === now.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateMatch = orderDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateMatch = orderDate >= monthAgo;
        break;
    }

    return searchMatch && statusMatch && paymentMatch && dateMatch;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'amount-asc':
        return a.totalAmount - b.totalAmount;
      case 'amount-desc':
        return b.totalAmount - a.totalAmount;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (

    <div className="space-y-6">
      {/* Header Row: Title left, actions right */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
          {/* Waybill size and actions always visible, as in screenshot */}
          <div className="flex items-center gap-2 md:mr-4 justify-end">
            <label htmlFor="waybill-size-bulk" className="font-medium">Waybill Size:</label>
            <select
              id="waybill-size-bulk"
              value={waybillSize}
              onChange={e => setWaybillSize(e.target.value as 'A4' | 'A5' | '4x6' | '10x10' | '10x15')}
              className="border rounded px-2 py-1"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="4x6">4x6" (4 × 6 in)</option>
              <option value="10x10">10x10" (10 × 10 in)</option>
              <option value="10x15">10x15" (10 × 15 in)</option>
            </select>
          </div>
          <button
            onClick={() => handlePrintOrders(
              orders.filter(order => selectedOrders.includes(order._id))
            )}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={selectedOrders.length === 0}
          >
            <Package className="w-5 h-5" />
            Print Selected ({selectedOrders.length})
          </button>
          <button
            onClick={() => handleSendToDelivery(
              orders.filter(order => selectedOrders.includes(order._id))
            )}
            className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            disabled={selectedOrders.length === 0}
          >
            <Truck className="w-5 h-5" />
            Send to Delivery
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            Create Order
          </button>
        </div>
      </div>

      {/* Filters Row: all filters in a single row, as in screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length}
                      onChange={toggleAllOrders}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </label>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => toggleOrderSelection(order._id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-indigo-600">
                      #{order.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {order.customerInfo.firstName} {order.customerInfo.lastName}
                      </p>
                      <p className="text-gray-500">{order.customerInfo.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(order.totalAmount, currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'shipped'
                        ? 'bg-indigo-100 text-indigo-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.deliveryStatus ? (
                      <div className="text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.deliveryStatus === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.deliveryStatus === 'in_transit'
                            ? 'bg-blue-100 text-blue-800'
                            : order.deliveryStatus === 'out_for_delivery'
                            ? 'bg-indigo-100 text-indigo-800'
                            : order.deliveryStatus === 'delivery_failed'
                            ? 'bg-red-100 text-red-800'
                            : order.deliveryStatus === 'assigned'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.deliveryStatus.replace('_', ' ')}
                        </span>
                        {order.deliveryTrackingNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            {order.deliveryTrackingNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.paymentStatus === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View order details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handlePrintOrders([order])}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Print order"
                      >
                        <Package className="w-5 h-5" />
                      </button>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleSendToDelivery([order])}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Send to delivery"
                        >
                          <Truck className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          order={{
            ...selectedOrder,
            currency: selectedOrder.currency || currency
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Add Order Modal */}
      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (orderData) => {
          try {
            await api.postWithRetry('/orders', orderData);
            toast.success('Order created successfully');
            fetchOrders();
            setIsAddModalOpen(false);
          } catch (error) {
            toast.error('Failed to create order');
          }
        }}
      />

      {/* Delivery Assignment Modal */}
      {selectedOrder && (
        <DeliveryAssignmentModal
          isOpen={isDeliveryModalOpen}
          onClose={() => {
            setIsDeliveryModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSuccess={handleDeliveryAssignmentSuccess}
        />
      )}
    </div>
  );
}