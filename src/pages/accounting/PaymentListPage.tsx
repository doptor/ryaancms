import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function PaymentListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['ac_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ac_payments')
        .select(`
          *,
          ac_companies(name),
          ac_customers(name),
          ac_invoices(invoice_number),
          ac_accounts(name, code)
        `)
        .eq('user_id', user?.id || '')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'outline';
    }
  };

  const totalReceived = payments?.filter(p => p.type === 'received' && p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalSent = payments?.filter(p => p.type === 'sent' && p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              Payments
            </h1>
            <p className="text-muted-foreground mt-1">Track all payment transactions.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/accounting/payments/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalReceived.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalSent.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingPayments}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : payments && payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{payment.ac_customers?.name || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.ac_invoices?.invoice_number || 'N/A'}
                      </TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant={payment.type === 'received' ? 'secondary' : 'outline'} className="capitalize">
                          {payment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {payment.currency_code} {Number(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payment.status)} className="capitalize gap-1">
                          {payment.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {payment.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No Payment Records</h3>
                <p className="text-muted-foreground mb-4">Start recording payments to track your cash flow.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/accounting/payments/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
