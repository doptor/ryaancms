import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Database, FileText, Image, Wand2 } from "lucide-react";
import { useState } from "react";

const suggestions = [
  { icon: Database, label: "Generate a schema", prompt: "Create a blog schema with posts, categories, tags, and comments" },
  { icon: FileText, label: "Write content", prompt: "Write an SEO-optimized blog post about AI in web development" },
  { icon: Image, label: "Tag images", prompt: "Auto-tag all images in the media library with AI" },
  { icon: Wand2, label: "Optimize layout", prompt: "Suggest layout improvements for the homepage" },
];

export default function AIBuilderPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hello! I'm RyaanCMS AI. I can help you generate schemas, write content, optimize SEO, build layouts, and more. What would you like to create?" },
  ]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "ai", content: `Processing: "${text}"\n\nThis is a demo response. In the full version, this will connect to the AI engine to generate schemas, content, and more.` },
    ]);
    setInput("");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="p-6 lg:p-8 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-1">AI Builder</h1>
          <p className="text-sm text-muted-foreground">Build, generate, and optimize with AI assistance.</p>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-lg rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}>
                {msg.role === "ai" && <Sparkles className="w-4 h-4 text-primary mb-1" />}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mt-6">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-left hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                >
                  <s.icon className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{s.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 lg:px-8">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask AI to build something..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button variant="hero" size="default" onClick={() => sendMessage(input)}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
