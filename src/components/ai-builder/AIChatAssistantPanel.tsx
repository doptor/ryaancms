import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Send, Sparkles, Loader2, Wand2,
  Plus, Trash2, Edit, ArrowUp, Bot, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig } from "@/lib/engine";
import ReactMarkdown from "react-markdown";

interface AIChatAssistantPanelProps {
  config: AppConfig | null;
  onConfigUpdate: (config: AppConfig) => void;
  onSendToBuild: (prompt: string) => void;
  isBuilding: boolean;
}

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
  action?: string;
};

const QUICK_COMMANDS = [
  { label: "Add login page", prompt: "Add a login/register page with auth_form component", icon: Plus },
  { label: "Add dashboard", prompt: "Add a dashboard page with stats_row, chart, and crud_table", icon: Plus },
  { label: "Add pricing", prompt: "Add a pricing page with pricing_table and FAQ", icon: Plus },
  { label: "Add blog", prompt: "Add a blog page with blog_preview and newsletter_cta", icon: Plus },
  { label: "Remove last page", prompt: "Remove the last page from the project", icon: Trash2 },
  { label: "Add contact form", prompt: "Add a contact page with contact_form and map components", icon: Plus },
];

function processCommand(config: AppConfig, command: string): { config: AppConfig; response: string } {
  const cmd = command.toLowerCase();
  const updated = JSON.parse(JSON.stringify(config)) as AppConfig;

  // Add page commands
  if (cmd.includes("add") && (cmd.includes("page") || cmd.includes("login") || cmd.includes("dashboard") || cmd.includes("pricing") || cmd.includes("blog") || cmd.includes("contact"))) {
    if (cmd.includes("login") || cmd.includes("auth") || cmd.includes("register")) {
      updated.pages.push({
        name: "Login", route: "/login", layout: "auth",
        components: [{ type: "auth_form", props: { mode: "login" } }],
        requires_auth: false,
      });
      return { config: updated, response: "✅ Added **Login** page with auth form." };
    }
    if (cmd.includes("dashboard")) {
      updated.pages.push({
        name: "Dashboard", route: "/dashboard", layout: "dashboard",
        components: [
          { type: "stats_row", props: {} },
          { type: "chart", props: {} },
          { type: "crud_table", props: {} },
        ],
        requires_auth: true,
      });
      return { config: updated, response: "✅ Added **Dashboard** page with stats, chart, and data table." };
    }
    if (cmd.includes("pricing")) {
      updated.pages.push({
        name: "Pricing", route: "/pricing", layout: "public",
        components: [
          { type: "pricing_table", props: {} },
          { type: "faq", props: {} },
        ],
      });
      return { config: updated, response: "✅ Added **Pricing** page with pricing table and FAQ." };
    }
    if (cmd.includes("blog")) {
      updated.pages.push({
        name: "Blog", route: "/blog", layout: "public",
        components: [
          { type: "blog_preview", props: {} },
          { type: "newsletter_cta", props: {} },
        ],
      });
      return { config: updated, response: "✅ Added **Blog** page with blog preview and newsletter CTA." };
    }
    if (cmd.includes("contact")) {
      updated.pages.push({
        name: "Contact", route: "/contact", layout: "public",
        components: [
          { type: "contact_form", props: {} },
          { type: "map", props: {} },
        ],
      });
      return { config: updated, response: "✅ Added **Contact** page with contact form and map." };
    }
    // Generic page
    const pageName = command.match(/add\s+(?:a\s+)?(\w+)\s+page/i)?.[1] || "New";
    updated.pages.push({
      name: pageName.charAt(0).toUpperCase() + pageName.slice(1),
      route: `/${pageName.toLowerCase()}`,
      layout: "public",
      components: [],
    });
    return { config: updated, response: `✅ Added **${pageName}** page. Drag components onto it from the Builder tab.` };
  }

  // Remove page
  if (cmd.includes("remove") || cmd.includes("delete")) {
    if (cmd.includes("last page") && updated.pages.length > 1) {
      const removed = updated.pages.pop()!;
      return { config: updated, response: `🗑 Removed page **${removed.name}** (\`${removed.route}\`).` };
    }
    const pageMatch = command.match(/(?:remove|delete)\s+(?:the\s+)?(\w+)\s+page/i);
    if (pageMatch) {
      const name = pageMatch[1].toLowerCase();
      const idx = updated.pages.findIndex(p => p.name.toLowerCase() === name);
      if (idx >= 0 && updated.pages.length > 1) {
        const removed = updated.pages.splice(idx, 1)[0];
        return { config: updated, response: `🗑 Removed page **${removed.name}**.` };
      }
    }
  }

  // Add component to page
  if (cmd.includes("add") && (cmd.includes("component") || cmd.includes("section") || cmd.includes("hero") || cmd.includes("table") || cmd.includes("chart") || cmd.includes("form"))) {
    const componentTypes = ["hero", "navbar", "footer", "crud_table", "form", "chart", "stats_row", "faq", "testimonials", "pricing_table", "contact_form", "newsletter_cta", "blog_preview", "team_section", "features_grid", "kanban_board", "calendar", "timeline", "media_gallery", "file_upload", "search_bar", "map"];
    const found = componentTypes.find(t => cmd.includes(t.replace("_", " ")) || cmd.includes(t));
    if (found && updated.pages.length > 0) {
      // Add to last page or specified page
      const pageMatch = command.match(/to\s+(?:the\s+)?(\w+)\s+page/i);
      let targetIdx = updated.pages.length - 1;
      if (pageMatch) {
        const pi = updated.pages.findIndex(p => p.name.toLowerCase() === pageMatch[1].toLowerCase());
        if (pi >= 0) targetIdx = pi;
      }
      updated.pages[targetIdx].components.push({ type: found, props: {} });
      return { config: updated, response: `✅ Added **${found.replace(/_/g, " ")}** to **${updated.pages[targetIdx].name}** page.` };
    }
  }

  // Add collection
  if (cmd.includes("add") && (cmd.includes("collection") || cmd.includes("table") || cmd.includes("model"))) {
    const nameMatch = command.match(/(?:collection|table|model)\s+(?:called\s+|named\s+)?["']?(\w+)["']?/i);
    const name = nameMatch?.[1] || "items";
    updated.collections.push({
      name, rls: true, tenant_isolated: false, audit_fields: true,
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "title", type: "text", required: true },
        { name: "created_at", type: "timestamp", required: true },
        { name: "updated_at", type: "timestamp", required: true },
      ],
    });
    return { config: updated, response: `✅ Added collection **${name}** with id, title, and timestamps.` };
  }

  // Change title
  if (cmd.includes("rename") || (cmd.includes("change") && cmd.includes("title"))) {
    const titleMatch = command.match(/(?:to|as)\s+["']?(.+?)["']?\s*$/i);
    if (titleMatch) {
      updated.title = titleMatch[1];
      return { config: updated, response: `✅ Project renamed to **${titleMatch[1]}**.` };
    }
  }

  // Fallback — send to full builder
  return { config, response: `🤔 I'm not sure how to handle that directly. Let me send it to the full AI Builder for processing.\n\n_Use the "Send to Builder" button below to process complex requests._` };
}

export function AIChatAssistantPanel({ config, onConfigUpdate, onSendToBuild, isBuilding }: AIChatAssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: "assistant", content: "👋 Hi! I'm your AI project assistant. I can help you quickly modify your project — add pages, components, collections, and more.\n\nTry: **\"Add a login page\"** or **\"Add a chart to the dashboard\"**" },
  ]);
  const [input, setInput] = useState("");
  const [pendingBuildPrompt, setPendingBuildPrompt] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setInput("");

    const userMsg: AssistantMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    if (!config) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ No project loaded yet. Build an app first via the main chat, then come back here to make quick edits." }]);
      return;
    }

    const { config: newConfig, response } = processCommand(config, text);
    if (newConfig !== config) {
      onConfigUpdate(newConfig);
    } else {
      setPendingBuildPrompt(text);
    }
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
            <p className="text-[10px] text-muted-foreground">Quick project edits via chat</p>
          </div>
        </div>
        {config && (
          <Badge variant="secondary" className="text-[10px]">
            {config.pages.length} pages · {config.collections.length} collections
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 border border-border text-foreground"
              )}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Send to builder button */}
          {pendingBuildPrompt && !isBuilding && (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => {
                  onSendToBuild(pendingBuildPrompt);
                  setPendingBuildPrompt(null);
                  setMessages(prev => [...prev, { role: "assistant", content: "🚀 Sent to AI Builder for full processing!" }]);
                }}
              >
                <Wand2 className="w-3.5 h-3.5" /> Send to Builder
              </Button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Quick commands */}
      {config && (
        <div className="px-3 py-2 border-t border-border">
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_COMMANDS.slice(0, 4).map((cmd) => (
              <button
                key={cmd.label}
                onClick={() => handleSend(cmd.prompt)}
                className="px-2 py-1 rounded-md border border-border bg-card text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t border-border bg-card shrink-0">
        <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-1 focus-within:ring-2 focus-within:ring-ring">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Type a command... e.g. 'Add a login page'"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[32px] max-h-[120px] py-1.5 px-2"
          />
          <Button
            size="icon"
            className="h-7 w-7 rounded-md shrink-0"
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
