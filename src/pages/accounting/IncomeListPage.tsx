import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function IncomeListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: incomes, isLoading } = useQuery({
    queryKey: ['ac_income'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ac_income')
        .select(`
          *,
          ac_companies(name),
          ac_customers(name),
          ac_accounts(name, code)
        `)
        .eq('user_id', user?.id || '')
        .order('income_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const totalIncome = incomes?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Income Management
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage all your income sources.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/accounting/income/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Record Income
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incomes?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recurring Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {incomes?.filter(i => i.is_recurring).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Income Records</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : incomes && incomes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => (
                    <TableRow key={income.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>{format(new Date(income.income_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{income.ac_customers?.name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{income.category || 'General'}</TableCell>
                      <TableCell>
                        {income.ac_accounts?.code} - {income.ac_accounts?.name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {income.currency_code} {Number(income.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {income.is_recurring && (
                          <Badge variant="outline">Recurring</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No Income Records</h3>
                <p className="text-muted-foreground mb-4">Start tracking your income by adding your first record.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/accounting/income/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Income
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
