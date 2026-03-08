import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Loader2, Send, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function InvoiceListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['ac_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ac_invoices')
        .select(`
          *,
          ac_companies(name),
          ac_customers(name, email)
        `)
        .eq('user_id', user?.id || '')
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'secondary';
      case 'sent': return 'default';
      case 'draft': return 'outline';
      case 'overdue': return 'destructive';
      case 'partial': return 'outline';
      default: return 'outline';
    }
  };

  const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
  const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0;
  const totalOutstanding = invoices?.reduce((sum, inv) => sum + Number(inv.amount_due), 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Invoices
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage customer invoices.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/accounting/invoices/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvoiced.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${totalOutstanding.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : invoices && invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.ac_customers?.name}</TableCell>
                      <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">
                        {invoice.currency_code} {Number(invoice.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.currency_code} {Number(invoice.amount_paid).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)} className="capitalize">
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button size="sm" variant="ghost">
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No Invoices Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first invoice to get started.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/accounting/invoices/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
