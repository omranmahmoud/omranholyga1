import React, { useState } from 'react';
import { OrderHeader } from './Order/OrderHeader';
import { OrderDetails } from './Order/OrderDetails';
import { OrderItems } from './Order/OrderItems';
import { OrderStatus } from './Order/OrderStatus';
import { useStore } from '../../context/StoreContext';

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
  currency: string;
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
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onUpdateStatus: (orderId: string, status: string) => void;
}

export function OrderModal({ isOpen, onClose, order, onUpdateStatus }: OrderModalProps) {
  // Waybill size state
  const [waybillSize, setWaybillSize] = useState<'A4' | 'A5' | '4x6' | '10x10'>('A4');
  const { settings } = useStore();

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Page size and layout CSS for different waybill sizes
    let pageSizeCSS = '';
    let bodyPadding = '20px';
    let fontSize = '16px';
    let headerFontSize = '24px';
    let tableFontSize = '15px';
    let sectionMargin = '20px';
    if (waybillSize === 'A4') {
      pageSizeCSS = '@page { size: A4; margin: 10mm; }';
      bodyPadding = '20px';
      fontSize = '16px';
      headerFontSize = '24px';
      tableFontSize = '15px';
      sectionMargin = '20px';
    } else if (waybillSize === 'A5') {
      pageSizeCSS = '@page { size: A5; margin: 8mm; }';
      bodyPadding = '10px';
      fontSize = '13px';
      headerFontSize = '18px';
      tableFontSize = '12px';
      sectionMargin = '12px';
    } else if (waybillSize === '4x6') {
      pageSizeCSS = '@page { size: 4in 6in; margin: 5mm; }';
      bodyPadding = '4mm';
      fontSize = '11px';
      headerFontSize = '14px';
      tableFontSize = '10px';
      sectionMargin = '6px';
    } else if (waybillSize === '10x10') {
  pageSizeCSS = '@page { size: 10cm 10cm; margin: 0; }';
  bodyPadding = '0';
  fontSize = '16px';
  headerFontSize = '20px';
  tableFontSize = '14px';
  sectionMargin = '0';
    }

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>Waybill #${order.orderNumber}</title>
          <style>
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
                ${settings?.logo ? `<img src="${settings.logo}" alt="Logo" />` : '<b>Mini Store</b>'}
                <div style="font-size:0.9em; font-weight:bold;">${order.customerInfo.mobile}</div>
              </div>
            </div>
            <div class="waybill-main">
              <div class="waybill-products waybill-box">
                <div class="waybill-label">المنتجات / Products</div>
                <table class="waybill-products-table">
                  <tbody>
                    ${order.items.map(item => `
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
                <div class="waybill-value">${settings?.name || 'Mini Store'} :المرسل</div>
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

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full p-6">
          {/* Waybill size selection */}
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="waybill-size" className="font-medium">Waybill Size:</label>
            <select
              id="waybill-size"
              value={waybillSize}
              onChange={e => setWaybillSize(e.target.value as 'A4' | 'A5' | '4x6' | '10x10')}
              className="border rounded px-2 py-1"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="4x6">4x6" (4 × 6 in)</option>
              <option value="10x10">10x10" (10 × 10 in)</option>
            </select>
          </div>
          <OrderHeader
            orderNumber={order.orderNumber}
            createdAt={order.createdAt}
            onClose={onClose}
            onPrint={handlePrint}
          />

          <OrderDetails
            orderNumber={order.orderNumber}
            createdAt={order.createdAt}
            customerInfo={order.customerInfo}
            shippingAddress={order.shippingAddress}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
          />

          <OrderItems
            items={order.items}
            totalAmount={order.totalAmount}
            currency={order.currency}
          />

          <OrderStatus
            currentStatus={order.status}
            onStatusChange={(status) => onUpdateStatus(order._id, status)}
            statusOptions={statusOptions}
            statusColors={statusColors}
          />
        </div>
      </div>
    </div>
  );
                      {/* Waybill size selection */}
                      <div className="mb-4 flex items-center gap-3">
                        <label htmlFor="waybill-size" className="font-medium">Waybill Size:</label>
                        <select
                          id="waybill-size"
                          value={waybillSize}
                          onChange={e => setWaybillSize(e.target.value as 'A4' | 'A5' | '4x6')}
                          className="border rounded px-2 py-1"
                        >
                          <option value="A4">A4 (210 × 297 mm)</option>
                          <option value="A5">A5 (148 × 210 mm)</option>
                          <option value="4x6">4x6" (4 × 6 in)</option>
                        </select>
                      </div>
}