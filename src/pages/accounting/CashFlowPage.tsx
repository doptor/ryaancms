import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle, Calendar, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const CashFlowPage = () => {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: payments } = useQuery({
    queryKey: ["cf-payments", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_payments")
        .select("amount, type, payment_method, payment_date, status, notes, transaction_reference")
        .gte("payment_date", dateFrom)
        .lte("payment_date", dateTo)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: incomeData } = useQuery({
    queryKey: ["cf-income", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_income")
        .select("amount, income_date, payment_method")
        .gte("income_date", dateFrom)
        .lte("income_date", dateTo);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: expenseData } = useQuery({
    queryKey: ["cf-expenses", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_expenses")
        .select("amount, expense_date, payment_method")
        .eq("approval_status", "approved")
        .gte("expense_date", dateFrom)
        .lte("expense_date", dateTo);
      if (error) throw error;
      return data || [];
    },
  });

  const totalInflows = (incomeData ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalOutflows = (expenseData ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const netCashFlow = totalInflows - totalOutflows;

  const receivedPayments = (payments ?? []).filter((p) => p.type === "received");
  const sentPayments = (payments ?? []).filter((p) => p.type === "sent");
  const totalReceived = receivedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalSent = sentPayments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cash Flow Statement</h1>
            <p className="text-muted-foreground">Cash inflows and outflows for the period</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cash Inflows</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalInflows.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">{(incomeData ?? []).length} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cash Outflows</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalOutflows.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">{(expenseData ?? []).length} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${netCashFlow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Transactions */}
        <Card>
          <CardHeader><CardTitle>Payment Transactions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments ?? []).map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${p.type === "received" ? "bg-green-100 text-green-700" : p.type === "sent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {p.type}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{p.payment_method}</TableCell>
                    <TableCell className="font-mono text-sm">{p.transaction_reference || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${p.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${p.type === "received" ? "text-green-600" : "text-red-600"}`}>
                      {p.type === "received" ? "+" : "-"}${Number(p.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                {(payments ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No payment transactions</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Net Summary */}
        <Card className={netCashFlow >= 0 ? "border-green-200" : "border-red-200"}>
          <CardContent className="py-6 space-y-2">
            <div className="flex justify-between"><span>Total Received Payments</span><span className="font-bold text-green-600">+${totalReceived.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span>Total Sent Payments</span><span className="font-bold text-red-600">-${totalSent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-lg font-semibold">Net Cash Flow (Income − Expenses)</span>
              <span className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${netCashFlow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CashFlowPage;
