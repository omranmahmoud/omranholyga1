import { useState, useEffect } from 'react';
import { Users, ShoppingBag, CreditCard, TrendingUp, Package, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';
import { useRealTimeDashboard } from '../../hooks/useRealTimeDashboard';
import { RealTimeDemo } from './RealTimeDemo';

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customerInfo: {
    firstName: string;
    lastName: string;
  };
  items: Array<{
    product: {
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
}

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  activeUsers: number;
  growth: number;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function Dashboard() {
  const [timeRange, setTimeRange] = useState('7');
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    activeUsers: 0,
    growth: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrency();
  
  // Real-time dashboard integration
  const {
    dashboardData,
    updateDashboardData
  } = useRealTimeDashboard();

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Update local state when real-time data changes
  useEffect(() => {
    if (dashboardData.stats.totalSales > 0) {
      setStats(dashboardData.stats);
    }
    if (dashboardData.recentOrders.length > 0) {
      setRecentOrders(dashboardData.recentOrders);
    }
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      // Use getWithRetry for better error handling
      const ordersResponse = await api.getWithRetry('/orders/all');
      const orders = ordersResponse.data;

      // Calculate stats
      const totalSales = orders.reduce((sum: number, order: Order) => sum + order.totalAmount, 0);
      const growth = calculateGrowth(orders);

      // Calculate active users based on unique customers in recent orders
      const uniqueCustomers = new Set(orders.map(order => 
        order.customerInfo ? `${order.customerInfo.firstName}-${order.customerInfo.lastName}` : 'guest'
      ));
      const activeUsers = uniqueCustomers.size;

      const calculatedStats = {
        totalSales,
        totalOrders: orders.length,
        activeUsers,
        growth
      };

      setStats(calculatedStats);
      setRecentOrders(orders.slice(0, 5));

      // Update real-time dashboard with initial data
      updateDashboardData({
        stats: calculatedStats,
        recentOrders: orders.slice(0, 5)
      });
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (orders: Order[]) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) >= thirtyDaysAgo
    );

    const previousOrders = orders.filter(order => 
      new Date(order.createdAt) < thirtyDaysAgo
    );

    if (previousOrders.length === 0) return 0;

    const recentTotal = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const previousTotal = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return ((recentTotal - previousTotal) / previousTotal) * 100;
  };

  // Generate real sales data from orders
  const generateSalesData = (orders: Order[]) => {
    const salesByMonth: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = monthNames[date.getMonth()];
      salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + order.totalAmount;
    });

    // Get last 7 months of data
    const currentMonth = new Date().getMonth();
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = monthNames[monthIndex];
      salesData.push({
        name: monthName,
        amount: Math.round(salesByMonth[monthName] || 0)
      });
    }
    
    return salesData;
  };

  // Generate real category data from orders
  const generateCategoryData = (orders: Order[]) => {
    const categoryRevenue: { [key: string]: number } = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product) {
          // Extract category from product name or use a default categorization
          let category = 'Other';
          const productName = item.product.name.toLowerCase();
          
          if (productName.includes('shirt') || productName.includes('dress') || productName.includes('clothing')) {
            category = productName.includes('women') || productName.includes('female') ? 'Women' : 'Men';
          } else if (productName.includes('shoe') || productName.includes('boot') || productName.includes('sneaker')) {
            category = 'Shoes';
          } else if (productName.includes('bag') || productName.includes('watch') || productName.includes('accessory')) {
            category = 'Accessories';
          } else if (productName.includes('headphone') || productName.includes('electronic')) {
            category = 'Electronics';
          }
          
          categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.quantity * item.price);
        }
      });
    });

    return Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value: Math.round(value)
    })).sort((a, b) => b.value - a.value);
  };

  const salesData = generateSalesData(recentOrders);
  const categoryData = generateCategoryData(recentOrders);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          
          {/* Live indicator */}
          {dashboardData.connectionStatus === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
          )}
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Real-time Demo Controls */}
      <RealTimeDemo />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {formatPrice(stats.totalSales, currency)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-green-600">+12.5%</span>
            <span className="text-sm text-gray-600 ml-2">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {stats.activeUsers.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-green-600">+5.2%</span>
            <span className="text-sm text-gray-600 ml-2">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {stats.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-green-600">+8.1%</span>
            <span className="text-sm text-gray-600 ml-2">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Growth</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {(typeof stats.growth === 'number' ? stats.growth : 0).toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-green-600">+2.4%</span>
            <span className="text-sm text-gray-600 ml-2">vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales by Category</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Overview</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    #{order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customerInfo.firstName} {order.customerInfo.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(order.totalAmount, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}