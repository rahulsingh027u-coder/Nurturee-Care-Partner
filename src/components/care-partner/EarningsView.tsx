'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  TrendingUp,
  IndianRupee,
  Clock,
  CheckCircle,
  Loader2,
  Download,
  ArrowUpRight,
  Info,
  ChevronRight,
  Receipt,
  BadgeDollarSign,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  mockCarePartner,
  mockEarnings,
  mockMonthlyEarnings,
  mockWeeklyEarnings,
} from '@/lib/care-partner-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'today' | 'thisWeek' | 'thisMonth' | 'total';
type ChartPeriod = 'monthly' | 'weekly';
type StatusFilter = 'all' | 'paid' | 'pending' | 'processing';

interface SummaryCard {
  key: Period;
  label: string;
  value: number;
  sublabel: string;
  icon: typeof Wallet;
  color: string;
  activeColor: string;
  activeBorder: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) => `\u20b9${value.toLocaleString('en-IN')}`;

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: Loader2,
  },
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md">
        <p className="text-[11px] font-medium text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EarningsView() {
  const [earningsData, setEarningsData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/earnings')
      .then((r) => r.json())
      .then((d) => setEarningsData(d))
      .catch(() => {})
  }, [])

  // Map API response to shapes the component expects
  const mockCarePartner = earningsData ? {
    earnings: {
      today: earningsData.summary?.today || 0,
      thisWeek: earningsData.summary?.thisWeek || 0,
      thisMonth: earningsData.summary?.thisMonth || 0,
      lastWeek: 0,
      total: earningsData.summary?.total || 0,
      pending: 0,
      paid: 0,
    }
  } : { earnings: { today: 0, thisWeek: 0, thisMonth: 0, lastWeek: 0, total: 0, pending: 0, paid: 0 } }

  const mockEarnings = earningsData?.transactions || []
  const mockMonthlyEarnings = earningsData?.monthlyBreakdown || []
  const mockWeeklyEarnings = earningsData?.weeklyBreakdown || []

  const [activeCard, setActiveCard] = useState<Period>('thisMonth');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('monthly');
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Computed summary cards
  const summaryCards: SummaryCard[] = [
    {
      key: 'today',
      label: 'Today',
      value: mockCarePartner.earnings.today,
      sublabel: 'Earned today',
      icon: Wallet,
      color: 'bg-blue-50 text-blue-600',
      activeColor: 'bg-blue-100 text-blue-700',
      activeBorder: 'border-blue-300 ring-1 ring-blue-100',
    },
    {
      key: 'thisWeek',
      label: 'This Week',
      value: mockCarePartner.earnings.thisWeek,
      sublabel: 'Mon – Sun',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
      activeColor: 'bg-emerald-100 text-emerald-700',
      activeBorder: 'border-emerald-300 ring-1 ring-emerald-100',
    },
    {
      key: 'thisMonth',
      label: 'This Month',
      value: mockCarePartner.earnings.thisMonth,
      sublabel: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      icon: IndianRupee,
      color: 'bg-violet-50 text-violet-600',
      activeColor: 'bg-violet-100 text-violet-700',
      activeBorder: 'border-violet-300 ring-1 ring-violet-100',
    },
    {
      key: 'total',
      label: 'Total',
      value: mockCarePartner.earnings.total,
      sublabel: 'All time earnings',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      activeColor: 'bg-amber-100 text-amber-700',
      activeBorder: 'border-amber-300 ring-1 ring-amber-100',
    },
  ];

  const activeSummaryCard = summaryCards.find((c) => c.key === activeCard)!;

  // Chart data (static — will be replaced by backend API)
  const chartData = chartPeriod === 'monthly'
    ? mockMonthlyEarnings
    : mockWeeklyEarnings;

  const chartTotal = chartData.reduce((sum, d) => sum + d.earnings, 0);
  const chartAvg = Math.round(chartTotal / chartData.length);
  const chartMax = Math.max(...chartData.map((d) => d.earnings));

  // Status breakdown
  const paidCount = mockEarnings.filter((e) => e.status === 'paid').length;
  const pendingCount = mockEarnings.filter((e) => e.status === 'pending').length;
  const processingCount = mockEarnings.filter((e) => e.status === 'processing').length;
  const pieData = [
    { name: 'Paid', value: paidCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Processing', value: processingCount },
  ].filter((d) => d.value > 0);

  // Filtered earnings for selected period AND status
  const today = new Date();
  const filteredEarnings = mockEarnings.filter((e) => {
    const eDate = new Date(e.date);
    // Period filter
    switch (activeCard) {
      case 'today':
        if (eDate.toDateString() !== today.toDateString()) return false;
        break;
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        if (eDate < startOfWeek) return false;
        break;
      }
      case 'thisMonth':
        if (eDate.getMonth() !== today.getMonth() || eDate.getFullYear() !== today.getFullYear()) return false;
        break;
      case 'total':
      default:
        break;
    }
    // Status filter
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  const handleCardClick = (key: Period) => {
    setAnimatingCard(key);
    setActiveCard(key);
    setTimeout(() => setAnimatingCard(null), 400);
  };

  const handleRequestPayout = () => {
    setPayoutRequested(true);
    setTimeout(() => setPayoutRequested(false), 3000);
  };

  const handleDownload = () => {
    setDownloading(true);

    // Generate CSV from mockEarnings data
    setTimeout(() => {
      try {
        const headers = ['Date', 'Booking ID', 'Patient', 'Service Type', 'Amount (₹)', 'Status'];
        const rows = mockEarnings.map((e) => [
          e.date,
          e.bookingId,
          e.patientName,
          e.serviceType,
          e.amount.toString(),
          e.status.charAt(0).toUpperCase() + e.status.slice(1),
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nurturee-earnings-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Fallback: open in new tab if download fails
      }

      setDownloading(false);
    }, 800);
  };

  const handleRowClick = (id: string) => {
    setSelectedTransaction(selectedTransaction === id ? null : id);
  };

  // ─── Custom Pie Label ────────────────────────────────────────────────────

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} className="text-[11px] fill-gray-500 font-medium">
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* ===== Section 1: Summary Cards (Clickable) ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeCard === card.key;
          const isAnimating = animatingCard === card.key;
          return (
            <button
              key={card.key}
              onClick={() => handleCardClick(card.key)}
              className={`bg-card rounded-xl border shadow-sm py-5 text-left transition-all duration-300 hover:shadow-md cursor-pointer w-full ${
                isActive
                  ? `${card.activeBorder} ${isAnimating ? 'scale-[1.03]' : 'scale-[1.01]'}`
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-3 px-4">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? card.activeColor : card.color
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="px-4">
                <p className={`text-xs font-medium transition-colors ${isActive ? 'text-gray-700' : 'text-gray-500'}`}>
                  {card.label}
                </p>
                <p className={`text-xl font-bold sm:text-2xl transition-colors ${isActive ? 'text-gray-900' : 'text-gray-900'}`}>
                  {formatCurrency(card.value)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{card.sublabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active card info bar */}
      <div className="flex items-center gap-2 px-1">
        <div className="size-2 rounded-full bg-blue-500" />
        <span className="text-xs text-gray-500">
          Viewing: <span className="font-semibold text-gray-700">{activeSummaryCard.label}</span> earnings
          {filteredEarnings.length > 0 && (
            <span className="text-gray-400"> — {filteredEarnings.length} transaction{filteredEarnings.length > 1 ? 's' : ''}</span>
          )}
        </span>
      </div>

      {/* ===== Section 2: Tabs ===== */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* ——— Tab 1: Overview ——— */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Chart Card with Monthly/Weekly toggle */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    Earnings Overview
                  </CardTitle>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setChartPeriod('monthly')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        chartPeriod === 'monthly'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setChartPeriod('weekly')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        chartPeriod === 'weekly'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartPeriod === 'monthly' ? (
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey={chartPeriod === 'monthly' ? 'month' : 'day'} axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={2} fill="url(#monthlyGradient)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
                        <Bar dataKey="earnings" radius={[6, 6, 0, 0]} maxBarSize={36}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.earnings === 0 ? '#e2e8f0' : '#3b82f6'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                {/* Chart Stats Row */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-[11px] text-gray-400 font-medium">Total</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(chartTotal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-gray-400 font-medium">Average</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(chartAvg)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-gray-400 font-medium">Peak</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(chartMax)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Column — Status Pie + Quick Stats */}
            <div className="space-y-4">
              {/* Status Breakdown Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          dataKey="value"
                          labelLine={false}
                          label={false}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} transactions`, 'Count']}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {pieData.map((item, index) => (
                      <button
                        key={item.name}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                        {item.name} ({item.value})
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="size-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Total Transactions</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{mockEarnings.length}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-emerald-500" />
                      <span className="text-xs text-gray-500">Avg. per Transaction</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(Math.round(mockEarnings.reduce((s, e) => s + e.amount, 0) / mockEarnings.length))}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-500" />
                      <span className="text-xs text-gray-500">Best Day</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(chartMax)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payout Summary — Clickable Status Segments */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Payout Summary
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50">
                  <Info className="size-3 mr-1" />
                  Click segments for details
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Paid Segment */}
              <button
                onClick={() => { setStatusFilter('paid'); setActiveTab('history'); }}
                className={`w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4 transition-all cursor-pointer text-left group ${
                  statusFilter === 'paid'
                    ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-100'
                    : 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50'
                }`
              }
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Paid</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(mockCarePartner.earnings.paid)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-12 sm:ml-0">
                  <Badge variant="outline" className={statusConfig.paid.className}>
                    <CheckCircle className="size-3 mr-1" />
                    {paidCount} Paid
                  </Badge>
                  <ChevronRight className="size-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </button>

              {/* Pending Segment */}
              <button
                onClick={() => { setStatusFilter('pending'); setActiveTab('history'); }}
                className={`w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4 transition-all cursor-pointer text-left group ${
                  statusFilter === 'pending'
                    ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-100'
                    : 'border-amber-100 bg-amber-50/50 hover:bg-amber-50'
                }`
              }
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Pending Payout</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(mockCarePartner.earnings.pending)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-12 sm:ml-0">
                  <Badge variant="outline" className={statusConfig.pending.className}>
                    <Loader2 className="size-3 mr-1 animate-spin" />
                    {pendingCount} Pending
                  </Badge>
                  <ChevronRight className="size-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </button>

              {/* Processing Segment */}
              <button
                onClick={() => { setStatusFilter('processing'); setActiveTab('history'); }}
                className={`w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4 transition-all cursor-pointer text-left group ${
                  statusFilter === 'processing'
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-100'
                    : 'border-blue-100 bg-blue-50/50 hover:bg-blue-50'
                }`
              }
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Loader2 className="size-4 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Processing</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(mockEarnings.filter((e) => e.status === 'processing').reduce((s, e) => s + e.amount, 0))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-12 sm:ml-0">
                  <Badge variant="outline" className={statusConfig.processing.className}>
                    <Loader2 className="size-3 mr-1" />
                    {processingCount} Processing
                  </Badge>
                  <ChevronRight className="size-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>

              {/* Request Payout Button */}
              <div className="pt-2">
                <Button
                  onClick={handleRequestPayout}
                  disabled={payoutRequested || mockCarePartner.earnings.pending === 0}
                  className={`w-full h-11 rounded-xl shadow-sm transition-all ${
                    payoutRequested
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {payoutRequested ? (
                    <>
                      <CheckCircle className="size-4 mr-2" />
                      Payout Requested Successfully!
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4 mr-2" />
                      Request Payout — {formatCurrency(mockCarePartner.earnings.pending)}
                      <ArrowUpRight className="size-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— Tab 2: Breakdown ——— */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Earnings by Service Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <BadgeDollarSign className="size-4 text-gray-400" />
                  Earnings by Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const serviceMap: Record<string, { total: number; count: number }> = {};
                  mockEarnings.forEach((e) => {
                    if (!serviceMap[e.serviceType]) serviceMap[e.serviceType] = { total: 0, count: 0 };
                    serviceMap[e.serviceType].total += e.amount;
                    serviceMap[e.serviceType].count++;
                  });
                  const services = Object.entries(serviceMap).sort((a, b) => b[1].total - a[1].total);
                  const maxTotal = services[0]?.[1].total || 1;

                  return services.map(([name, data]) => (
                    <button
                      key={name}
                      onClick={() => setActiveCard('total')}
                      className="w-full text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 transition-colors truncate">
                          {name}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${(data.total / maxTotal) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{data.count} booking{data.count > 1 ? 's' : ''}</p>
                    </button>
                  ));
                })()}
              </CardContent>
            </Card>

            {/* Earnings by Care Member */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="size-4 text-gray-400" />
                  Earnings by Care Member
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const patientMap: Record<string, { total: number; count: number }> = {};
                  mockEarnings.forEach((e) => {
                    if (!patientMap[e.patientName]) patientMap[e.patientName] = { total: 0, count: 0 };
                    patientMap[e.patientName].total += e.amount;
                    patientMap[e.patientName].count++;
                  });
                  const patients = Object.entries(patientMap).sort((a, b) => b[1].total - a[1].total);
                  const maxTotal = patients[0]?.[1].total || 1;

                  return patients.map(([name, data]) => (
                    <button
                      key={name}
                      onClick={() => setActiveCard('total')}
                      className="w-full text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 transition-colors truncate">
                          {name}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${(data.total / maxTotal) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{data.count} shift{data.count > 1 ? 's' : ''}</p>
                    </button>
                  ));
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Earnings Trend — Monthly comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Monthly Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockMonthlyEarnings} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
                    <Bar dataKey="earnings" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {mockMonthlyEarnings.map((entry, index) => {
                        const max = Math.max(...mockMonthlyEarnings.map((d) => d.earnings));
                        return (
                          <Cell
                            key={index}
                            fill={entry.earnings === max ? '#10b981' : '#3b82f6'}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500" /> Highest earning month highlighted
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— Tab 3: Payment History ——— */}
        <TabsContent value="history">
          {/* Active Status Filter Banner */}
          {statusFilter !== 'all' && (
            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-2.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full animate-pulse" style={{ backgroundColor: statusConfig[statusFilter]?.className.includes('emerald') ? '#10b981' : statusConfig[statusFilter]?.className.includes('amber') ? '#f59e0b' : '#3b82f6' }} />
                <span className="text-xs font-medium text-gray-700">
                  Filtered by: <span className="font-bold capitalize">{statusFilter}</span> transactions
                </span>
                <Badge variant="outline" className={statusConfig[statusFilter].className}>
                  {filteredEarnings.length} result{filteredEarnings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="text-xs text-gray-500 hover:text-gray-900 h-7 px-2"
              >
                Clear Filter
              </Button>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              {/* Header Row */}
              <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className="w-20">Date</span>
                <span className="w-24">Booking</span>
                <span className="flex-1">Care Member</span>
                <span className="w-40">Service</span>
                <span className="w-20 text-right">Amount</span>
                <span className="w-20 text-right">Status</span>
              </div>

              {/* Rows — clickable */}
              <div className="divide-y divide-gray-50">
                {filteredEarnings.map((record) => {
                  const cfg = statusConfig[record.status];
                  const StatusIcon = cfg.icon;
                  const isExpanded = selectedTransaction === record.id;

                  return (
                    <div key={record.id}>
                      <button
                        onClick={() => handleRowClick(record.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 transition-colors text-left cursor-pointer ${
                          isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {/* Expand chevron */}
                        <ChevronRight
                          className={`size-4 text-gray-300 shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />

                        {/* Date + Booking (mobile) / separate (desktop) */}
                        <div className="w-20 shrink-0">
                          <p className="text-xs text-gray-500">
                            {new Date(record.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-[11px] font-mono text-gray-400 md:hidden">
                            {record.bookingId}
                          </p>
                        </div>

                        {/* Booking ID — hidden on mobile */}
                        <span className="hidden md:block w-24 text-xs font-mono text-gray-400">
                          {record.bookingId}
                        </span>

                        {/* Care Member */}
                        <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                          {record.patientName}
                        </span>

                        {/* Service — hidden on mobile */}
                        <span className="hidden sm:block w-40 text-xs text-gray-500 truncate">
                          {record.serviceType}
                        </span>

                        {/* Amount */}
                        <span className="w-20 shrink-0 text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(record.amount)}
                        </span>

                        {/* Status */}
                        <div className="w-20 shrink-0 flex justify-end">
                          <Badge variant="outline" className={cfg.className}>
                            <StatusIcon className={`size-3 mr-1 ${record.status === 'pending' ? 'animate-spin' : ''}`} />
                            {cfg.label}
                          </Badge>
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="px-12 py-3 bg-blue-50/30 border-t border-blue-100/50 space-y-2 animate-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Transaction ID</p>
                              <p className="text-xs font-mono font-medium text-gray-700">{record.id}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Booking ID</p>
                              <p className="text-xs font-mono font-medium text-gray-700">{record.bookingId}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Service</p>
                              <p className="text-xs font-medium text-gray-700">{record.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Amount</p>
                              <p className="text-xs font-bold text-gray-900">{formatCurrency(record.amount)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Badge variant="outline" className={cfg.className}>
                              <StatusIcon className={`size-3 mr-1 ${record.status === 'pending' ? 'animate-spin' : ''}`} />
                              {cfg.label}
                            </Badge>
                            <span className="text-[11px] text-gray-400">
                              {record.status === 'paid' && `Credited on ${new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                              {record.status === 'pending' && 'Expected within 2-3 business days'}
                              {record.status === 'processing' && 'Being processed by bank'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredEarnings.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Wallet className="size-10 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No transactions found</p>
                    <p className="text-xs text-gray-400 mt-0.5">No earnings recorded for the selected period</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredEarnings.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Showing {filteredEarnings.length} of {mockEarnings.length} records
                    {activeCard !== 'total' && (
                      <span className="ml-1 text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveCard('total')}>
                        (Show all)
                      </span>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="size-3.5 mr-1.5" />
                        Download Report
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
