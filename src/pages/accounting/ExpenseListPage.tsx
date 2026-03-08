import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function ExpenseListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['ac_expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ac_expenses')
        .select(`
          *,
          ac_companies(name),
          ac_vendors(name),
          ac_accounts(name, code),
          ac_expense_categories(name)
        `)
        .eq('user_id', user?.id || '')
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const approveExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('ac_expenses')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
        .eq('user_id', user?.id || '');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ac_expenses'] });
      toast({ title: "Expense approved successfully" });
    }
  });

  const rejectExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('ac_expenses')
        .update({
          approval_status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
        .eq('user_id', user?.id || '');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ac_expenses'] });
      toast({ title: "Expense rejected", variant: "destructive" });
    }
  });

  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const pendingCount = expenses?.filter(e => e.approval_status === 'pending').length || 0;
  const approvedCount = expenses?.filter(e => e.approval_status === 'approved').length || 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary" />
              Expense Management
            </h1>
            <p className="text-muted-foreground mt-1">Track and approve business expenses.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/accounting/expenses/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Record Expense
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Expense Records</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : expenses && expenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{expense.ac_vendors?.name || 'N/A'}</TableCell>
                      <TableCell>{expense.ac_expense_categories?.name || 'General'}</TableCell>
                      <TableCell className="text-xs">
                        {expense.ac_accounts?.code} - {expense.ac_accounts?.name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {expense.currency_code} {Number(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {expense.approval_status === 'approved' && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </Badge>
                        )}
                        {expense.approval_status === 'pending' && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                        )}
                        {expense.approval_status === 'rejected' && (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {expense.approval_status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveExpense.mutate(expense.id)}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => rejectExpense.mutate(expense.id)}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No Expense Records</h3>
                <p className="text-muted-foreground mb-4">Start tracking expenses by adding your first record.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/accounting/expenses/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
