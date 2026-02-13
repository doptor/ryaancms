import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Send, Database, FileText, Image, Wand2,
  Paperclip, Mic, Code, Palette, BarChart3, CheckCircle2,
  Circle, Loader2, ExternalLink, Rocket,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { toast } from "@/hooks/use-toast";

type Message = { role: "user" | "ai"; content: string };

type ProgressStep = {
  label: string;
  status: "done" | "in_progress" | "pending";
};

const suggestions = [
  { icon: Database, label: "Generate a schema", prompt: "Create a blog schema with posts, categories, tags, and comments" },
  { icon: FileText, label: "Write content", prompt: "Write an SEO-optimized blog post about AI in web development" },
  { icon: Image, label: "Tag images", prompt: "Auto-tag all images in the media library with AI" },
  { icon: Wand2, label: "Optimize layout", prompt: "Suggest layout improvements for the homepage" },
];

const buildSteps: ProgressStep[] = [
  { label: "Analyzing request", status: "pending" },
  { label: "Generating structure", status: "pending" },
  { label: "Creating components", status: "pending" },
  { label: "Applying styles", status: "pending" },
  { label: "Building preview", status: "pending" },
  { label: "Ready to publish", status: "pending" },
];

export default function AIBuilderPage() {
  const location = useLocation();
  const incomingPrompt = (location.state as any)?.prompt || "";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I'm RyaanCMS AI. I can help you generate schemas, write content, optimize SEO, build layouts, and more. What would you like to create?" },
  ]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [buildComplete, setBuildComplete] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedIncoming = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-process incoming prompt from dashboard
  useEffect(() => {
    if (incomingPrompt && !hasProcessedIncoming.current) {
      hasProcessedIncoming.current = true;
      // Small delay so user sees the transition
      setTimeout(() => sendMessage(incomingPrompt), 300);
    }
  }, [incomingPrompt]);

  const simulateBuild = () => {
    setBuildComplete(false);
    const steps = buildSteps.map((s) => ({ ...s }));
    setProgress(steps);

    // Animate each step sequentially
    steps.forEach((_, i) => {
      // Set current step to in_progress
      setTimeout(() => {
        setProgress((prev) =>
          prev.map((s, j) => ({
            ...s,
            status: j < i ? "done" : j === i ? "in_progress" : "pending",
          }))
        );
      }, i * 1200);

      // Set last step to done
      if (i === steps.length - 1) {
        setTimeout(() => {
          setProgress((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
          setBuildComplete(true);
        }, (i + 1) * 1200);
      }
    });
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);
    setInput("");

    // Start build simulation
    simulateBuild();

    // Simulate AI response after build completes
    const totalBuildTime = buildSteps.length * 1200 + 500;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `✅ Your project is ready!\n\nI've analyzed your request: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"\n\n• Structure generated\n• Components created\n• Styles applied\n• Preview is live\n\nYou can now review the preview and publish when ready.` },
      ]);
    }, totalBuildTime);
  };

  const handlePublish = () => {
    toast({ title: "🚀 Published!", description: "Your project has been published successfully." });
    setBuildComplete(false);
  };

  const StatusIcon = ({ status }: { status: ProgressStep["status"] }) => {
    if (status === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    if (status === "in_progress") return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
    return <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />;
  };

    return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
        {/* Top bar with Publish */}
        <div className="flex items-center justify-between px-4 h-11 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">AI Builder</span>
            {progress.length > 0 && !buildComplete && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="w-3 h-3 animate-spin" /> Building...
              </span>
            )}
            {buildComplete && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="w-3 h-3" /> Complete
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!buildComplete}
            className="gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" /> Publish
          </Button>
        </div>

        {/* Mobile: stacked layout, Desktop: resizable split */}
        <div className="flex-1 min-h-0">
          {/* Desktop split */}
          <div className="hidden md:block h-full">
            <ResizablePanelGroup direction="horizontal">
              {/* LEFT: Chat Panel */}
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <div className="flex flex-col h-full border-r border-border">
                  {/* Progress tracker */}
                  {progress.length > 0 && (
                    <div className="border-b border-border p-3 space-y-1.5 bg-card">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Development Progress</p>
                      {progress.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <StatusIcon status={step.status} />
                          <span className={cn(
                            "text-xs",
                            step.status === "done" ? "text-foreground" : step.status === "in_progress" ? "text-primary font-medium" : "text-muted-foreground"
                          )}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chat messages */}
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}>
                            {msg.role === "ai" && <Sparkles className="w-3.5 h-3.5 text-primary mb-1" />}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Suggestions */}
                      {messages.length === 1 && (
                        <div className="grid grid-cols-1 gap-2 mt-4">
                          {suggestions.map((s) => (
                            <button
                              key={s.label}
                              onClick={() => sendMessage(s.prompt)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card text-left hover:border-primary/30 hover:bg-accent/50 transition-all text-xs"
                            >
                              <s.icon className="w-4 h-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium text-foreground">{s.label}</div>
                                <div className="text-muted-foreground truncate">{s.prompt}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input area */}
                  <div className="border-t border-border p-3 bg-card">
                    <div className="flex items-end gap-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Attach file">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Voice input">
                          <Mic className="w-4 h-4" />
                        </Button>
                      </div>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(input);
                          }
                        }}
                        placeholder="Ask AI to build something..."
                        rows={1}
                        className="flex-1 resize-none px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[36px] max-h-[120px]"
                      />
                      <Button variant="hero" size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* RIGHT: Preview Panel */}
              <ResizablePanel defaultSize={65} minSize={40}>
                <div className="flex flex-col h-full">
                  {/* Top tabs */}
                  <div className="border-b border-border bg-card px-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="bg-transparent h-11 p-0 gap-0">
                        <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" /> Preview
                        </TabsTrigger>
                        <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <Code className="w-3.5 h-3.5" /> Code
                        </TabsTrigger>
                        <TabsTrigger value="design" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <Palette className="w-3.5 h-3.5" /> Design
                        </TabsTrigger>
                        <TabsTrigger value="analysis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" /> Analysis
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 min-h-0">
                    {activeTab === "preview" && (
                      <div className="h-full relative bg-muted/30">
                        {progress.length > 0 ? (
                          <>
                            {/* Building overlay */}
                            {!buildComplete && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                                <div className="text-center space-y-3">
                                  <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                                  <p className="text-sm font-medium text-foreground">Building your project...</p>
                                  <p className="text-xs text-muted-foreground">
                                    {progress.find(s => s.status === "in_progress")?.label || "Processing..."}
                                  </p>
                                </div>
                              </div>
                            )}
                            {/* Preview iframe */}
                            <iframe
                              src="about:blank"
                              className="w-full h-full border-0"
                              title="Project Preview"
                              sandbox="allow-scripts allow-same-origin"
                            />
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center p-6">
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                                <ExternalLink className="w-7 h-7 text-primary" />
                              </div>
                              <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                Start a conversation with AI to generate components. The live preview will appear here.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === "code" && (
                      <div className="h-full flex items-center justify-center bg-muted/30 p-6">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Code className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">Code Editor</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            View and edit the generated code. Changes sync to the preview in real-time.
                          </p>
                        </div>
                      </div>
                    )}
                    {activeTab === "design" && (
                      <div className="h-full flex items-center justify-center bg-muted/30 p-6">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Palette className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">Design Editor</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Visually edit colors, typography, spacing, and layout of generated components.
                          </p>
                        </div>
                      </div>
                    )}
                    {activeTab === "analysis" && (
                      <div className="h-full flex items-center justify-center bg-muted/30 p-6">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">Analysis</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Performance metrics, SEO score, accessibility audit, and optimization suggestions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Mobile: stacked layout */}
          <div className="md:hidden flex flex-col h-full overflow-hidden">
            {/* Mobile tabs */}
            <div className="border-b border-border bg-card px-2 shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-transparent h-10 p-0 gap-0 w-full justify-start overflow-x-auto scrollbar-none">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Sparkles className="w-3.5 h-3.5" /> Chat
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" /> Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Code className="w-3.5 h-3.5" /> Code
                  </TabsTrigger>
                  <TabsTrigger value="design" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Palette className="w-3.5 h-3.5" /> Design
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <BarChart3 className="w-3.5 h-3.5" /> Analysis
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "chat" && (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Progress */}
                  {progress.length > 0 && (
                    <div className="border-b border-border p-3 space-y-1.5 bg-card">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress</p>
                      {progress.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <StatusIcon status={step.status} />
                          <span className={cn(
                            "text-xs",
                            step.status === "done" ? "text-foreground" : step.status === "in_progress" ? "text-primary font-medium" : "text-muted-foreground"
                          )}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}>
                            {msg.role === "ai" && <Sparkles className="w-3.5 h-3.5 text-primary mb-1" />}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {messages.length === 1 && (
                        <div className="grid grid-cols-1 gap-2 mt-4">
                          {suggestions.map((s) => (
                            <button
                              key={s.label}
                              onClick={() => sendMessage(s.prompt)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card text-left hover:border-primary/30 transition-all text-xs"
                            >
                              <s.icon className="w-4 h-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium text-foreground">{s.label}</div>
                                <div className="text-muted-foreground truncate">{s.prompt}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Mobile input */}
                  <div className="border-t border-border p-3 bg-card">
                    <div className="flex items-end gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground shrink-0">
                        <Mic className="w-4 h-4" />
                      </Button>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(input);
                          }
                        }}
                        placeholder="Ask AI..."
                        rows={1}
                        className="flex-1 resize-none px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[36px] max-h-[100px]"
                      />
                      <Button variant="hero" size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "preview" && (
                <div className="h-full relative bg-muted/30">
                  {progress.length > 0 ? (
                    <>
                      {!buildComplete && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                          <div className="text-center space-y-3">
                            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
                            <p className="text-sm font-medium text-foreground">Building...</p>
                            <p className="text-xs text-muted-foreground">
                              {progress.find(s => s.status === "in_progress")?.label || "Processing..."}
                            </p>
                          </div>
                        </div>
                      )}
                      <iframe src="about:blank" className="w-full h-full border-0" title="Preview" sandbox="allow-scripts allow-same-origin" />
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center p-6">
                      <div className="text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Preview</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">Start building to see preview.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab !== "chat" && activeTab !== "preview" && (
                <div className="h-full flex items-center justify-center bg-muted/30 p-6">
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      {activeTab === "code" && <Code className="w-6 h-6 text-primary" />}
                      {activeTab === "design" && <Palette className="w-6 h-6 text-primary" />}
                      {activeTab === "analysis" && <BarChart3 className="w-6 h-6 text-primary" />}
                    </div>
                    <h3 className="text-base font-semibold text-foreground capitalize">{activeTab}</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Start building with AI to see content here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
