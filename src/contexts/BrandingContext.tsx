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

// Parse HSL string "H S% L%" into components
function parseHslParts(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.split(/\s+/);
  return {
    h: parseInt(parts[0]),
    s: parseInt(parts[1]),
    l: parseInt(parts[2]),
  };
}

function applyBranding(branding: BrandingValues) {
  const root = document.documentElement;

  const primaryHsl = hexToHsl(branding.primaryColor);
  const accentHsl = hexToHsl(branding.accentColor);
  const { h, s, l } = parseHslParts(primaryHsl);
  const { h: ah, s: as, l: al } = parseHslParts(accentHsl);

  // Dark mode variants: bump lightness for readability
  const primaryHslDark = `${h} ${s}% ${Math.min(l + 7, 80)}%`;
  const accentHslDark = `${ah} ${as}% ${Math.min(al + 15, 85)}%`;

  // Fonts - load Google Fonts dynamically
  const fontsToLoad = new Set([branding.headingFont, branding.bodyFont]);
  fontsToLoad.forEach((font) => {
    if (font === "JetBrains Mono") return;
    const id = `gfont-${font.replace(/\s/g, "-")}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800&display=swap`;
      document.head.appendChild(link);
    }
  });

  const fontHeading = `"${branding.headingFont}", ui-sans-serif, system-ui, sans-serif`;
  const fontBody = `"${branding.bodyFont}", ui-sans-serif, system-ui, sans-serif`;

  // Use a <style> element so .dark class specificity works correctly
  let styleEl = document.getElementById("branding-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "branding-styles";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    :root {
      --primary: ${primaryHsl};
      --ring: ${primaryHsl};
      --sidebar-primary: ${primaryHsl};
      --sidebar-ring: ${primaryHsl};
      --chart-1: ${primaryHsl};
      --accent-foreground: ${accentHsl};
      --sidebar-accent-foreground: ${accentHsl};
      --chart-2: ${accentHsl};
      --gradient-primary: linear-gradient(135deg, hsl(${primaryHsl}), hsl(${accentHsl}));
      --shadow-glow: 0 0 60px hsl(${primaryHsl} / 0.15);
      --shadow-primary: 0 8px 32px hsl(${primaryHsl} / 0.2);
      --font-heading: ${fontHeading};
      --font-body: ${fontBody};
    }
    .dark {
      --primary: ${primaryHslDark};
      --ring: ${primaryHslDark};
      --sidebar-primary: ${primaryHslDark};
      --sidebar-ring: ${primaryHslDark};
      --chart-1: ${primaryHslDark};
      --accent-foreground: ${accentHslDark};
      --sidebar-accent-foreground: ${accentHslDark};
      --chart-2: ${accentHslDark};
      --gradient-primary: linear-gradient(135deg, hsl(${primaryHsl}), hsl(${accentHsl}));
      --shadow-glow: 0 0 80px hsl(${primaryHsl} / 0.2);
      --shadow-primary: 0 8px 32px hsl(${primaryHsl} / 0.3);
      --font-heading: ${fontHeading};
      --font-body: ${fontBody};
    }
    body { font-family: ${fontBody}; }
    h1, h2, h3, h4, h5, h6 { font-family: ${fontHeading} !important; }
    ${branding.customCss || ""}
  `;

  // Dark mode + cache preference for instant load
  if (branding.darkMode) {
    root.classList.add("dark");
    try { localStorage.setItem("ryaan-theme", "dark"); } catch(e) {}
  } else {
    root.classList.remove("dark");
    try { localStorage.setItem("ryaan-theme", "light"); } catch(e) {}
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
      // For non-logged-in users, apply cached branding from localStorage or defaults instantly
      if (!user) {
        try {
          const cached = localStorage.getItem("ryaan-branding");
          if (cached) {
            const parsed = JSON.parse(cached);
            setBranding(parsed);
            applyBranding(parsed);
          } else {
            applyBranding(DEFAULT_BRANDING);
          }
        } catch {
          applyBranding(DEFAULT_BRANDING);
        }
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
      try { localStorage.setItem("ryaan-branding", JSON.stringify(merged)); } catch {}
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

  // Prevent flash of default branding while loading user preferences
  if (!loaded) {
    return (
      <div className="h-screen bg-background" />
    );
  }

  return (
    <BrandingContext.Provider value={{ branding, loaded }}>
      {children}
    </BrandingContext.Provider>
  );
}
