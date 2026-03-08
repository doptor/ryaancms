import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function ChartOfAccountsPage() {
  const { user } = useAuth();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['ac_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ac_accounts')
        .select(`
          *,
          ac_companies(name)
        `)
        .eq('user_id', user?.id || '')
        .order('code', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Chart of Accounts
            </h1>
            <p className="text-muted-foreground mt-1">Manage your financial account structure.</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-border mb-4 flex flex-row justify-between items-center">
            <CardTitle>Accounts List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="py-8 text-center text-muted-foreground">Loading accounts...</div>
            ) : accounts && accounts.length > 0 ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline">{account.type}</Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        {account.ac_companies?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.currency_code} {account.current_balance}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No Accounts Found</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Get started by adding your first financial account or set up a company to generate default accounts.
                </p>
                <Button variant="outline">Create Default Accounts</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
