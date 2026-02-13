import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, GripVertical, ChevronDown, ChevronRight, ExternalLink, Puzzle, FileText, Link2, ToggleLeft, ToggleRight, Menu as MenuIcon } from "lucide-react";
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

const POSITIONS = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "sidebar", label: "Sidebar" },
  { value: "dashboard-sidebar", label: "Dashboard Sidebar" },
  { value: "dashboard-header", label: "Dashboard Header" },
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

export default function MenuBuilderPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Group dialog
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", slug: "", position: "header", target: "frontend" });

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({ label: "", link_type: "custom", url: "", plugin_slug: "", icon: "", open_in_new_tab: false, group_id: "", parent_id: "" });

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
    if (gRes.data) setExpandedGroups(new Set(gRes.data.map((g: MenuGroup) => g.id)));
    setLoading(false);
  }

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
  function openItemDialog(groupId: string, item?: MenuItem) {
    if (item) {
      setEditingItem(item);
      setItemForm({ label: item.label, link_type: item.link_type, url: item.url || "", plugin_slug: item.plugin_slug || "", icon: item.icon || "", open_in_new_tab: item.open_in_new_tab, group_id: item.group_id, parent_id: item.parent_id || "" });
    } else {
      setEditingItem(null);
      setItemForm({ label: "", link_type: "custom", url: "", plugin_slug: "", icon: "", open_in_new_tab: false, group_id: groupId, parent_id: "" });
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
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Menu item deleted" });
    fetchAll();
  }

  async function toggleItem(id: string, active: boolean) {
    await supabase.from("menu_items").update({ is_active: !active }).eq("id", id);
    fetchAll();
  }

  function toggleExpand(id: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const groupItems = (groupId: string) => items.filter(i => i.group_id === groupId && !i.parent_id);
  const childItems = (parentId: string) => items.filter(i => i.parent_id === parentId);

  const linkTypeIcon = (type: string) => {
    const lt = LINK_TYPES.find(l => l.value === type);
    return lt ? lt.icon : Link2;
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
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MenuIcon className="w-6 h-6 text-primary" /> Menu Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage navigation menus for your website and dashboard.</p>
          </div>
          <Button onClick={() => openGroupDialog()} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Group
          </Button>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MenuIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No menu groups yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <Card key={group.id} className={!group.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(group.id)}>
                      {expandedGroups.has(group.id) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{POSITIONS.find(p => p.value === group.position)?.label}</Badge>
                      <Badge variant="outline" className="text-xs">{TARGETS.find(t => t.value === group.target)?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleGroup(group.id, group.is_active)} title={group.is_active ? "Deactivate" : "Activate"}>
                        {group.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openGroupDialog(group)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteGroup(group.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedGroups.has(group.id) && (
                  <CardContent className="pt-0">
                    <Separator className="mb-3" />
                    {groupItems(group.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No menu items. Add one below.</p>
                    ) : (
                      <div className="space-y-1">
                        {groupItems(group.id).map(item => {
                          const Icon = linkTypeIcon(item.link_type);
                          const children = childItems(item.id);
                          return (
                            <div key={item.id}>
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50 group ${!item.is_active ? "opacity-50" : ""}`}>
                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm flex-1 font-medium">{item.label}</span>
                                {item.url && <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">{item.url}</span>}
                                {item.plugin_slug && <Badge variant="secondary" className="text-xs">{item.plugin_slug}</Badge>}
                                {item.open_in_new_tab && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleItem(item.id, item.is_active)}>
                                    {item.is_active ? <ToggleRight className="w-3.5 h-3.5 text-green-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemDialog(group.id, item)}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(item.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {/* Children */}
                              {children.map(child => {
                                const ChildIcon = linkTypeIcon(child.link_type);
                                return (
                                  <div key={child.id} className={`flex items-center gap-2 px-3 py-2 pl-10 rounded-md hover:bg-accent/50 group ${!child.is_active ? "opacity-50" : ""}`}>
                                    <ChildIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm flex-1">{child.label}</span>
                                    {child.url && <span className="text-xs text-muted-foreground truncate max-w-[150px] hidden sm:inline">{child.url}</span>}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleItem(child.id, child.is_active)}>
                                        {child.is_active ? <ToggleRight className="w-3.5 h-3.5 text-green-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemDialog(group.id, child)}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(child.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => openItemDialog(group.id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Menu Item
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

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
                  <p className="text-xs text-muted-foreground mt-1">Enter the slug of an installed plugin to link to it.</p>
                </div>
              ) : (
                <div>
                  <Label>URL</Label>
                  <Input value={itemForm.url} onChange={e => setItemForm(f => ({ ...f, url: e.target.value }))} placeholder={itemForm.link_type === "external" ? "https://example.com" : "/about"} />
                </div>
              )}

              <div>
                <Label>Icon (optional)</Label>
                <Input value={itemForm.icon} onChange={e => setItemForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. home, settings, star" />
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
