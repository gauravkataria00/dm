import MainLayout from "../components/layout/MainLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getClients,
  getMilkEntries,
  getSettlements,
  getPayments,
  getAdvances,
  getClientPaymentSummary,
  getConsumers,
  getConsumerSales,
  getConsumerPayments,
  getTodayInventory
} from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalClients: 0,
      activeClients: 0,
      totalMilkToday: 0,
      totalMilkThisMonth: 0,
      totalRevenueToday: 0,
      totalRevenueThisMonth: 0,
      pendingSettlements: 0,
      activeAdvances: 0,
      totalOutstanding: 0,
      totalConsumers: 0,
      totalConsumerSalesToday: 0,
      totalConsumerSalesThisMonth: 0,
      totalConsumerRevenueToday: 0,
      totalConsumerRevenueThisMonth: 0,
      currentInventory: 0
    },
    recentActivities: [],
    topClients: [],
    monthlyTrends: [],
    financialSummary: {
      totalEarned: 0,
      totalPaid: 0,
      netBalance: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      console.log("Starting dashboard data load...");

      // Load all required data in parallel with better error handling
      let clients = [];
      let milkEntries = [];
      let settlements = [];
      let payments = [];
      let advances = [];
      let consumers = [];
      let consumerSales = [];
      let consumerPayments = [];
      let todayInventory = {};

      try {
        clients = await getClients();
        console.log("Clients loaded:", clients.length);
      } catch (err) {
        console.warn("Failed to load clients:", err);
        clients = [];
      }

      try {
        milkEntries = await getMilkEntries();
        console.log("Milk entries loaded:", milkEntries.length);
      } catch (err) {
        console.warn("Failed to load milk entries:", err);
        milkEntries = [];
      }

      try {
        settlements = await getSettlements();
        console.log("Settlements loaded:", settlements.length);
      } catch (err) {
        console.warn("Failed to load settlements:", err);
        settlements = [];
      }

      try {
        payments = await getPayments();
        console.log("Payments loaded:", payments.length);
      } catch (err) {
        console.warn("Failed to load payments:", err);
        payments = [];
      }

      try {
        advances = await getAdvances();
        console.log("Advances loaded:", advances.length);
      } catch (err) {
        console.warn("Failed to load advances:", err);
        advances = [];
      }

      try {
        consumers = await getConsumers();
        console.log("Consumers loaded:", consumers.length);
      } catch (err) {
        console.warn("Failed to load consumers:", err);
        consumers = [];
      }

      try {
        consumerSales = await getConsumerSales();
        console.log("Consumer sales loaded:", consumerSales.length);
      } catch (err) {
        console.warn("Failed to load consumer sales:", err);
        consumerSales = [];
      }

      try {
        consumerPayments = await getConsumerPayments();
        console.log("Consumer payments loaded:", consumerPayments.length);
      } catch (err) {
        console.warn("Failed to load consumer payments:", err);
        consumerPayments = [];
      }

      try {
        todayInventory = await getTodayInventory();
        console.log("Today inventory loaded:", todayInventory);
      } catch (err) {
        console.warn("Failed to load today inventory:", err);
        todayInventory = {};
      }

      console.log("All data loaded successfully");

      // Calculate today's date and this month
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = today.substring(0, 7); // YYYY-MM format

      // Filter data for today and this month
      const todayEntries = milkEntries.filter(entry =>
        entry.createdAt && entry.createdAt.startsWith(today)
      );
      const thisMonthEntries = milkEntries.filter(entry =>
        entry.createdAt && entry.createdAt.startsWith(thisMonth)
      );

      const todayConsumerSales = consumerSales.filter(sale =>
        sale.sale_date === today
      );
      const thisMonthConsumerSales = consumerSales.filter(sale =>
        sale.sale_date && sale.sale_date.startsWith(thisMonth)
      );

      // Calculate basic stats
      const stats = {
        totalClients: clients.length,
        activeClients: clients.filter(client =>
          milkEntries.some(entry => entry.clientId === client.id)
        ).length,
        totalMilkToday: todayEntries.reduce((sum, entry) => sum + (entry.litres || 0), 0),
        totalMilkThisMonth: thisMonthEntries.reduce((sum, entry) => sum + (entry.litres || 0), 0),
        totalRevenueToday: todayEntries.reduce((sum, entry) => sum + (entry.total || 0), 0),
        totalRevenueThisMonth: thisMonthEntries.reduce((sum, entry) => sum + (entry.total || 0), 0),
        pendingSettlements: settlements.filter(s => s.status === 'pending').length,
        activeAdvances: advances.filter(a => a.status === 'active').length,
        totalOutstanding: 0, // Will calculate below
        totalConsumers: consumers.length,
        totalConsumerSalesToday: todayConsumerSales.reduce((sum, sale) => sum + (sale.litres || 0), 0),
        totalConsumerSalesThisMonth: thisMonthConsumerSales.reduce((sum, sale) => sum + (sale.litres || 0), 0),
        totalConsumerRevenueToday: todayConsumerSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        totalConsumerRevenueThisMonth: thisMonthConsumerSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        currentInventory: todayInventory.cow || 0
      };

      // Calculate financial summary
      const totalEarned = stats.totalRevenueThisMonth + stats.totalConsumerRevenueThisMonth;
      const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalAdvancesGiven = advances.reduce((sum, advance) => sum + (advance.amount || 0), 0);
      const netBalance = totalEarned - totalPaid - totalAdvancesGiven;

      const financialSummary = {
        totalEarned,
        totalPaid,
        totalAdvancesGiven,
        netBalance
      };

      // Calculate outstanding balance
      stats.totalOutstanding = netBalance;

      // Generate recent activities
      const recentActivities = generateRecentActivities(
        milkEntries, settlements, payments, advances, clients, consumerSales, consumerPayments, consumers
      );

      // Calculate top clients
      const topClients = calculateTopClients(thisMonthEntries, clients);

      // Generate monthly trends
      const monthlyTrends = generateMonthlyTrends(milkEntries);

      console.log("Dashboard data calculated successfully");

      setDashboardData({
        stats,
        recentActivities,
        topClients,
        monthlyTrends,
        financialSummary
      });

      console.log("Dashboard loaded successfully!");

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Don't set error state - show dashboard with empty data instead
      setDashboardData({
        stats: {
          totalClients: 0,
          activeClients: 0,
          totalMilkToday: 0,
          totalMilkThisMonth: 0,
          totalRevenueToday: 0,
          totalRevenueThisMonth: 0,
          pendingSettlements: 0,
          activeAdvances: 0,
          totalOutstanding: 0,
          totalConsumers: 0,
          totalConsumerSalesToday: 0,
          totalConsumerSalesThisMonth: 0,
          totalConsumerRevenueToday: 0,
          totalConsumerRevenueThisMonth: 0,
          currentInventory: 0
        },
        recentActivities: [],
        topClients: [],
        monthlyTrends: generateMonthlyTrends([]),
        financialSummary: {
          totalEarned: 0,
          totalPaid: 0,
          totalAdvancesGiven: 0,
          netBalance: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (milkEntries, settlements, payments, advances, clients, consumerSales, consumerPayments, consumers) => {
    const activities = [];

    // Add recent milk entries
    milkEntries.slice(-5).forEach(entry => {
      const client = clients.find(c => c.id === entry.clientId);
      activities.push({
        id: `milk-${entry.id}`,
        type: 'milk_entry',
        title: `Milk entry added`,
        subtitle: `${entry.litres}L ${entry.type} milk from ${client?.name || 'Unknown'}`,
        amount: `₹${entry.total}`,
        time: formatTimeAgo(entry.createdAt),
        icon: '🥛',
        color: 'bg-blue-100 text-blue-600'
      });
    });

    // Add recent settlements
    settlements.slice(-3).forEach(settlement => {
      const client = clients.find(c => c.id === settlement.clientId);
      activities.push({
        id: `settlement-${settlement.id}`,
        type: 'settlement',
        title: `Settlement ${settlement.status}`,
        subtitle: `${settlement.startDate} to ${settlement.endDate} for ${client?.name || 'Unknown'}`,
        amount: `₹${settlement.totalAmount}`,
        time: formatTimeAgo(settlement.createdAt),
        icon: '💰',
        color: settlement.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
      });
    });

    // Add recent consumer sales
    consumerSales.slice(-3).forEach(sale => {
      const consumer = consumers.find(c => c.id === sale.consumerId);
      activities.push({
        id: `consumer-sale-${sale.id}`,
        type: 'consumer_sale',
        title: `Consumer sale recorded`,
        subtitle: `${sale.litres}L milk sold to ${consumer?.name || 'Unknown'}`,
        amount: `₹${sale.total}`,
        time: formatTimeAgo(sale.createdAt),
        icon: '🛒',
        color: 'bg-orange-100 text-orange-600'
      });
    });

    // Add recent consumer payments
    consumerPayments.slice(-3).forEach(payment => {
      const consumer = consumers.find(c => c.id === payment.consumerId);
      activities.push({
        id: `consumer-payment-${payment.id}`,
        type: 'consumer_payment',
        title: `Consumer payment received`,
        subtitle: `Payment from ${consumer?.name || 'Unknown'}`,
        amount: `₹${payment.amount}`,
        time: formatTimeAgo(payment.createdAt),
        icon: '💸',
        color: 'bg-green-100 text-green-600'
      });
    });

    // Sort by time (most recent first) and take top 10
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  };

  const calculateTopClients = (monthEntries, clients) => {
    const clientRevenue = {};

    monthEntries.forEach(entry => {
      if (!clientRevenue[entry.clientId]) {
        clientRevenue[entry.clientId] = 0;
      }
      clientRevenue[entry.clientId] += entry.total;
    });

    return Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id === parseInt(clientId));
        return {
          name: client?.name || 'Unknown',
          revenue,
          percentage: 0 // Will be calculated below
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((client, index, array) => ({
        ...client,
        percentage: array[0].revenue > 0 ? (client.revenue / array[0].revenue) * 100 : 0
      }));
  };

  const generateMonthlyTrends = (milkEntries) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
    }

    return last7Days.map(date => {
      const dayEntries = milkEntries.filter(entry =>
        entry.createdAt.startsWith(date)
      );
      const totalLitres = dayEntries.reduce((sum, entry) => sum + entry.litres, 0);
      const totalRevenue = dayEntries.reduce((sum, entry) => sum + entry.total, 0);

      return {
        date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        litres: totalLitres,
        revenue: totalRevenue
      };
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { stats, recentActivities, topClients, monthlyTrends, financialSummary } = dashboardData;

  return (
    <MainLayout>
      <div className="px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏪 Dairy Analytics Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back! Here's your comprehensive dairy farm overview for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <MetricCard
          title="Total Clients"
          value={stats.totalClients}
          subtitle={`${stats.activeClients} active this month`}
          icon="👥"
          color="from-blue-500 to-blue-600"
          trend="+12%"
        />
        <MetricCard
          title="Today's Milk"
          value={`${stats.totalMilkToday.toFixed(1)}L`}
          subtitle={`${stats.totalRevenueToday.toFixed(0)} revenue`}
          icon="🥛"
          color="from-green-500 to-green-600"
          trend="+8%"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`₹${stats.totalRevenueThisMonth.toFixed(0)}`}
          subtitle={`${stats.totalMilkThisMonth.toFixed(1)}L milk collected`}
          icon="💰"
          color="from-purple-500 to-purple-600"
          trend="+15%"
        />
        <MetricCard
          title="Outstanding Balance"
          value={`₹${financialSummary.netBalance.toFixed(0)}`}
          subtitle={`${stats.pendingSettlements} pending settlements`}
          icon="📊"
          color={financialSummary.netBalance >= 0 ? "from-orange-500 to-orange-600" : "from-red-500 to-red-600"}
          trend={financialSummary.netBalance >= 0 ? "Positive" : "Negative"}
        />
      </div>

      {/* Consumer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <MetricCard
          title="Total Consumers"
          value={stats.totalConsumers}
          subtitle="Registered customers"
          icon="🛒"
          color="from-indigo-500 to-indigo-600"
          trend="+5%"
        />
        <MetricCard
          title="Today's Sales"
          value={`${stats.totalConsumerSalesToday.toFixed(1)}L`}
          subtitle={`${stats.totalConsumerRevenueToday.toFixed(0)} revenue`}
          icon="🛍️"
          color="from-teal-500 to-teal-600"
          trend="+10%"
        />
        <MetricCard
          title="Monthly Consumer Revenue"
          value={`₹${stats.totalConsumerRevenueThisMonth.toFixed(0)}`}
          subtitle={`${stats.totalConsumerSalesThisMonth.toFixed(1)}L sold`}
          icon="💸"
          color="from-cyan-500 to-cyan-600"
          trend="+18%"
        />
        <MetricCard
          title="Current Inventory"
          value={`${stats.currentInventory.toFixed(1)}L`}
          subtitle="Available stock"
          icon="📦"
          color={stats.currentInventory > 50 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"}
          trend={stats.currentInventory > 50 ? "Good" : "Low"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Financial Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-2xl mr-3">💼</span>
              Financial Overview
            </h3>
            <div className="space-y-5">
              <FinancialItem
                label="Total Earned"
                value={financialSummary.totalEarned}
                color="text-green-600"
              />
              <FinancialItem
                label="Total Paid"
                value={financialSummary.totalPaid}
                color="text-blue-600"
              />
              <FinancialItem
                label="Advances Given"
                value={financialSummary.totalAdvancesGiven}
                color="text-orange-600"
              />
              <hr className="my-4" />
              <FinancialItem
                label="Net Balance"
                value={Math.abs(financialSummary.netBalance)}
                color={financialSummary.netBalance >= 0 ? "text-green-600" : "text-red-600"}
                prefix={financialSummary.netBalance >= 0 ? "+" : "-"}
              />
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-2xl mr-3">📈</span>
              Last 7 Days Trend
            </h3>
            <div className="h-64 flex items-end justify-between space-x-3">
              {monthlyTrends.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t h-32 relative mb-3">
                    <div
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t absolute bottom-0 w-full transition-all duration-500"
                      style={{
                        height: `${day.litres > 0 ? Math.max((day.litres / Math.max(...monthlyTrends.map(d => d.litres))) * 100, 5) : 0}%`
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">
                        {day.litres.toFixed(1)}L
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">{day.date}</div>
                  <div className="text-xs text-gray-500">₹{day.revenue.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-2xl mr-3">🏆</span>
            Top Clients This Month
          </h3>
          <div className="space-y-4">
            {topClients.length > 0 ? topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">₹{client.revenue.toFixed(0)} revenue</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${client.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{client.percentage.toFixed(0)}%</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📊</div>
                <p>No client data available for this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-2xl mr-3">⚡</span>
            Recent Activities
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${activity.color}`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <span className="text-sm font-bold text-gray-900">{activity.amount}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{activity.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-2">{activity.time}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📋</div>
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <span className="text-2xl mr-3">🚀</span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ActionButton
            icon="🥛"
            title="Add Milk Entry"
            onClick={() => navigate('/add-milk')}
            color="bg-white/20 hover:bg-white/30"
          />
          <ActionButton
            icon="💰"
            title="Create Settlement"
            onClick={() => navigate('/settlements')}
            color="bg-white/20 hover:bg-white/30"
          />
          <ActionButton
            icon="💳"
            title="Record Payment"
            onClick={() => navigate('/payments')}
            color="bg-white/20 hover:bg-white/30"
          />
          <ActionButton
            icon="💵"
            title="Give Advance"
            onClick={() => navigate('/advances')}
            color="bg-white/20 hover:bg-white/30"
          />
        </div>
      </div>
      </div>
    </MainLayout>
  );
}

// Reusable Components
const MetricCard = ({ title, value, subtitle, icon, color, trend }) => (
  <div className={`bg-gradient-to-br ${color} text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
    <div className="flex justify-between items-start mb-6">
      <div className="flex-1">
        <p className="text-white/80 text-sm font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold leading-tight">{value}</p>
      </div>
      <div className="text-5xl opacity-80 ml-4">{icon}</div>
    </div>
    <div className="flex justify-between items-center">
      <p className="text-white/70 text-sm flex-1">{subtitle}</p>
      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium ml-4">
        {trend}
      </span>
    </div>
  </div>
);

const FinancialItem = ({ label, value, color, prefix = "" }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}</span>
    <span className={`font-bold ${color}`}>{prefix}₹{value.toFixed(0)}</span>
  </div>
);

const ActionButton = ({ icon, title, onClick, color }) => (
  <button
    onClick={onClick}
    className={`${color} p-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex flex-col items-center space-y-2`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-sm font-medium text-center">{title}</span>
  </button>
);