import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download } from "lucide-react";
import { exportToPdf, fmtCurrency } from "@/lib/accounting/pdf-export";
import { format, startOfMonth, endOfMonth } from "date-fns";

const ProfitLossPage = () => {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: incomeData } = useQuery({
    queryKey: ["pl-income", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_income")
        .select("amount, category, tax_amount, income_date")
        .gte("income_date", dateFrom)
        .lte("income_date", dateTo);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: expenseData } = useQuery({
    queryKey: ["pl-expenses", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_expenses")
        .select("amount, description, tax_amount, expense_date, approval_status")
        .eq("approval_status", "approved")
        .gte("expense_date", dateFrom)
        .lte("expense_date", dateTo);
      if (error) throw error;
      return data || [];
    },
  });

  const totalIncome = incomeData?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const totalIncomeTax = incomeData?.reduce((s, r) => s + Number(r.tax_amount ?? 0), 0) ?? 0;
  const totalExpense = expenseData?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const totalExpenseTax = expenseData?.reduce((s, r) => s + Number(r.tax_amount ?? 0), 0) ?? 0;
  const netProfit = totalIncome - totalExpense;

  // Group income by category
  const incomeByCategory = (incomeData ?? []).reduce<Record<string, number>>((acc, r) => {
    const cat = r.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + Number(r.amount);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profit & Loss Statement</h1>
            <p className="text-muted-foreground">Revenue and expense summary for the period</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = [
                  ...Object.entries(incomeByCategory).map(([cat, amt]) => ({ type: "Revenue", name: cat, amount: amt })),
                  ...(expenseData ?? []).map((e) => ({ type: "Expense", name: e.description || "—", amount: Number(e.amount) })),
                ];
                exportToPdf({
                  title: "Profit & Loss Statement",
                  dateRange: { from: dateFrom, to: dateTo },
                  columns: [
                    { header: "Type", key: "type" },
                    { header: "Description", key: "name" },
                    { header: "Amount", key: "amount", align: "right", format: fmtCurrency },
                  ],
                  data: rows,
                  totals: { type: "", name: "Net Profit", amount: fmtCurrency(netProfit) },
                });
              }}
            >
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Tax: ${totalIncomeTax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Tax: ${totalExpenseTax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Margin: {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0"}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(incomeByCategory).map(([cat, amt]) => (
                  <TableRow key={cat}>
                    <TableCell className="font-medium">{cat}</TableCell>
                    <TableCell className="text-right">${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
                {Object.keys(incomeByCategory).length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No income records</TableCell></TableRow>
                )}
                <TableRow className="font-bold border-t-2">
                  <TableCell>Total Revenue</TableCell>
                  <TableCell className="text-right text-green-600">${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(expenseData ?? []).map((exp) => (
                  <TableRow key={`${exp.expense_date}-${exp.amount}`}>
                    <TableCell>{exp.expense_date}</TableCell>
                    <TableCell>{exp.description || "—"}</TableCell>
                    <TableCell className="text-right">${Number(exp.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
                {(expenseData ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No expense records</TableCell></TableRow>
                )}
                <TableRow className="font-bold border-t-2">
                  <TableCell colSpan={2}>Total Expenses</TableCell>
                  <TableCell className="text-right text-red-600">${totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Net Summary */}
        <Card className={netProfit >= 0 ? "border-green-200" : "border-red-200"}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Net Profit / (Loss)</span>
              <span className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfitLossPage;
