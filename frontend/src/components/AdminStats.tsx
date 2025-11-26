import { Order, StatsCardProps, AdminStatsProps } from "@/types/index";
import { Card } from "@/components/ui/card";
import { ShoppingBag, DollarSign, TrendingUp, Users, Package, BarChart } from "lucide-react";

const StatsCard = ({ title, value, icon, className = "" }: StatsCardProps) => (
  <Card className={`p-4 md:p-5 hover:shadow-xl transition-all duration-300 shadow-lg border border-orange-100/50 rounded-2xl bg-white hover:-translate-y-1 group ${className}`}>
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-grow">
        <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 break-words font-heading">{value}</p>
      </div>
      <div className="ml-3 bg-orange-50 p-3 rounded-xl shrink-0 group-hover:bg-orange-100 transition-colors">
        {icon}
      </div>
    </div>
  </Card>
);

export default function AdminStats({ orders }: AdminStatsProps) {
  // Calculate total revenue
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  // Format currency values to be more compact
  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  // Calculate average order value
  const averageOrderValue = orders.length > 0
    ? totalRevenue / orders.length
    : 0;

  // Count orders by status
  const ordersByStatus = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate most popular items
  const itemPopularity = orders.reduce((acc, order) => {
    order.items.forEach((item) => {
      const itemName = item.name;
      acc[itemName] = (acc[itemName] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  // Get top 3 items
  const topItems = Object.entries(itemPopularity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Orders today
  const today = new Date().toISOString().split('T')[0];
  const ordersToday = orders.filter(
    (order) => order.createdAt.split('T')[0] === today
  ).length;

  // Get orders by day of week
  const ordersByDayOfWeek = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate revenue trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  const revenueByDay = last7Days.reduce((acc, day) => {
    acc[day] = orders
      .filter(order => order.createdAt.split('T')[0] === day)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate delivery performance (% of orders delivered on time)
  const deliveredOrders = orders.filter(order => order.status === "delivered").length;
  const completionRate = orders.length > 0
    ? Math.round((deliveredOrders / orders.length) * 100)
    : 0;

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-gray-800">Dashboard Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatsCard
          title="Total Orders"
          value={orders.length}
          icon={<ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" />}
        />
        <StatsCard
          title="Orders Today"
          value={ordersToday}
          icon={<Package className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />}
        />
        <StatsCard
          title="Avg. Order Value"
          value={formatCurrency(averageOrderValue)}
          icon={<TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="p-4 md:p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-orange-100 rounded-md mr-2 md:mr-3">
              <BarChart className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-700">Orders by Status</h3>
          </div>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mr-2 ${status === 'pending' ? 'bg-yellow-400' :
                    status === 'preparing' ? 'bg-blue-400' :
                      status === 'ready' ? 'bg-purple-400' :
                        status === 'delivered' ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                  <span className="capitalize text-gray-700">{status}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-orange-100 rounded-md mr-2 md:mr-3">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-700">Most Popular Items</h3>
          </div>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            {topItems.length > 0 ? (
              topItems.map(([name, count], index) => (
                <div key={name} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xxs md:text-xs font-medium text-orange-600">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 truncate">{name}</span>
                  </div>
                  <span className="font-medium">{count} sold</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No items data available</p>
            )}
          </div>
        </Card>

        <Card className="p-4 md:p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-orange-100 rounded-md mr-2 md:mr-3">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-700">Performance Metrics</h3>
          </div>
          <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2.5">
                <div
                  className="bg-orange-600 h-1.5 md:h-2.5 rounded-full"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">Avg Order Value</span>
                <span className="font-medium">{formatCurrency(averageOrderValue)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2.5">
                <div
                  className="bg-green-500 h-1.5 md:h-2.5 rounded-full"
                  style={{ width: `${Math.min(averageOrderValue / 100 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card className="p-4 md:p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-orange-100 rounded-md mr-2 md:mr-3">
              <BarChart className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-700">Revenue by Day of Week</h3>
          </div>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            {Object.entries(ordersByDayOfWeek).length > 0 ? (
              Object.entries(ordersByDayOfWeek).map(([day, amount]) => (
                <div key={day} className="flex justify-between items-center">
                  <span className="text-gray-700">{day}</span>
                  <span className="font-medium text-orange-600">{formatCurrency(amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </Card>

        <Card className="p-4 md:p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-orange-100 rounded-md mr-2 md:mr-3">
              <BarChart className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-700">Revenue Trend (Last 7 Days)</h3>
          </div>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            {Object.entries(revenueByDay).map(([day, amount]) => (
              <div key={day} className="flex justify-between items-center">
                <span className="text-gray-700">{day}</span>
                <span className="font-medium text-orange-600">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}