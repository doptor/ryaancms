import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Globe, Plus, X, Download, Copy, Check, Languages } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";

interface Props {
  pipelineState: PipelineState | null;
}

const POPULAR_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "bn", name: "Bangla", flag: "🇧🇩" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
];

type TranslationEntry = Record<string, string>;

export function I18nGeneratorPanel({ pipelineState }: Props) {
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["en"]);
  const [translations, setTranslations] = useState<Record<string, TranslationEntry>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const config = pipelineState?.config;

  const extractKeys = (): string[] => {
    if (!config) return [];
    const keys = new Set<string>();
    keys.add("app.title");
    keys.add("app.description");
    keys.add("nav.home");
    keys.add("nav.dashboard");
    keys.add("nav.settings");
    keys.add("nav.logout");
    keys.add("auth.login");
    keys.add("auth.signup");
    keys.add("auth.email");
    keys.add("auth.password");
    keys.add("common.save");
    keys.add("common.cancel");
    keys.add("common.delete");
    keys.add("common.edit");
    keys.add("common.search");
    keys.add("common.loading");
    keys.add("common.error");
    keys.add("common.success");

    config.pages.forEach((p) => {
      keys.add(`page.${p.name.toLowerCase().replace(/\s+/g, "_")}.title`);
      p.components.forEach((c) => {
        if (c.props?.title) keys.add(`component.${c.type}.title`);
        if (c.props?.subtitle) keys.add(`component.${c.type}.subtitle`);
        if (c.props?.cta_text) keys.add(`component.${c.type}.cta`);
      });
    });

    config.collections.forEach((col) => {
      keys.add(`collection.${col.name}.name`);
      col.fields.forEach((f) => {
        keys.add(`field.${col.name}.${f.name}`);
      });
    });

    return Array.from(keys).sort();
  };

  const generateTranslations = () => {
    setIsGenerating(true);
    const keys = extractKeys();

    // Generate mock translations (in real app, this would call an AI translation API)
    const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
      en: { "app.title": config?.title || "App", "app.description": config?.description || "", "nav.home": "Home", "nav.dashboard": "Dashboard", "nav.settings": "Settings", "nav.logout": "Logout", "auth.login": "Login", "auth.signup": "Sign Up", "auth.email": "Email", "auth.password": "Password", "common.save": "Save", "common.cancel": "Cancel", "common.delete": "Delete", "common.edit": "Edit", "common.search": "Search", "common.loading": "Loading...", "common.error": "Error", "common.success": "Success" },
      bn: { "app.title": config?.title || "অ্যাপ", "app.description": config?.description || "", "nav.home": "হোম", "nav.dashboard": "ড্যাশবোর্ড", "nav.settings": "সেটিংস", "nav.logout": "লগআউট", "auth.login": "লগইন", "auth.signup": "সাইন আপ", "auth.email": "ইমেইল", "auth.password": "পাসওয়ার্ড", "common.save": "সংরক্ষণ", "common.cancel": "বাতিল", "common.delete": "মুছুন", "common.edit": "সম্পাদনা", "common.search": "অনুসন্ধান", "common.loading": "লোড হচ্ছে...", "common.error": "ত্রুটি", "common.success": "সফল" },
      es: { "app.title": config?.title || "Aplicación", "nav.home": "Inicio", "nav.dashboard": "Panel", "nav.settings": "Ajustes", "nav.logout": "Cerrar sesión", "auth.login": "Iniciar sesión", "auth.signup": "Registrarse", "auth.email": "Correo", "auth.password": "Contraseña", "common.save": "Guardar", "common.cancel": "Cancelar", "common.delete": "Eliminar", "common.edit": "Editar", "common.search": "Buscar", "common.loading": "Cargando...", "common.error": "Error", "common.success": "Éxito" },
      fr: { "app.title": config?.title || "Application", "nav.home": "Accueil", "nav.dashboard": "Tableau de bord", "nav.settings": "Paramètres", "nav.logout": "Déconnexion", "auth.login": "Connexion", "auth.signup": "S'inscrire", "auth.email": "E-mail", "auth.password": "Mot de passe", "common.save": "Enregistrer", "common.cancel": "Annuler", "common.delete": "Supprimer", "common.edit": "Modifier", "common.search": "Rechercher", "common.loading": "Chargement...", "common.error": "Erreur", "common.success": "Succès" },
      ar: { "app.title": config?.title || "تطبيق", "nav.home": "الرئيسية", "nav.dashboard": "لوحة التحكم", "nav.settings": "الإعدادات", "nav.logout": "تسجيل الخروج", "auth.login": "تسجيل الدخول", "auth.signup": "التسجيل", "auth.email": "البريد الإلكتروني", "auth.password": "كلمة المرور", "common.save": "حفظ", "common.cancel": "إلغاء", "common.delete": "حذف", "common.edit": "تعديل", "common.search": "بحث", "common.loading": "جار التحميل...", "common.error": "خطأ", "common.success": "نجاح" },
      de: { "nav.home": "Startseite", "nav.dashboard": "Dashboard", "nav.settings": "Einstellungen", "nav.logout": "Abmelden", "auth.login": "Anmelden", "auth.signup": "Registrieren", "common.save": "Speichern", "common.cancel": "Abbrechen", "common.delete": "Löschen", "common.edit": "Bearbeiten", "common.search": "Suchen", "common.loading": "Laden...", "common.error": "Fehler", "common.success": "Erfolg" },
      zh: { "nav.home": "首页", "nav.dashboard": "仪表板", "nav.settings": "设置", "nav.logout": "退出", "auth.login": "登录", "auth.signup": "注册", "common.save": "保存", "common.cancel": "取消", "common.delete": "删除", "common.edit": "编辑", "common.search": "搜索", "common.loading": "加载中...", "common.error": "错误", "common.success": "成功" },
      ja: { "nav.home": "ホーム", "nav.dashboard": "ダッシュボード", "nav.settings": "設定", "nav.logout": "ログアウト", "auth.login": "ログイン", "auth.signup": "新規登録", "common.save": "保存", "common.cancel": "キャンセル", "common.delete": "削除", "common.edit": "編集", "common.search": "検索", "common.loading": "読み込み中...", "common.error": "エラー", "common.success": "成功" },
      hi: { "nav.home": "होम", "nav.dashboard": "डैशबोर्ड", "nav.settings": "सेटिंग्स", "nav.logout": "लॉग आउट", "auth.login": "लॉग इन", "auth.signup": "साइन अप", "common.save": "सहेजें", "common.cancel": "रद्द करें", "common.delete": "हटाएं", "common.edit": "संपादित करें", "common.search": "खोजें", "common.loading": "लोड हो रहा है...", "common.error": "त्रुटि", "common.success": "सफल" },
    };

    const result: Record<string, TranslationEntry> = {};
    selectedLangs.forEach((lang) => {
      result[lang] = {};
      keys.forEach((key) => {
        result[lang][key] = MOCK_TRANSLATIONS[lang]?.[key] || `[${lang}] ${key}`;
      });
    });

    setTimeout(() => {
      setTranslations(result);
      setIsGenerating(false);
      toast({ title: "🌍 Translations generated!", description: `${keys.length} keys × ${selectedLangs.length} languages` });
    }, 800);
  };

  const toggleLang = (code: string) => {
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const handleCopy = (key: string) => {
    const data: Record<string, string> = {};
    selectedLangs.forEach((lang) => {
      data[lang] = translations[lang]?.[key] || "";
    });
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(translations, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "i18n-translations.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "i18n translations downloaded." });
  };

  const keys = extractKeys();
  const hasTranslations = Object.keys(translations).length > 0;

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">i18n Generator</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to generate translations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Languages className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">i18n Generator</h3>
              <p className="text-[11px] text-muted-foreground">{keys.length} translatable keys detected</p>
            </div>
          </div>
          {hasTranslations && (
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1 text-xs">
              <Download className="w-3 h-3" /> Export JSON
            </Button>
          )}
        </div>

        {/* Language selector */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => toggleLang(lang.code)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors ${
                selectedLangs.includes(lang.code)
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={generateTranslations}
          disabled={isGenerating || selectedLangs.length === 0}
          className="w-full gap-1.5"
        >
          {isGenerating ? "Generating..." : `Generate ${selectedLangs.length} Language(s)`}
        </Button>
      </div>

      {/* Translation table */}
      <ScrollArea className="flex-1">
        {hasTranslations ? (
          <div className="p-4 space-y-2">
            {keys.map((key) => (
              <div key={key} className="rounded-lg border border-border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <code className="text-[11px] font-mono text-primary">{key}</code>
                  <button onClick={() => handleCopy(key)} className="text-muted-foreground hover:text-foreground">
                    {copiedKey === key ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="space-y-1">
                  {selectedLangs.map((lang) => (
                    <div key={lang} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center">{POPULAR_LANGUAGES.find(l => l.code === lang)?.flag || lang}</span>
                      <span className="text-foreground">{translations[lang]?.[key] || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Select languages and click Generate to create translations.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
