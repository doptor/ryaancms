import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CreditCard, CheckCircle2, Copy, Check, Download, Settings, ShieldCheck, Zap, Globe, FileCode2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type PaymentProvider = {
  id: string;
  name: string;
  description: string;
  features: string[];
  configured: boolean;
  generatedFiles?: { name: string; size: string }[];
};

export function PaymentIntegrationPanel({ pipelineState }: Props) {
  const [providers, setProviders] = useState<PaymentProvider[]>([
    { id: "stripe", name: "Stripe", description: "Full-featured payment processing — subscriptions, one-time payments, invoicing", features: ["Checkout Sessions", "Subscriptions", "Webhooks", "Customer Portal", "Invoices"], configured: false },
    { id: "paypal", name: "PayPal", description: "Global payment solution — PayPal buttons, credit/debit cards", features: ["PayPal Checkout", "Smart Buttons", "Subscriptions", "Webhooks"], configured: false },
    { id: "sslcommerz", name: "SSLCommerz", description: "Bangladesh-focused payment gateway — bKash, Nagad, cards, mobile banking", features: ["bKash", "Nagad", "Cards", "Mobile Banking", "IPN Webhooks"], configured: false },
    { id: "razorpay", name: "Razorpay", description: "India-focused payment gateway — UPI, cards, wallets, subscriptions", features: ["UPI", "Cards", "Wallets", "Subscriptions", "Webhooks"], configured: false },
    { id: "lemonsqueezy", name: "Lemon Squeezy", description: "Digital products & SaaS — handles tax, billing, licensing", features: ["Checkout", "Subscriptions", "License Keys", "Tax Handling", "Webhooks"], configured: false },
  ]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const config = pipelineState?.config;

  const generateIntegration = (providerId: string) => {
    setIsGenerating(true);

    const fileMap: Record<string, { name: string; size: string }[]> = {
      stripe: [
        { name: "supabase/functions/stripe-checkout/index.ts", size: "2.8 KB" },
        { name: "supabase/functions/stripe-webhook/index.ts", size: "3.5 KB" },
        { name: "src/components/PaymentButton.tsx", size: "1.8 KB" },
        { name: "src/components/PricingTable.tsx", size: "3.2 KB" },
        { name: "src/components/CustomerPortal.tsx", size: "1.4 KB" },
        { name: "src/hooks/useSubscription.ts", size: "2.1 KB" },
        { name: "migrations/create_subscriptions.sql", size: "1.8 KB" },
      ],
      paypal: [
        { name: "supabase/functions/paypal-checkout/index.ts", size: "2.4 KB" },
        { name: "supabase/functions/paypal-webhook/index.ts", size: "2.8 KB" },
        { name: "src/components/PayPalButton.tsx", size: "2.1 KB" },
        { name: "src/hooks/usePayPal.ts", size: "1.6 KB" },
        { name: "migrations/create_orders.sql", size: "1.2 KB" },
      ],
      sslcommerz: [
        { name: "supabase/functions/sslcommerz-init/index.ts", size: "2.6 KB" },
        { name: "supabase/functions/sslcommerz-ipn/index.ts", size: "3.1 KB" },
        { name: "src/components/SSLCommerzButton.tsx", size: "1.9 KB" },
        { name: "src/hooks/useSSLCommerz.ts", size: "1.5 KB" },
        { name: "migrations/create_payments.sql", size: "1.4 KB" },
      ],
      razorpay: [
        { name: "supabase/functions/razorpay-order/index.ts", size: "2.2 KB" },
        { name: "supabase/functions/razorpay-webhook/index.ts", size: "2.9 KB" },
        { name: "src/components/RazorpayButton.tsx", size: "2.0 KB" },
        { name: "src/hooks/useRazorpay.ts", size: "1.4 KB" },
        { name: "migrations/create_payments.sql", size: "1.3 KB" },
      ],
      lemonsqueezy: [
        { name: "supabase/functions/lemonsqueezy-checkout/index.ts", size: "2.1 KB" },
        { name: "supabase/functions/lemonsqueezy-webhook/index.ts", size: "3.0 KB" },
        { name: "src/components/LemonSqueezyButton.tsx", size: "1.7 KB" },
        { name: "src/hooks/useLemonSqueezy.ts", size: "1.8 KB" },
        { name: "migrations/create_licenses.sql", size: "1.6 KB" },
      ],
    };

    setTimeout(() => {
      setProviders(prev => prev.map(p =>
        p.id === providerId ? { ...p, configured: true, generatedFiles: fileMap[providerId] || [] } : p
      ));
      setIsGenerating(false);
      toast({ title: `💳 ${providers.find(p => p.id === providerId)?.name} integration generated!` });
    }, 1200);
  };

  const handleCopyEnv = (providerId: string) => {
    const envMap: Record<string, string> = {
      stripe: "STRIPE_SECRET_KEY=sk_test_...\nSTRIPE_WEBHOOK_SECRET=whsec_...\nSTRIPE_PRICE_ID=price_...",
      paypal: "PAYPAL_CLIENT_ID=...\nPAYPAL_SECRET=...\nPAYPAL_WEBHOOK_ID=...",
      sslcommerz: "SSLCOMMERZ_STORE_ID=...\nSSLCOMMERZ_STORE_PASSWORD=...\nSSLCOMMERZ_IS_SANDBOX=true",
      razorpay: "RAZORPAY_KEY_ID=rzp_test_...\nRAZORPAY_KEY_SECRET=...\nRAZORPAY_WEBHOOK_SECRET=...",
      lemonsqueezy: "LEMONSQUEEZY_API_KEY=...\nLEMONSQUEEZY_STORE_ID=...\nLEMONSQUEEZY_WEBHOOK_SECRET=...",
    };
    navigator.clipboard.writeText(envMap[providerId] || "");
    setCopiedId(providerId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Payment Integration</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to add payment integration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Payment Integration</h3>
            <p className="text-[11px] text-muted-foreground">Add payment processing to "{config.title}"</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {providers.map((provider) => (
            <div key={provider.id} className={cn(
              "rounded-xl border p-4 space-y-3 transition-colors",
              provider.configured ? "border-primary/30 bg-primary/5" : "border-border"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">{provider.name}</h4>
                    {provider.configured && (
                      <Badge variant="secondary" className="text-[10px] gap-1 text-primary">
                        <CheckCircle2 className="w-3 h-3" /> Configured
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{provider.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {provider.features.map((f) => (
                  <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={provider.configured ? "outline" : "default"}
                  onClick={() => generateIntegration(provider.id)}
                  disabled={isGenerating}
                  className="gap-1 text-xs flex-1"
                >
                  {isGenerating && selectedProvider === provider.id ? "Generating..." : provider.configured ? "Regenerate" : "Generate Integration"}
                </Button>
                {provider.configured && (
                  <Button size="sm" variant="ghost" onClick={() => handleCopyEnv(provider.id)} className="gap-1 text-xs">
                    {copiedId === provider.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    .env
                  </Button>
                )}
              </div>

              {provider.configured && provider.generatedFiles && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Generated Files</p>
                  {provider.generatedFiles.map((f) => (
                    <div key={f.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="w-3 h-3 text-muted-foreground" />
                        <code className="font-mono text-foreground">{f.name}</code>
                      </div>
                      <span className="text-muted-foreground">{f.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
