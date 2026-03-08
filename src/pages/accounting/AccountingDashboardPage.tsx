import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign, TrendingUp, TrendingDown, Users, FileText, Plus,
  BookOpen, Receipt, CreditCard, BarChart3, PieChart, Wallet,
  Building2, ArrowRight, Truck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart as RPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const navSections = [
  {
    title: "Transactions",
    items: [
      { label: "Income", path: "/dashboard/accounting/income", icon: TrendingUp, color: "text-green-600" },
      { label: "Expenses", path: "/dashboard/accounting/expenses", icon: TrendingDown, color: "text-red-600" },
      { label: "Invoices", path: "/dashboard/accounting/invoices", icon: FileText, color: "text-blue-600" },
      { label: "Payments", path: "/dashboard/accounting/payments", icon: CreditCard, color: "text-purple-600" },
    ],
  },
  {
    title: "Directory",
    items: [
      { label: "Customers", path: "/dashboard/accounting/customers", icon: Users, color: "text-cyan-600" },
      { label: "Vendors", path: "/dashboard/accounting/vendors", icon: Truck, color: "text-orange-600" },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Profit & Loss", path: "/dashboard/accounting/profit-loss", icon: BarChart3, color: "text-emerald-600" },
      { label: "Balance Sheet", path: "/dashboard/accounting/balance-sheet", icon: PieChart, color: "text-indigo-600" },
      { label: "Cash Flow", path: "/dashboard/accounting/cash-flow", icon: Wallet, color: "text-amber-600" },
    ],
  },
  {
    title: "Setup",
    items: [
      { label: "Chart of Accounts", path: "/dashboard/accounting/accounts", icon: BookOpen, color: "text-teal-600" },
    ],
  },
];

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function AccountingDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ["ac_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_companies").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const companyFilter = selectedCompany !== "all" ? selectedCompany : undefined;

  const { data: incomeData } = useQuery({
    queryKey: ["ac_dash_income_full", companyFilter],
    queryFn: async () => {
      let q = supabase.from("ac_income").select("amount, category, income_date");
      if (companyFilter) q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: expenseData } = useQuery({
    queryKey: ["ac_dash_expense_full", companyFilter],
    queryFn: async () => {
      let q = supabase.from("ac_expenses").select("amount, expense_date, approval_status").eq("approval_status", "approved");
      if (companyFilter) q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: outstandingInvoices } = useQuery({
    queryKey: ["ac_dash_invoices", companyFilter],
    queryFn: async () => {
      let q = supabase.from("ac_invoices").select("id, amount_due, status");
      if (companyFilter) q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const incomeTotal = (incomeData ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const expenseTotal = (expenseData ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const netProfit = incomeTotal - expenseTotal;
  const outstandingTotal = (outstandingInvoices ?? []).filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.amount_due ?? 0), 0);
  const outstandingCount = (outstandingInvoices ?? []).filter(i => i.status === "sent" || i.status === "overdue").length;

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  // Monthly revenue vs expense (last 6 months)
  const monthlyData = (() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = { month: key, income: 0, expense: 0 };
    }
    (incomeData ?? []).forEach(r => {
      const key = new Date(r.income_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key]) months[key].income += Number(r.amount);
    });
    (expenseData ?? []).forEach(r => {
      const key = new Date(r.expense_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key]) months[key].expense += Number(r.amount);
    });
    return Object.values(months);
  })();

  // Income by category
  const categoryData = Object.entries(
    (incomeData ?? []).reduce<Record<string, number>>((acc, r) => { acc[r.category || "Other"] = (acc[r.category || "Other"] || 0) + Number(r.amount); return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Invoice status breakdown
  const invoiceStatusData = Object.entries(
    (outstandingInvoices ?? []).reduce<Record<string, number>>((acc, r) => { acc[r.status || "draft"] = (acc[r.status || "draft"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-primary" /> Accounting Dashboard</h1>
            <p className="text-muted-foreground mt-1">Financial overview and quick navigation</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-[200px]"><Building2 className="w-4 h-4 mr-2" /><SelectValue placeholder="All Companies" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {(companies ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate("/dashboard/accounting/invoices")}><Plus className="w-4 h-4 mr-2" />Invoice</Button>
            <Button onClick={() => navigate("/dashboard/accounting/expenses")}><Plus className="w-4 h-4 mr-2" />Expense</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{fmt(incomeTotal)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><TrendingDown className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{fmt(expenseTotal)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Outstanding</CardTitle><FileText className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{outstandingCount}</div><p className="text-xs text-muted-foreground">{fmt(outstandingTotal)} due</p></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Net Profit</CardTitle><BarChart3 className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(netProfit)}</div></CardContent></Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Revenue vs Expenses (6 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Income by Category</CardTitle></CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RPieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </RPieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground text-sm py-16">No income data</p>}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        {navSections.map(section => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.items.map(item => (
                <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(item.path)}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${item.color}`}><item.icon className="w-5 h-5" /></div>
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Companies */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Companies ({loadingCompanies ? "..." : companies?.length ?? 0})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(companies ?? []).map(c => (
              <Card key={c.id}><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-muted"><Building2 className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.currency_code} · {c.email || "No email"}</p></div></div></CardContent></Card>
            ))}
            {(companies ?? []).length === 0 && !loadingCompanies && (
              <Card><CardContent className="p-4 text-center text-muted-foreground">No companies yet.</CardContent></Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
