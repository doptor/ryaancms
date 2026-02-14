import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Send, Sparkles, Loader2, Wand2,
  Plus, Trash2, Edit, ArrowUp, Bot, User,
  Code, Copy, Check, Lightbulb, Palette, Database as DbIcon,
  FileText, Shield, Zap, RotateCcw,
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
  suggestions?: string[];
  codeBlock?: string;
  timestamp?: string;
};

const QUICK_COMMANDS = [
  { label: "➕ Add login page", prompt: "Add a login/register page with auth_form component", icon: Plus, category: "pages" },
  { label: "📊 Add dashboard", prompt: "Add a dashboard page with stats_row, chart, and crud_table", icon: Plus, category: "pages" },
  { label: "💰 Add pricing", prompt: "Add a pricing page with pricing_table and FAQ", icon: Plus, category: "pages" },
  { label: "📝 Add blog", prompt: "Add a blog page with blog_preview and newsletter_cta", icon: Plus, category: "pages" },
  { label: "📞 Add contact", prompt: "Add a contact page with contact_form and map components", icon: Plus, category: "pages" },
  { label: "🗑 Remove last page", prompt: "Remove the last page from the project", icon: Trash2, category: "edit" },
  { label: "🎨 Change theme", prompt: "Change the theme to a modern dark style", icon: Palette, category: "style" },
  { label: "🔒 Add auth", prompt: "Add authentication with login, register, and profile pages", icon: Shield, category: "features" },
  { label: "💾 Add database", prompt: "Add a users collection with name, email, role fields", icon: DbIcon, category: "data" },
  { label: "📄 Add about page", prompt: "Add an about page with team_section and features_grid", icon: Plus, category: "pages" },
];

const CONTEXT_SUGGESTIONS: Record<string, string[]> = {
  empty: [
    "Build a SaaS dashboard with auth and billing",
    "Create an e-commerce store with products and cart",
    "Build a project management tool with kanban board",
  ],
  hasPages: [
    "Add a hero section to the landing page",
    "Add authentication to all pages",
    "Create a sidebar navigation layout",
  ],
  hasCollections: [
    "Add a CRUD table for managing data",
    "Add search and filter to the dashboard",
    "Create an admin panel for all collections",
  ],
};

