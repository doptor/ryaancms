import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Database, Link2, Key, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";

const sampleCollections = [
  { name: "Blog Posts", fields: 14, records: 342, api: "REST + GraphQL" },
  { name: "Products", fields: 18, records: 1205, api: "REST + GraphQL" },
  { name: "Users", fields: 8, records: 1847, api: "REST" },
  { name: "Orders", fields: 22, records: 5621, api: "REST + GraphQL" },
  { name: "Categories", fields: 6, records: 28, api: "REST" },
  { name: "Media", fields: 10, records: 4312, api: "REST" },
];

const fieldTypes = ["Text", "Number", "Boolean", "Date", "Relation", "JSON", "AI Generated", "Computed", "Media", "Enum"];

export default function SchemaPage() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Schema Architect</h1>
            <p className="text-sm text-muted-foreground">Design your data models visually or with AI.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="hero-outline" size="sm">
              <Sparkles className="w-4 h-4" /> AI Generate
            </Button>
            <Button variant="hero" size="sm">
              <Plus className="w-4 h-4" /> New Collection
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collections List */}
          <div className="lg:col-span-1 rounded-xl border border-border bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Collections</h2>
            </div>
            <div className="p-2 space-y-1">
              {sampleCollections.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCollection(c.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    selectedCollection === c.name
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <span className="text-xs">{c.fields}f</span>
                </button>
              ))}
            </div>
          </div>

          {/* Schema Detail */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card">
            {selectedCollection ? (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{selectedCollection}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sampleCollections.find((c) => c.name === selectedCollection)?.records.toLocaleString()} records ·{" "}
                      {sampleCollections.find((c) => c.name === selectedCollection)?.api}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm"><Plus className="w-4 h-4" /> Add Field</Button>
                </div>
                <div className="p-5 space-y-3">
                  {["id", "title", "slug", "content", "status", "created_at", "author"].map((field, i) => (
                    <div key={field} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {i === 0 ? <Key className="w-4 h-4 text-primary" /> : i === 6 ? <Link2 className="w-4 h-4 text-accent-foreground" /> : <span className="w-4 h-4" />}
                        <span className="text-sm font-medium text-foreground font-mono">{field}</span>
                      </div>
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-accent">{fieldTypes[i % fieldTypes.length]}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
                <Database className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Collection</h3>
                <p className="text-sm text-muted-foreground mb-4">Choose a collection to view and edit its schema.</p>
                <Button variant="hero-outline" size="sm">
                  <Sparkles className="w-4 h-4" /> Generate with AI <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
