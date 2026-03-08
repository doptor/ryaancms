import { useState, createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface CompanyContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  companies: any[];
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  selectedCompanyId: null,
  setSelectedCompanyId: () => {},
  companies: [],
  isLoading: false,
});

export const useCompany = () => useContext(CompanyContext);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["ac_companies_ctx"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_companies")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId, companies, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function CompanySelector({ className }: { className?: string }) {
  const { selectedCompanyId, setSelectedCompanyId, companies, isLoading } = useCompany();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("ac_companies")
      .insert({ name: newName.trim(), user_id: user.id })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Company created", description: `${data.name} has been added.` });
    setSelectedCompanyId(data.id);
    setNewName("");
    setOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Select
        value={selectedCompanyId || "all"}
        onValueChange={(v) => setSelectedCompanyId(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[220px]">
          <Building2 className="w-4 h-4 mr-2 shrink-0" />
          <SelectValue placeholder={isLoading ? "Loading..." : "All Companies"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Companies</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Acme Corp"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full">
              {creating ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
