import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign, TrendingUp, TrendingDown, Users, FileText, Plus,
  BookOpen, Receipt, CreditCard, BarChart3, PieChart, Wallet,
  Building2, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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

export default function AccountingDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ["ac_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_companies").select("*").eq("user_id", user?.id || "");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const companyFilter = selectedCompany !== "all" ? selectedCompany : undefined;

  const { data: incomeTotal } = useQuery({
    queryKey: ["ac_dashboard_income", companyFilter],
    queryFn: async () => {
      let q = supabase.from("ac_income").select("amount");
      if (companyFilter) q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).reduce((s, r) => s + Number(r.amount), 0);
    },
    enabled: !!user,
  });

  const { data: expenseTotal } = useQuery({
    queryKey: ["ac_dashboard_expense", companyFilter],
    queryFn: async () => {
      let q = supabase.from("ac_expenses").select("amount").eq("approval_status", "approved");
      if (companyFilter) q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).reduce((s, r) => s + Number(r.amount), 0);
    },
    enabled: !!user,
  });

  const { data: outstandingInvoices } = useQuery({
    queryKey: ["ac_dashboard_invoices", companyFilter],
    queryFn: async () => {
      let q = supabase.from("ac_invoices").select("id, amount_due").in("status", ["sent", "overdue"]);
      if (companyFilter) q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Accounting Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Financial overview and quick navigation</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Company Selector */}
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {(companies ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate("/dashboard/accounting/invoices")}>
              <Plus className="w-4 h-4 mr-2" />New Invoice
            </Button>
            <Button onClick={() => navigate("/dashboard/accounting/expenses")}>
              <Plus className="w-4 h-4 mr-2" />Record Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fmt(incomeTotal ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">All recorded income</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{fmt(expenseTotal ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Approved expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outstandingInvoices?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {fmt((outstandingInvoices ?? []).reduce((s, i) => s + Number(i.amount_due ?? 0), 0))} due
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(incomeTotal ?? 0) - (expenseTotal ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fmt((incomeTotal ?? 0) - (expenseTotal ?? 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue − Expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        {navSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.items.map((item) => (
                <Card
                  key={item.path}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Active Companies */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Companies ({loadingCompanies ? "..." : companies?.length ?? 0})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(companies ?? []).map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.currency_code} · {c.email || "No email"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(companies ?? []).length === 0 && !loadingCompanies && (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  No companies yet. Create one to start tracking finances.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
