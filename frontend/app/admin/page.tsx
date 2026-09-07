'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import { LoadingSpinner, StatusBadge, Button } from '@/components/ui';
import { formatCurrency, formatDateTime, paymentStatusLabel, paymentStatusColor, billStatusLabel, billStatusColor } from '@/utils';
import { TrendingUp, TrendingDown, Package, FileText, AlertTriangle, DollarSign, BarChart2, ShoppingBag } from 'lucide-react';
import { cn } from '@/utils';
import Link from 'next/link';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'last_7', label: 'Last 7 Days' },
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

function MetricCard({
  label, value, sub, icon: Icon, trend, color = 'gold',
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<any>; trend?: 'up' | 'down'; color?: 'gold' | 'green' | 'blue' | 'red';
}) {
  const colors = {
    gold:  'text-brand-gold bg-brand-gold/10',
    green: 'text-green-400 bg-green-400/10',
    blue:  'text-blue-400 bg-blue-400/10',
    red:   'text-red-400 bg-red-400/10',
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-brand-gray uppercase tracking-wider font-medium">{label}</p>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-serif text-2xl text-brand-white mb-1">{value}</p>
      {sub && <p className="text-xs text-brand-gray">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('this_month');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => adminService.getDashboard(period),
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingSpinner size="lg" />;

  const d = data!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-white">Dashboard</h1>
          <p className="text-brand-gray text-sm mt-0.5">SOUL x TIME business overview</p>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-2">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                period === value
                  ? 'bg-brand-gold text-black'
                  : 'glass-card text-brand-gray hover:text-brand-white hover:border-brand-gold/30'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards — Financial */}
      <div>
        <h2 className="text-xs text-brand-gray uppercase tracking-wider font-medium mb-4">
          Financial — {PERIODS.find((p) => p.value === period)?.label}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Net Revenue"
            value={formatCurrency(d.netRevenuePeriod)}
            sub="After discounts, excl. cancelled"
            icon={DollarSign}
            color="gold"
          />
          <MetricCard
            label="Goods Cost"
            value={formatCurrency(d.goodsCostPeriod)}
            sub="Sum of purchase cost snapshots"
            icon={ShoppingBag}
            color="blue"
          />
          <MetricCard
            label="Gross Profit"
            value={formatCurrency(d.grossProfitPeriod)}
            sub="Revenue − Goods Cost"
            icon={BarChart2}
            color={d.grossProfitPeriod >= 0 ? 'green' : 'red'}
          />
          <MetricCard
            label="Today's Revenue"
            value={formatCurrency(d.todayRevenue)}
            sub={`${d.todayBillCount} bills today`}
            icon={TrendingUp}
            color="gold"
          />
        </div>
      </div>

      {/* Bills & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bills summary */}
        <div>
          <h2 className="text-xs text-brand-gray uppercase tracking-wider font-medium mb-4">Bills</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Period Bills', value: d.periodBillCount },
              { label: 'Total Bills', value: d.totalBillCount },
              { label: 'Today', value: d.todayBillCount },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card rounded-xl p-4 text-center">
                <p className="font-serif text-2xl text-brand-white">{value}</p>
                <p className="text-xs text-brand-gray mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory summary */}
        <div>
          <h2 className="text-xs text-brand-gray uppercase tracking-wider font-medium mb-4">Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4">
              <p className="font-serif text-2xl text-brand-white">{d.totalActiveProducts}</p>
              <p className="text-xs text-brand-gray mt-1">Active Products</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="font-serif text-2xl text-brand-white">{d.totalStockUnits}</p>
              <p className="text-xs text-brand-gray mt-1">Total Stock Units</p>
            </div>
            {d.lowStockCount > 0 && (
              <div className="glass-card rounded-xl p-4 border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <p className="font-serif text-xl text-yellow-400">{d.lowStockCount}</p>
                </div>
                <p className="text-xs text-yellow-400/70 mt-1">Low Stock</p>
              </div>
            )}
            {d.outOfStockCount > 0 && (
              <div className="glass-card rounded-xl p-4 border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-400" />
                  <p className="font-serif text-xl text-red-400">{d.outOfStockCount}</p>
                </div>
                <p className="text-xs text-red-400/70 mt-1">Out of Stock</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Bills */}
      {d.pendingBills.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-brand-gray uppercase tracking-wider font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Pending Payment Bills
            </h2>
            <Link href="/admin/bills?paymentStatus=PENDING" className="text-xs text-brand-gold hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {d.pendingBills.map((bill) => (
              <Link key={bill.id} href={`/admin/bills/${bill.id}`}>
                <div className="glass-card rounded-xl p-4 hover:border-yellow-500/30 transition-all cursor-pointer flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-brand-white text-sm">{bill.billNumber}</p>
                    <p className="text-xs text-brand-gray">{bill.customerName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-serif text-brand-white">{formatCurrency(bill.finalTotal)}</p>
                    <p className="text-xs text-brand-gray">{formatDateTime(bill.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bills */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-brand-gray uppercase tracking-wider font-medium">Recent Bills</h2>
          <Link href="/admin/bills" className="text-xs text-brand-gold hover:underline">View all</Link>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-black-border">
                <tr className="text-brand-gray text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Bill #</th>
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-right px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Payment</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {d.recentBills.map((bill) => (
                  <tr key={bill.id} className="border-t border-brand-black-border hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-brand-white">{bill.billNumber}</td>
                    <td className="px-5 py-3.5 text-brand-gray">{bill.customerName}</td>
                    <td className="px-5 py-3.5 text-right font-serif text-brand-white">{formatCurrency(bill.finalTotal)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={paymentStatusLabel(bill.paymentStatus)} colorClass={paymentStatusColor(bill.paymentStatus)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={billStatusLabel(bill.billStatus)} colorClass={billStatusColor(bill.billStatus)} />
                    </td>
                    <td className="px-5 py-3.5 text-brand-gray text-xs">{formatDateTime(bill.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/bills/${bill.id}`} className="text-xs text-brand-gold hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
