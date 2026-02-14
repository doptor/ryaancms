import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, Users, Package, Loader2, Shield,
  CheckCircle, Clock, XCircle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  buyer_id: string;
  plugin_id: string;
  amount: number;
  commission_amount: number;
  developer_amount: number;
  status: string;
  created_at: string;
  plugin?: { name: string; slug: string } | null;
}

interface Payout {
  id: string;
  developer_id: string;
  amount: number;
  status: string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
}

interface PluginWithPrice {
  id: string;
  name: string;
  slug: string;
  price: number;
  commission_rate: number;
  is_free: boolean;
  category: string;
}

export default function FinanceDashboardPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [plugins, setPlugins] = useState<PluginWithPrice[]>([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  const checkAdminAndLoad = async () => {
    setLoading(true);
    const { data: adminCheck } = await supabase.rpc("has_role", {
      _user_id: user!.id,
      _role: "admin",
    });
    setIsAdmin(!!adminCheck);

    if (adminCheck) {
      const [ordersRes, payoutsRes, pluginsRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("developer_payouts").select("*").order("created_at", { ascending: false }),
        supabase.from("plugins").select("id, name, slug, price, commission_rate, is_free, category"),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (payoutsRes.data) setPayouts(payoutsRes.data as Payout[]);
      if (pluginsRes.data) setPlugins(pluginsRes.data as PluginWithPrice[]);
    }
    setLoading(false);
  };

  const totalRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const totalCommission = orders.filter(o => o.status === "completed").reduce((s, o) => s + o.commission_amount, 0);
  const totalDevEarnings = orders.filter(o => o.status === "completed").reduce((s, o) => s + o.developer_amount, 0);
  const pendingPayouts = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const paidPayouts = payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const paidProducts = plugins.filter(p => !p.is_free).length;

  const handlePayoutStatus = async (id: string, status: "paid" | "cancelled") => {
    const update: any = { status };
    if (status === "paid") update.paid_at = new Date().toISOString();
    const { error } = await supabase.from("developer_payouts").update(update).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "paid" ? "Payout marked as paid" : "Payout cancelled" });
      checkAdminAndLoad();
    }
  };

  if (!isAdmin && !loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-6xl">
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">You don't have admin access to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            Finance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Manage marketplace revenue, commissions, and developer payouts.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="orders" className="gap-1.5"><Package className="w-3.5 h-3.5" /> Orders</TabsTrigger>
              <TabsTrigger value="payouts" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Payouts</TabsTrigger>
              <TabsTrigger value="pricing" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Product Pricing</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign className="w-4 h-4" />} />
                <StatCard label="Platform Commission" value={`$${totalCommission.toFixed(2)}`} icon={<ArrowUpRight className="w-4 h-4" />} />
                <StatCard label="Developer Earnings" value={`$${totalDevEarnings.toFixed(2)}`} icon={<ArrowDownRight className="w-4 h-4" />} />
                <StatCard label="Pending Payouts" value={`$${pendingPayouts.toFixed(2)}`} icon={<Clock className="w-4 h-4" />} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-1">Paid Products</p>
                  <p className="text-2xl font-bold text-foreground">{paidProducts}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-1">Total Paid Out</p>
                  <p className="text-2xl font-bold text-foreground">${paidPayouts.toFixed(2)}</p>
                </div>
              </div>
            </TabsContent>

            {/* Orders */}
            <TabsContent value="orders" className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-left">
                        <th className="px-4 py-3 font-medium text-muted-foreground">Order ID</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Commission</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Developer</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-t border-border">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}...</td>
                          <td className="px-4 py-3 font-medium text-foreground">${order.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-muted-foreground">${order.commission_amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-muted-foreground">${order.developer_amount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={order.status === "completed" ? "secondary" : "outline"} className="text-xs">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Payouts */}
            <TabsContent value="payouts" className="space-y-4">
              {payouts.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No payouts yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">${payout.amount.toFixed(2)}</span>
                          <Badge variant={payout.status === "paid" ? "secondary" : payout.status === "pending" ? "outline" : "destructive"} className="text-xs">
                            {payout.status === "paid" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {payout.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                            {payout.status === "cancelled" && <XCircle className="w-3 h-3 mr-1" />}
                            {payout.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {payout.notes || "No notes"} · {new Date(payout.created_at).toLocaleDateString()}
                          {payout.paid_at && ` · Paid ${new Date(payout.paid_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {payout.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handlePayoutStatus(payout.id, "paid")}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Paid
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handlePayoutStatus(payout.id, "cancelled")}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Product Pricing */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Commission %</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plugins.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{p.category}</td>
                        <td className="px-4 py-3 text-foreground">{p.is_free ? "Free" : `$${p.price.toFixed(2)}`}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.commission_rate}%</td>
                        <td className="px-4 py-3">
                          <Badge variant={p.is_free ? "outline" : "secondary"} className="text-xs">
                            {p.is_free ? "Free" : "Paid"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
