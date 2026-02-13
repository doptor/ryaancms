import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BrandingValues {
  primaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  darkMode: boolean;
  customCss: string;
}

const DEFAULT_BRANDING: BrandingValues = {
  primaryColor: "#6366f1",
  accentColor: "#8b5cf6",
  headingFont: "Inter",
  bodyFont: "Inter",
  darkMode: true,
  customCss: "",
};

const FONT_OPTIONS = [
  "Inter",
  "JetBrains Mono",
  "Georgia",
  "Playfair Display",
  "Merriweather",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Nunito",
  "Source Sans 3",
  "DM Sans",
  "Space Grotesk",
  "Outfit",
  "Sora",
  "Manrope",
];

// Convert hex to HSL string (e.g. "243 75% 58%")
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBranding(branding: BrandingValues) {
  const root = document.documentElement;

  // Apply primary color
  const primaryHsl = hexToHsl(branding.primaryColor);
  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--ring", primaryHsl);
  root.style.setProperty("--sidebar-primary", primaryHsl);
  root.style.setProperty("--sidebar-ring", primaryHsl);
  root.style.setProperty("--chart-1", primaryHsl);

  // Accent color
  const accentHsl = hexToHsl(branding.accentColor);
  root.style.setProperty("--accent-foreground", accentHsl);
  root.style.setProperty("--sidebar-accent-foreground", accentHsl);
  root.style.setProperty("--chart-2", accentHsl);

  // Gradient
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${primaryHsl}), hsl(${accentHsl}))`
  );

  // Fonts - load Google Fonts dynamically
  const fontsToLoad = new Set([branding.headingFont, branding.bodyFont]);
  fontsToLoad.forEach((font) => {
    if (font === "JetBrains Mono") return; // already loaded
    const id = `gfont-${font.replace(/\s/g, "-")}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800&display=swap`;
      document.head.appendChild(link);
    }
  });

  // Apply fonts via CSS custom properties used by tailwind
  root.style.setProperty("--font-heading", `"${branding.headingFont}", ui-sans-serif, system-ui, sans-serif`);
  root.style.setProperty("--font-body", `"${branding.bodyFont}", ui-sans-serif, system-ui, sans-serif`);
  document.body.style.fontFamily = `"${branding.bodyFont}", ui-sans-serif, system-ui, sans-serif`;

  // Apply heading font to all h1-h6
  let styleEl = document.getElementById("branding-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "branding-styles";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    h1, h2, h3, h4, h5, h6 { font-family: "${branding.headingFont}", ui-sans-serif, system-ui, sans-serif !important; }
    ${branding.customCss || ""}
  `;

  // Dark mode
  if (branding.darkMode) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

const BrandingContext = createContext<{
  branding: BrandingValues;
  loaded: boolean;
}>({ branding: DEFAULT_BRANDING, loaded: false });

export function useBranding() {
  return useContext(BrandingContext);
}

export { FONT_OPTIONS, DEFAULT_BRANDING };
export type { BrandingValues };

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingValues>(DEFAULT_BRANDING);
  const [loaded, setLoaded] = useState(false);

  // Load appearance settings
  useEffect(() => {
    const load = async () => {
      if (!user) {
        // Apply defaults for non-logged-in users
        applyBranding(DEFAULT_BRANDING);
        setLoaded(true);
        return;
      }

      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "appearance")
        .maybeSingle();

      const values = data?.value as Record<string, any> | null;
      const merged: BrandingValues = {
        primaryColor: values?.primaryColor || DEFAULT_BRANDING.primaryColor,
        accentColor: values?.accentColor || DEFAULT_BRANDING.accentColor,
        headingFont: values?.headingFont || DEFAULT_BRANDING.headingFont,
        bodyFont: values?.bodyFont || DEFAULT_BRANDING.bodyFont,
        darkMode: values?.darkMode ?? DEFAULT_BRANDING.darkMode,
        customCss: values?.customCss || DEFAULT_BRANDING.customCss,
      };

      setBranding(merged);
      applyBranding(merged);
      setLoaded(true);
    };

    load();
  }, [user]);

  // Re-apply whenever branding changes
  useEffect(() => {
    if (loaded) applyBranding(branding);
  }, [branding, loaded]);

  // Listen for settings saves to re-apply
  useEffect(() => {
    const handler = () => {
      // Re-fetch after save
      if (!user) return;
      supabase
        .from("site_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "appearance")
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value) {
            const v = data.value as Record<string, any>;
            const merged: BrandingValues = {
              primaryColor: v.primaryColor || DEFAULT_BRANDING.primaryColor,
              accentColor: v.accentColor || DEFAULT_BRANDING.accentColor,
              headingFont: v.headingFont || DEFAULT_BRANDING.headingFont,
              bodyFont: v.bodyFont || DEFAULT_BRANDING.bodyFont,
              darkMode: v.darkMode ?? DEFAULT_BRANDING.darkMode,
              customCss: v.customCss || DEFAULT_BRANDING.customCss,
            };
            setBranding(merged);
          }
        });
    };

    window.addEventListener("branding-updated", handler);
    return () => window.removeEventListener("branding-updated", handler);
  }, [user]);

  return (
    <BrandingContext.Provider value={{ branding, loaded }}>
      {children}
    </BrandingContext.Provider>
  );
}
