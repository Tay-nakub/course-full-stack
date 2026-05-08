import { KpiCards } from './components/kpi-cards';
import { RevenueChart } from './components/revenue-chart';
import { TopProductsTable } from './components/top-products-table';
import { LowStockAlerts } from './components/low-stock-alerts';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">รายงาน</h1>
      <LowStockAlerts />
      <KpiCards />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <RevenueChart />
        <TopProductsTable />
      </div>
    </div>
  );
}
