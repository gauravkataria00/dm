import MainLayout from "../components/layout/MainLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getClients,
  getMilkEntries,
  getSettlements,
  getPayments,
  getAdvances,
  getTodayInventory
} from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalClients: 0,
      activeClients: 0,
      totalMilkToday: 0,
      totalEntriesToday: 0,
      morningMilkToday: 0,
      eveningMilkToday: 0,
      totalMilkThisMonth: 0,
      totalRevenueToday: 0,
      totalRevenueThisMonth: 0,
      pendingSettlements: 0,
      activeAdvances: 0,
      totalOutstanding: 0,
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

  const getMilkRevenue = (entry) => {
    const litres = parseFloat(entry?.litres) || 0;
    const rate = parseFloat(entry?.rate) || 0;
    return litres * rate;
  };

  const getTimestamp = (item) => {
    const dateString = item?.createdAt || item?.date || item?.sale_date || 0;
    return new Date(dateString).getTime() || 0;
  };

  const sortLatest = (items, dateGetter = getTimestamp) =>
    [...items]
      .filter(Boolean)
      .sort((a, b) => dateGetter(b) - dateGetter(a));

  useEffect(() => {
    loadDashboardData();
    
    // Set up automatic refresh every 60 seconds
    const intervalId = setInterval(() => {
      loadDashboardData();
    }, 60000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const loadDashboardData = async () => {
    try {
      if (loading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      console.log("Starting dashboard data load...");

      const [
        clientsResult,
        milkEntriesResult,
        settlementsResult,
        paymentsResult,
        advancesResult,
        todayInventoryResult,
      ] = await Promise.allSettled([
        getClients(),
        getMilkEntries(),
        getSettlements(),
        getPayments(),
        getAdvances(),
        getTodayInventory(),
      ]);

      const clients = clientsResult.status === "fulfilled" ? clientsResult.value : [];
      const milkEntries = milkEntriesResult.status === "fulfilled" ? milkEntriesResult.value : [];
      const settlements = settlementsResult.status === "fulfilled" ? settlementsResult.value : [];
      const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
      const advances = advancesResult.status === "fulfilled" ? advancesResult.value : [];
      const todayInventory = todayInventoryResult.status === "fulfilled" ? todayInventoryResult.value : {};

      if (clientsResult.status !== "fulfilled") console.warn("Failed to load clients:", clientsResult.reason);
      if (milkEntriesResult.status !== "fulfilled") console.warn("Failed to load milk entries:", milkEntriesResult.reason);
      if (settlementsResult.status !== "fulfilled") console.warn("Failed to load settlements:", settlementsResult.reason);
      if (paymentsResult.status !== "fulfilled") console.warn("Failed to load payments:", paymentsResult.reason);
      if (advancesResult.status !== "fulfilled") console.warn("Failed to load advances:", advancesResult.reason);
      if (todayInventoryResult.status !== "fulfilled") console.warn("Failed to load today inventory:", todayInventoryResult.reason);

      console.log("Clients loaded:", clients.length);
      console.log("Milk entries loaded:", milkEntries.length);
      console.log("Settlements loaded:", settlements.length);
      console.log("Payments loaded:", payments.length);
      console.log("Advances loaded:", advances.length);
      console.log("Today inventory loaded:", todayInventory);

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

      // Calculate basic stats
      const stats = {
        totalClients: clients.length,
        activeClients: clients.filter(client =>
          milkEntries.some(entry => entry.clientId === client.id)
        ).length,
        totalMilkToday: todayEntries.reduce((sum, entry) => sum + (entry.litres || 0), 0),
        totalEntriesToday: todayEntries.length,
        morningMilkToday: todayEntries
          .filter(entry => entry.shift !== 'evening')
          .reduce((sum, entry) => sum + (entry.litres || 0), 0),
        eveningMilkToday: todayEntries
          .filter(entry => entry.shift === 'evening')
          .reduce((sum, entry) => sum + (entry.litres || 0), 0),
        totalMilkThisMonth: thisMonthEntries.reduce((sum, entry) => sum + (entry.litres || 0), 0),
        totalRevenueToday: todayEntries.reduce((sum, entry) => sum + getMilkRevenue(entry), 0),
        totalRevenueThisMonth: thisMonthEntries.reduce((sum, entry) => sum + getMilkRevenue(entry), 0),
        pendingSettlements: settlements.filter(s => s.status === 'pending').length,
        activeAdvances: advances.filter(a => a.status === 'active').length,
        totalOutstanding: 0, // Will calculate below
        currentInventory: todayInventory.cow || 0
      };

      // Calculate financial summary
      const totalEarned = stats.totalRevenueThisMonth;
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
        milkEntries, settlements, payments, advances, clients
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
          totalEntriesToday: 0,
          morningMilkToday: 0,
          eveningMilkToday: 0,
          totalMilkThisMonth: 0,
          totalRevenueToday: 0,
          totalRevenueThisMonth: 0,
          pendingSettlements: 0,
          activeAdvances: 0,
          totalOutstanding: 0,
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
      setIsRefreshing(false);
    }
  };

  const generateRecentActivities = (milkEntries, settlements, payments, advances, clients) => {
    const activities = [];

    const latestClients = sortLatest(clients).slice(0, 10);
    const latestMilkEntries = sortLatest(milkEntries).slice(0, 10);
    const latestPayments = sortLatest(payments, (p) => new Date(p.createdAt || p.date || 0).getTime()).slice(0, 10);
    const latestSettlements = sortLatest(settlements).slice(0, 10);

    // Add recent clients (new client additions)
    latestClients.forEach(client => {
      activities.push({
        id: `client-${client.id}`,
        type: 'client',
        title: 'New client added',
        subtitle: `Client "${client.name}" registered`,
        amount: '',
        timestamp: new Date(client.createdAt || client.dateAdded || Date.now()),
        icon: '👤',
        color: 'bg-purple-100 text-purple-600'
      });
    });

    // Add recent milk entries
    latestMilkEntries.forEach(entry => {
      const client = clients.find(c => c.id === entry.clientId);
      activities.push({
        id: `milk-${entry.id}`,
        type: 'milk_entry',
        title: 'Milk entry recorded',
        subtitle: `${entry.litres}L ${entry.type} milk from ${client?.name || 'Unknown'}`,
        amount: `₹${getMilkRevenue(entry).toFixed(0)}`,
        timestamp: new Date(getTimestamp(entry)),
        icon: '🥛',
        color: 'bg-blue-100 text-blue-600'
      });
    });

    // Add recent payments
    latestPayments.forEach(payment => {
      const client = clients.find(c => c.id === payment.clientId);
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: 'Payment received',
        subtitle: `Payment from ${client?.name || 'Unknown'}`,
        amount: `₹${parseFloat(payment.amount || 0).toFixed(0)}`,
        timestamp: new Date(getTimestamp(payment)),
        icon: '💰',
        color: 'bg-green-100 text-green-600'
      });
    });

    // Add recent settlements
    latestSettlements.forEach(settlement => {
      const client = clients.find(c => c.id === settlement.clientId);
      activities.push({
        id: `settlement-${settlement.id}`,
        type: 'settlement',
        title: `Settlement ${settlement.status}`,
        subtitle: `${settlement.startDate} to ${settlement.endDate} for ${client?.name || 'Unknown'}`,
        amount: `₹${parseFloat(settlement.totalAmount || 0).toFixed(0)}`,
        timestamp: new Date(getTimestamp(settlement)),
        icon: '📋',
        color: settlement.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
      });
    });

    // Sort by timestamp (most recent first) and take top 5
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(activity => ({
        ...activity,
        time: formatTimeAgo(activity.timestamp)
      }));
  };

  const calculateTopClients = (monthEntries, clients) => {
    const clientRevenue = {};

    monthEntries.forEach(entry => {
      if (!clientRevenue[entry.clientId]) {
        clientRevenue[entry.clientId] = 0;
      }
      clientRevenue[entry.clientId] += getMilkRevenue(entry);
    });

    return Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id == clientId);
        return {
          name: client?.name || 'Unknown Client',
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
      const totalRevenue = dayEntries.reduce((sum, entry) => sum + getMilkRevenue(entry), 0);

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
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-all duration-300">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { stats, recentActivities, topClients, monthlyTrends, financialSummary } = dashboardData;
  const isToday = selectedPeriod === "today";
  const periodLabel = isToday ? "Today" : "This Month";
  const periodMilk = isToday ? stats.totalMilkToday : stats.totalMilkThisMonth;
  const periodRevenue = isToday ? stats.totalRevenueToday : stats.totalRevenueThisMonth;
  const maxTrendLitres = Math.max(1, ...monthlyTrends.map((day) => day.litres || 0));

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300">
        {/* Header */}
        <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-2 transition-all duration-300">
              Dairy Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg transition-all duration-300">
              Welcome back! Here's your comprehensive dairy farm overview for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setSelectedPeriod("today")}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    isToday
                      ? "bg-green-600 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedPeriod("month")}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    !isToday
                      ? "bg-green-600 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Month
                </button>
              </div>
              <button
                onClick={loadDashboardData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard
          title="Total Clients"
          value={stats.totalClients}
          subtitle={`${stats.activeClients} active this month`}
          icon="👥"
          color="from-blue-500 to-blue-600"
          trend="+12%"
        />
        <MetricCard
          title={`${periodLabel} Milk`}
          value={`${periodMilk.toFixed(1)}L`}
          subtitle={`₹${periodRevenue.toFixed(0)} revenue`}
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

      {/* Inventory Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard
          title="Current Inventory"
          value={`${stats.currentInventory.toFixed(1)}L`}
          subtitle="Available stock"
          icon="📦"
          color={stats.currentInventory > 50 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"}
          trend={stats.currentInventory > 50 ? "Good" : "Low"}
        />
        <MetricCard
          title="Morning / Evening"
          value={`${stats.morningMilkToday.toFixed(1)} / ${stats.eveningMilkToday.toFixed(1)}L`}
          subtitle="Today shift split"
          icon="🌅"
          color="from-amber-500 to-orange-500"
          trend="Shift"
        />
        <MetricCard
          title="Today's Entries"
          value={stats.totalEntriesToday}
          subtitle="Milk records created"
          icon="🧾"
          color="from-cyan-500 to-cyan-600"
          trend="Live"
        />
        <MetricCard
          title="Active Advances"
          value={stats.activeAdvances}
          subtitle="Clients with active advance"
          icon="💵"
          color="from-indigo-500 to-indigo-600"
          trend="Track"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Financial Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
            <h3 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center transition-all duration-300">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
            <h3 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center transition-all duration-300">
              <span className="text-2xl mr-3">📈</span>
              Last 7 Days Trend
            </h3>
            <div className="h-64 flex items-end justify-between space-x-3">
              {monthlyTrends.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t h-32 relative mb-3">
                    <div
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t absolute bottom-0 w-full transition-all duration-500 flex items-end justify-center pb-2"
                      style={{
                        height: `${day.litres > 0 ? (day.litres / maxTrendLitres) * 100 : 0}%`
                      }}
                    >
                      <div className="text-xs font-bold text-white">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
          <h3 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center transition-all duration-300">
            <span className="text-2xl mr-3">🏆</span>
            Top Clients This Month
          </h3>
          <div className="space-y-4">
            {topClients.length > 0 ? topClients.map((client, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg overflow-hidden">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 break-words">{client.name}</div>
                    <div className="text-sm text-gray-500">₹{client.revenue.toFixed(0)} revenue</div>
                  </div>
                </div>
                <div className="text-right sm:text-right self-end sm:self-auto shrink-0 w-24">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(Number(client.percentage) || 0, 100))}%` }}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
          <h3 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center transition-all duration-300">
            <span className="text-2xl mr-3">⚡</span>
            Recent Activities
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${activity.color}`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-black dark:text-white transition-all duration-300">
                      {activity.title}
                    </p>
                    <span className="text-sm font-bold text-black dark:text-white transition-all duration-300">{activity.amount}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 transition-all duration-300">{activity.subtitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-all duration-300">{activity.time}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 transition-all duration-300">
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
            onClick={() => navigate('/reports')}
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
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-black/10 dark:ring-gray-700 hover:shadow-lg hover:ring-green-200 dark:hover:ring-green-300 transition-all duration-300 p-4 sm:p-6 relative flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 transition-all duration-300">
        {title}
      </h3>
      <div className="text-2xl sm:text-3xl opacity-25">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white transition-all duration-300">
        {value}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-all duration-300">
        {subtitle}
      </p>
    </div>
  </div>
);

const FinancialItem = ({ label, value, color, prefix = "" }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600 dark:text-gray-300 transition-all duration-300">{label}</span>
    <span className={`font-bold ${color} transition-all duration-300`}>{prefix}₹{value.toFixed(0)}</span>
  </div>
);

const ActionButton = ({ icon, title, onClick, color }) => (
  <button
    onClick={onClick}
    className={`${color} p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col items-center space-y-2`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-sm font-medium text-center">{title}</span>
  </button>
);