import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, GripVertical, ChevronDown, ChevronRight, ExternalLink, Puzzle, FileText, Link2, ToggleLeft, ToggleRight, Menu as MenuIcon, Search, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import IconPicker from "@/components/IconPicker";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface MenuGroup {
  id: string;
  name: string;
  slug: string;
  position: string;
  target: string;
  is_active: boolean;
  sort_order: number;
}

interface MenuItem {
  id: string;
  group_id: string;
  parent_id: string | null;
  label: string;
  link_type: string;
  url: string | null;
  plugin_slug: string | null;
  icon: string | null;
  open_in_new_tab: boolean;
  is_active: boolean;
  sort_order: number;
}

const PAGE_SIZE = 10;

const POSITIONS = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "sidebar", label: "Sidebar" },
  { value: "dashboard-header", label: "Dashboard Header" },
  { value: "dashboard-footer", label: "Dashboard Footer" },
];

const TARGETS = [
  { value: "frontend", label: "Frontend (Website)" },
  { value: "dashboard", label: "Dashboard" },
];

const LINK_TYPES = [
  { value: "custom", label: "Custom URL", icon: Link2 },
  { value: "page", label: "Page", icon: FileText },
  { value: "plugin", label: "Plugin", icon: Puzzle },
  { value: "external", label: "External Link", icon: ExternalLink },
];

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
          <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => onPageChange(p)}>
            {p}
          </Button>
        ))}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function MenuBuilderPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & pagination
  const [groupSearch, setGroupSearch] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(1);

  // Group dialog
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", slug: "", position: "header", target: "frontend" });

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({ label: "", link_type: "custom", url: "", plugin_slug: "", icon: "", open_in_new_tab: false, group_id: "", parent_id: "" });

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    const [gRes, iRes] = await Promise.all([
      supabase.from("menu_groups").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    if (gRes.data) setGroups(gRes.data);
    if (iRes.data) setItems(iRes.data);
    setLoading(false);
  }

  // Filtered & paginated groups
  const filteredGroups = useMemo(() => {
    const q = groupSearch.toLowerCase();
    return groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.slug.toLowerCase().includes(q) ||
      g.position.toLowerCase().includes(q) ||
      g.target.toLowerCase().includes(q)
    );
  }, [groups, groupSearch]);

  const groupTotalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const pagedGroups = filteredGroups.slice((groupPage - 1) * PAGE_SIZE, groupPage * PAGE_SIZE);

  // Filtered & paginated items
  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return items.filter(i =>
      i.label.toLowerCase().includes(q) ||
      (i.url && i.url.toLowerCase().includes(q)) ||
      i.link_type.toLowerCase().includes(q) ||
      (i.plugin_slug && i.plugin_slug.toLowerCase().includes(q)) ||
      (i.icon && i.icon.toLowerCase().includes(q))
    );
  }, [items, itemSearch]);

  const itemTotalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((itemPage - 1) * PAGE_SIZE, itemPage * PAGE_SIZE);

  // Reset page on search
  useEffect(() => { setGroupPage(1); }, [groupSearch]);
  useEffect(() => { setItemPage(1); }, [itemSearch]);

  // GROUP CRUD
  function openGroupDialog(group?: MenuGroup) {
    if (group) {
      setEditingGroup(group);
      setGroupForm({ name: group.name, slug: group.slug, position: group.position, target: group.target });
    } else {
      setEditingGroup(null);
      setGroupForm({ name: "", slug: "", position: "header", target: "frontend" });
    }
    setGroupDialogOpen(true);
  }

  async function saveGroup() {
    if (!user || !groupForm.name) return;
    const slug = groupForm.slug || groupForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (editingGroup) {
      const { error } = await supabase.from("menu_groups").update({ name: groupForm.name, slug, position: groupForm.position, target: groupForm.target }).eq("id", editingGroup.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Group updated" });
    } else {
      const { error } = await supabase.from("menu_groups").insert({ user_id: user.id, name: groupForm.name, slug, position: groupForm.position, target: groupForm.target, sort_order: groups.length });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Group created" });
    }
    setGroupDialogOpen(false);
    fetchAll();
  }

  async function deleteGroup(id: string) {
    await supabase.from("menu_items").delete().eq("group_id", id);
    const { error } = await supabase.from("menu_groups").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Group deleted" });
    fetchAll();
  }

  async function toggleGroup(id: string, active: boolean) {
    await supabase.from("menu_groups").update({ is_active: !active }).eq("id", id);
    fetchAll();
  }

  // ITEM CRUD
  function openItemDialog(item?: MenuItem) {
    if (item) {
      setEditingItem(item);
      setItemForm({ label: item.label, link_type: item.link_type, url: item.url || "", plugin_slug: item.plugin_slug || "", icon: item.icon || "", open_in_new_tab: item.open_in_new_tab, group_id: item.group_id, parent_id: item.parent_id || "" });
    } else {
      setEditingItem(null);
      setItemForm({ label: "", link_type: "custom", url: "", plugin_slug: "", icon: "", open_in_new_tab: false, group_id: groups[0]?.id || "", parent_id: "" });
    }
    setItemDialogOpen(true);
  }

  async function saveItem() {
    if (!user || !itemForm.label || !itemForm.group_id) return;
    const data: any = {
      user_id: user.id,
      group_id: itemForm.group_id,
      parent_id: itemForm.parent_id || null,
      label: itemForm.label,
      link_type: itemForm.link_type,
      url: itemForm.link_type === "plugin" ? null : itemForm.url || null,
      plugin_slug: itemForm.link_type === "plugin" ? itemForm.plugin_slug || null : null,
      icon: itemForm.icon || null,
      open_in_new_tab: itemForm.open_in_new_tab,
    };
    if (editingItem) {
      const { error } = await supabase.from("menu_items").update(data).eq("id", editingItem.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Menu item updated" });
    } else {
      data.sort_order = items.filter(i => i.group_id === itemForm.group_id).length;
      const { error } = await supabase.from("menu_items").insert(data);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Menu item created" });
    }
    setItemDialogOpen(false);
    fetchAll();
  }

  async function deleteItem(id: string) {
    // Delete children first
    await supabase.from("menu_items").delete().eq("parent_id", id);
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Menu item deleted" });
    fetchAll();
  }

  async function toggleItem(id: string, active: boolean) {
    await supabase.from("menu_items").update({ is_active: !active }).eq("id", id);
    fetchAll();
  }

  const getGroupName = (groupId: string) => groups.find(g => g.id === groupId)?.name || "—";
  const getParentLabel = (parentId: string | null) => {
    if (!parentId) return "—";
    return items.find(i => i.id === parentId)?.label || "—";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MenuIcon className="w-6 h-6 text-primary" /> Menu Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage navigation menus for your website and dashboard.</p>
        </div>

        <Tabs defaultValue="groups">
          <TabsList>
            <TabsTrigger value="groups">Menu Groups ({groups.length})</TabsTrigger>
            <TabsTrigger value="items">Menu Items ({items.length})</TabsTrigger>
          </TabsList>

          {/* ===== GROUPS TAB ===== */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => openGroupDialog()} size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Group
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Slug</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="hidden md:table-cell">Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {groupSearch ? "No groups match your search." : "No menu groups yet."}
                        </TableCell>
                      </TableRow>
                    ) : pagedGroups.map(group => (
                      <TableRow key={group.id} className={!group.is_active ? "opacity-60" : ""}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs font-mono">{group.slug}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{POSITIONS.find(p => p.value === group.position)?.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{TARGETS.find(t => t.value === group.target)?.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <button onClick={() => toggleGroup(group.id, group.is_active)} title={group.is_active ? "Active" : "Inactive"}>
                            {group.is_active
                              ? <ToggleRight className="w-5 h-5 text-primary" />
                              : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                            }
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openGroupDialog(group)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteGroup(group.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Pagination page={groupPage} totalPages={groupTotalPages} onPageChange={setGroupPage} />
          </TabsContent>

          {/* ===== ITEMS TAB ===== */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => openItemDialog()} size="sm" disabled={groups.length === 0}>
                <Plus className="w-4 h-4 mr-1" /> New Item
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">URL / Plugin</TableHead>
                      <TableHead className="hidden lg:table-cell">Parent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {itemSearch ? "No items match your search." : "No menu items yet."}
                        </TableCell>
                      </TableRow>
                    ) : pagedItems.map(item => (
                      <TableRow key={item.id} className={!item.is_active ? "opacity-60" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.parent_id && <span className="text-muted-foreground text-xs">↳</span>}
                            {item.label}
                            {item.open_in_new_tab && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{getGroupName(item.group_id)}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{LINK_TYPES.find(l => l.value === item.link_type)?.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground truncate max-w-[200px]">
                          {item.link_type === "plugin" ? item.plugin_slug : item.url || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {getParentLabel(item.parent_id)}
                        </TableCell>
                        <TableCell>
                          <button onClick={() => toggleItem(item.id, item.is_active)}>
                            {item.is_active
                              ? <ToggleRight className="w-5 h-5 text-primary" />
                              : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                            }
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openItemDialog(item)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Pagination page={itemPage} totalPages={itemTotalPages} onPageChange={setItemPage} />
          </TabsContent>
        </Tabs>

        {/* Group Dialog */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "Edit Menu Group" : "New Menu Group"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))} placeholder="Main Navigation" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={groupForm.slug} onChange={e => setGroupForm(f => ({ ...f, slug: e.target.value }))} placeholder="main-navigation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Position</Label>
                  <Select value={groupForm.position} onValueChange={v => setGroupForm(f => ({ ...f, position: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target</Label>
                  <Select value={groupForm.target} onValueChange={v => setGroupForm(f => ({ ...f, target: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TARGETS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveGroup}>{editingGroup ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Item Dialog */}
        <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Group</Label>
                <Select value={itemForm.group_id} onValueChange={v => setItemForm(f => ({ ...f, group_id: v, parent_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Label</Label>
                <Input value={itemForm.label} onChange={e => setItemForm(f => ({ ...f, label: e.target.value }))} placeholder="Home" />
              </div>
              <div>
                <Label>Link Type</Label>
                <Select value={itemForm.link_type} onValueChange={v => setItemForm(f => ({ ...f, link_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map(lt => <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {itemForm.link_type === "plugin" ? (
                <div>
                  <Label>Plugin Slug</Label>
                  <Input value={itemForm.plugin_slug} onChange={e => setItemForm(f => ({ ...f, plugin_slug: e.target.value }))} placeholder="e.g. blog, shop, gallery" />
                </div>
              ) : (
                <div>
                  <Label>URL</Label>
                  <Input value={itemForm.url} onChange={e => setItemForm(f => ({ ...f, url: e.target.value }))} placeholder={itemForm.link_type === "external" ? "https://example.com" : "/about"} />
                </div>
              )}

              <div>
                <Label>Icon (optional)</Label>
                <IconPicker value={itemForm.icon} onChange={v => setItemForm(f => ({ ...f, icon: v }))} />
              </div>

              <div>
                <Label>Parent Item (optional)</Label>
                <Select value={itemForm.parent_id || "none"} onValueChange={v => setItemForm(f => ({ ...f, parent_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top level)</SelectItem>
                    {items.filter(i => i.group_id === itemForm.group_id && !i.parent_id && i.id !== editingItem?.id).map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Open in new tab</Label>
                <Switch checked={itemForm.open_in_new_tab} onCheckedChange={v => setItemForm(f => ({ ...f, open_in_new_tab: v }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveItem}>{editingItem ? "Update" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