function processCommand(config: AppConfig, command: string): { config: AppConfig; response: string; suggestions?: string[] } {
  const cmd = command.toLowerCase();
  const updated = JSON.parse(JSON.stringify(config)) as AppConfig;

  // Add page commands
  if (cmd.includes("add") && (cmd.includes("page") || cmd.includes("login") || cmd.includes("dashboard") || cmd.includes("pricing") || cmd.includes("blog") || cmd.includes("contact") || cmd.includes("about"))) {
    if (cmd.includes("login") || cmd.includes("auth") || cmd.includes("register")) {
      updated.pages.push({
        name: "Login", route: "/login", layout: "auth",
        components: [{ type: "auth_form", props: { mode: "login" } }],
        requires_auth: false,
      });
      return { config: updated, response: "✅ Added **Login** page with auth form.", suggestions: ["Add a register page too", "Add forgot password page", "Add profile page"] };
    }
    if (cmd.includes("dashboard")) {
      updated.pages.push({
        name: "Dashboard", route: "/dashboard", layout: "dashboard",
        components: [{ type: "stats_row", props: {} }, { type: "chart", props: {} }, { type: "crud_table", props: {} }],
        requires_auth: true,
      });
      return { config: updated, response: "✅ Added **Dashboard** page with stats, chart, and data table.", suggestions: ["Add a sidebar navigation", "Add notifications panel", "Add settings page"] };
    }
    if (cmd.includes("pricing")) {
      updated.pages.push({
        name: "Pricing", route: "/pricing", layout: "public",
        components: [{ type: "pricing_table", props: {} }, { type: "faq", props: {} }],
      });
      return { config: updated, response: "✅ Added **Pricing** page with pricing table and FAQ.", suggestions: ["Add Stripe payment integration", "Add a free trial CTA", "Add feature comparison table"] };
    }
    if (cmd.includes("blog")) {
      updated.pages.push({
        name: "Blog", route: "/blog", layout: "public",
        components: [{ type: "blog_preview", props: {} }, { type: "newsletter_cta", props: {} }],
      });
      return { config: updated, response: "✅ Added **Blog** page with blog preview and newsletter CTA.", suggestions: ["Add blog post detail page", "Add categories filter", "Add search to blog"] };
    }
    if (cmd.includes("contact")) {
      updated.pages.push({
        name: "Contact", route: "/contact", layout: "public",
        components: [{ type: "contact_form", props: {} }, { type: "map", props: {} }],
      });
      return { config: updated, response: "✅ Added **Contact** page with contact form and map.", suggestions: ["Add FAQ section", "Add office locations", "Add social links"] };
    }
    if (cmd.includes("about")) {
      updated.pages.push({
        name: "About", route: "/about", layout: "public",
        components: [{ type: "team_section", props: {} }, { type: "features_grid", props: {} }],
      });
      return { config: updated, response: "✅ Added **About** page with team section and features grid.", suggestions: ["Add company timeline", "Add testimonials", "Add partner logos"] };
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
    return { config: updated, response: `✅ Added collection **${name}** with id, title, and timestamps.`, suggestions: ["Add more fields to this collection", "Create a CRUD page for it", "Add RLS policies"] };
  }

  // Change title
  if (cmd.includes("rename") || (cmd.includes("change") && cmd.includes("title"))) {
    const titleMatch = command.match(/(?:to|as)\s+["']?(.+?)["']?\s*$/i);
    if (titleMatch) {
      updated.title = titleMatch[1];
      return { config: updated, response: `✅ Project renamed to **${titleMatch[1]}**.` };
    }
  }

  // Project summary
  if (cmd.includes("summary") || cmd.includes("status") || cmd.includes("overview")) {
    const summary = `📊 **Project Summary: ${config.title}**\n\n- **Pages:** ${config.pages.length} (${config.pages.map(p => p.name).join(", ")})\n- **Collections:** ${config.collections.length} (${config.collections.map(c => c.name).join(", ") || "none"})\n- **Components:** ${config.pages.reduce((sum, p) => sum + p.components.length, 0)} total\n- **Auth Required:** ${config.pages.filter(p => p.requires_auth).length} pages`;
    return { config, response: summary };
  }

  // Help
  if (cmd.includes("help") || cmd === "?") {
    return {
      config,
      response: "🛠️ **Available Commands:**\n\n- `Add a [name] page` — Create a new page\n- `Add [component] to [page]` — Add component to page\n- `Remove [name] page` — Delete a page\n- `Add collection [name]` — Create a database collection\n- `Rename to [name]` — Change project title\n- `Summary` — View project overview\n- `Help` — Show this help\n\n**Components:** hero, navbar, footer, crud_table, form, chart, stats_row, faq, testimonials, pricing_table, contact_form, newsletter_cta, blog_preview, team_section, features_grid, kanban_board, calendar, timeline, media_gallery, file_upload, search_bar, map",
    };
  }

  // Fallback
  return { config, response: `🤔 I'll send this to the full AI Builder for processing.\n\n_Click "Send to Builder" below to handle complex requests._` };
}

export function AIChatAssistantPanel({ config, onConfigUpdate, onSendToBuild, isBuilding }: AIChatAssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI project assistant. I can help you quickly modify your project — add pages, components, collections, and more.\n\nTry a command below or type your own!",
      suggestions: ["Add a login page", "Add a dashboard", "Show project summary", "Help"],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingBuildPrompt, setPendingBuildPrompt] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setInput("");
    setPendingBuildPrompt(null);
    setHistoryIdx(-1);

    setCommandHistory(prev => [text, ...prev.slice(0, 19)]);
    const userMsg: AssistantMessage = { role: "user", content: text, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);

    // Simulate typing delay
    setIsTyping(true);
    setTimeout(() => {
      if (!config) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "⚠️ No project loaded yet. Build an app first via the main chat, then come back here to make quick edits.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        setIsTyping(false);
        return;
      }

      const { config: newConfig, response, suggestions } = processCommand(config, text);
      if (newConfig !== config) {
        onConfigUpdate(newConfig);
      } else if (!response.includes("Summary") && !response.includes("Commands")) {
        setPendingBuildPrompt(text);
      }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setIsTyping(false);
    }, 400 + Math.random() * 400);
  };

  const handleCopyMessage = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsg(idx);
    setTimeout(() => setCopiedMsg(null), 2000);
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "🔄 Chat cleared! How can I help you?",
      suggestions: ["Add a page", "Show summary", "Help"],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setPendingBuildPrompt(null);
  };

  const categories = [...new Set(QUICK_COMMANDS.map(c => c.category))];
  const filteredCommands = activeCategory
    ? QUICK_COMMANDS.filter(c => c.category === activeCategory)
    : QUICK_COMMANDS.slice(0, 5);

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
        <div className="flex items-center gap-1.5">
          {config && (
            <Badge variant="secondary" className="text-[10px]">
              {config.pages.length}p · {config.collections.length}c
            </Badge>
          )}
          <Button size="sm" variant="ghost" onClick={clearChat} className="h-6 w-6 p-0" title="Clear chat">
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className="max-w-[85%] space-y-1.5">
                <div className={cn(
                  "rounded-xl px-3 py-2 text-sm relative group",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border text-foreground"
                )}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {/* Copy button */}
                  <button
                    onClick={() => handleCopyMessage(i, msg.content)}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center"
                  >
                    {copiedMsg === i ? <Check className="w-2.5 h-2.5 text-primary" /> : <Copy className="w-2.5 h-2.5 text-muted-foreground" />}
                  </button>
                </div>

                {/* Timestamp */}
                {msg.timestamp && (
                  <p className={cn("text-[9px] text-muted-foreground px-1", msg.role === "user" ? "text-right" : "text-left")}>{msg.timestamp}</p>
                )}

                {/* Inline suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] hover:bg-primary/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-muted/50 border border-border rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Send to builder */}
          {pendingBuildPrompt && !isBuilding && (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => {
                  onSendToBuild(pendingBuildPrompt);
                  setPendingBuildPrompt(null);
                  setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "🚀 Sent to AI Builder for full processing!",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  }]);
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
        <div className="px-3 py-2 border-t border-border space-y-1.5">
          {/* Category filters */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap transition-colors border",
                !activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap capitalize transition-colors border",
                  activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {filteredCommands.map((cmd) => (
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
              if (e.key === "ArrowUp" && !input && commandHistory.length > 0) {
                const newIdx = Math.min(historyIdx + 1, commandHistory.length - 1);
                setHistoryIdx(newIdx);
                setInput(commandHistory[newIdx]);
              }
              if (e.key === "ArrowDown" && !input && historyIdx >= 0) {
                const newIdx = historyIdx - 1;
                setHistoryIdx(newIdx);
                setInput(newIdx >= 0 ? commandHistory[newIdx] : "");
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
