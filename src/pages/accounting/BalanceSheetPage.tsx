import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";

const BalanceSheetPage = () => {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: accounts } = useQuery({
    queryKey: ["bs-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_accounts")
        .select("*")
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return data || [];
    },
  });

  const assetAccounts = (accounts ?? []).filter((a) => a.type === "asset");
  const liabilityAccounts = (accounts ?? []).filter((a) => a.type === "liability");
  const equityAccounts = (accounts ?? []).filter((a) => a.type === "equity");

  const totalAssets = assetAccounts.reduce((s, a) => s + Number(a.current_balance ?? 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + Number(a.current_balance ?? 0), 0);
  const totalEquity = equityAccounts.reduce((s, a) => s + Number(a.current_balance ?? 0), 0);

  const renderSection = (title: string, items: typeof assetAccounts, total: number, color: string) => (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-mono text-sm">{acc.code}</TableCell>
                <TableCell>{acc.name}</TableCell>
                <TableCell className="text-right">${Number(acc.current_balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No accounts</TableCell></TableRow>
            )}
            <TableRow className="font-bold border-t-2">
              <TableCell colSpan={2}>Total {title}</TableCell>
              <TableCell className={`text-right ${color}`}>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Balance Sheet</h1>
            <p className="text-muted-foreground">Financial position snapshot</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">As of:</span>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-44" />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Assets</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">${totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Liabilities</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">${totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Equity</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">${totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></CardContent>
          </Card>
        </div>

        {renderSection("Assets", assetAccounts, totalAssets, "text-blue-600")}
        {renderSection("Liabilities", liabilityAccounts, totalLiabilities, "text-red-600")}
        {renderSection("Equity", equityAccounts, totalEquity, "text-green-600")}

        {/* Balance Check */}
        <Card className={Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01 ? "border-green-300" : "border-red-300"}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Assets − Liabilities − Equity</span>
              </div>
              <span className={`text-xl font-bold ${Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                ${(totalAssets - totalLiabilities - totalEquity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                {Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01 ? " ✓ Balanced" : " ✗ Unbalanced"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BalanceSheetPage;
