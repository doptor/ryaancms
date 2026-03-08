import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Bot, Zap, Target, Mail, TrendingUp, BarChart3, Loader2 } from "lucide-react";

type AiResult = any;

export default function CRMAIAssistantPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AiResult>>({});

  const { data: leads } = useQuery({
    queryKey: ["ai-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_leads").select("id, name, email, phone, source, status, score").limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: deals } = useQuery({
    queryKey: ["ai-deals"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("id, title, value, status, probability, expected_close_date").limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: activities } = useQuery({
    queryKey: ["ai-activities"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_activities").select("id, title, type, status, due_date, priority").eq("status", "pending").limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const callAI = async (action: string, data: any) => {
    setLoading(action);
    try {
      const { data: result, error } = await supabase.functions.invoke("crm-ai-assistant", {
        body: { action, data },
      });
      if (error) throw error;
      if (!result.success) throw new Error(result.error);
      setResults((prev) => ({ ...prev, [action]: result.result }));
      toast({ title: "AI Analysis Complete" });
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    }
    setLoading(null);
  };

  const actions = [
    {
      id: "score_leads",
      label: "Score Leads",
      desc: "AI-powered lead scoring based on conversion potential",
      icon: Target,
      color: "text-blue-600",
      onClick: () => callAI("score_leads", { leads }),
    },
    {
      id: "predict_deals",
      label: "Predict Deal Closures",
      desc: "Which deals are most likely to close this month?",
      icon: TrendingUp,
      color: "text-green-600",
      onClick: () => callAI("predict_deals", { deals }),
    },
    {
      id: "suggest_followups",
      label: "Smart Follow-ups",
      desc: "AI-suggested follow-up actions for today",
      icon: Zap,
      color: "text-amber-600",
      onClick: () => callAI("suggest_followups", { activities, deals }),
    },
    {
      id: "analyze_pipeline",
      label: "Pipeline Health",
      desc: "Analyze pipeline bottlenecks and forecast revenue",
      icon: BarChart3,
      color: "text-purple-600",
      onClick: () => callAI("analyze_pipeline", { pipeline: { deals } }),
    },
    {
      id: "generate_email",
      label: "Generate Sales Email",
      desc: "AI-generated email for your top prospect",
      icon: Mail,
      color: "text-pink-600",
      onClick: () => {
        const topDeal = (deals ?? [])[0];
        callAI("generate_email", {
          context: topDeal ? `Follow up on deal: ${topDeal.title}, value: $${topDeal.value}` : "General sales outreach",
        });
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" /> AI Sales Assistant
          </h1>
          <p className="text-muted-foreground">AI-powered insights and automation for your sales team</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <a.icon className={`w-5 h-5 ${a.color}`} />
                  {a.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{a.desc}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={a.onClick}
                  disabled={loading === a.id}
                  className="w-full"
                >
                  {loading === a.id ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : "Run Analysis"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results */}
        {Object.entries(results).map(([action, result]) => (
          <Card key={action}>
            <CardHeader>
              <CardTitle className="capitalize text-sm">{action.replace(/_/g, " ")} — Results</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(result) ? (
                <div className="space-y-3">
                  {result.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">
                          {item.title || item.target || item.name || `Item ${i + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.reason || item.recommendation || item.suggested_message || ""}
                        </p>
                      </div>
                      {(item.score !== undefined || item.predicted_probability !== undefined) && (
                        <Badge variant="secondary" className="text-xs">
                          {item.score ?? item.predicted_probability}%
                        </Badge>
                      )}
                      {item.priority && (
                        <Badge
                          variant="outline"
                          className={
                            item.priority === "high" ? "bg-red-100 text-red-700" :
                            item.priority === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : typeof result === "object" && result !== null ? (
                <div className="space-y-3">
                  {result.health_score !== undefined && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Health Score:</span>
                      <Badge variant={result.health_score >= 70 ? "default" : "destructive"}>{result.health_score}/100</Badge>
                    </div>
                  )}
                  {result.subject && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium text-sm text-foreground">Subject: {result.subject}</p>
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{result.body}</p>
                    </div>
                  )}
                  {result.insights && (
                    <div>
                      <p className="text-sm font-medium mb-2">Insights:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {result.insights.map((ins: string, i: number) => <li key={i}>{ins}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.recommendations && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {result.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.forecast && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium">Revenue Forecast</p>
                      <p className="text-xs text-muted-foreground">
                        This month: ${result.forecast.this_month?.toLocaleString()} ·
                        Next month: ${result.forecast.next_month?.toLocaleString()} ·
                        Confidence: {result.forecast.confidence}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{String(result)}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {Object.keys(results).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Click any analysis above to get AI-powered insights for your CRM data.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
