/**
 * Smart Prompt Analyzer — determines which pipeline steps are needed
 * based on the complexity and type of user request.
 */

export type BuildScope = "full" | "moderate" | "light" | "micro";

export interface PromptAnalysis {
  scope: BuildScope;
  stepsNeeded: number[];
  reason: string;
}

const MICRO_PATTERNS = [
  /^(change|update|edit|fix|modify|rename|replace)\s+(the\s+)?(text|title|heading|label|name|copy|description|placeholder|button text|color|font|size)/i,
  /^(make|set)\s+(it|the|this)\s+(bigger|smaller|bold|italic|centered|left|right)/i,
  /^(remove|delete|hide)\s+(the\s+)?(text|title|heading|label|button|section)/i,
  /^(add|insert)\s+(a\s+)?(text|title|heading|label|subtitle|paragraph)/i,
];

const LIGHT_PATTERNS = [
  /^(add|insert|create)\s+(a\s+)?(button|link|icon|image|badge|tag|divider|separator)/i,
  /^(change|update|modify)\s+(the\s+)?(style|theme|color|layout|spacing|padding|margin)/i,
  /^(move|reorder|swap|rearrange)\s/i,
  /^(show|hide|toggle)\s/i,
  /^(add|remove)\s+(a\s+)?(field|column|row|item)/i,
];

const MODERATE_PATTERNS = [
  /^(add|create|build)\s+(a\s+)?(page|section|component|form|table|card|modal|dialog|sidebar|navbar|footer)/i,
  /^(add|create|implement)\s+(a\s+)?(search|filter|sort|pagination)/i,
  /^(redesign|rebuild|improve|upgrade)\s+(the\s+)?(page|section|component)/i,
];

// All 17 step indices
const ALL_STEPS = Array.from({ length: 17 }, (_, i) => i);

// Core understanding + planning + designing + finalizing
const MODERATE_STEPS = [0, 1, 2, 3, 6, 7, 10, 11, 15, 16];

// Understanding + designing + finalizing
const LIGHT_STEPS = [0, 6, 10, 15, 16];

// Just understanding + finalizing
const MICRO_STEPS = [0, 15, 16];

export function analyzePrompt(prompt: string): PromptAnalysis {
  const trimmed = prompt.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // Very short prompts about text/style changes
  if (wordCount <= 12) {
    for (const pattern of MICRO_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { scope: "micro", stepsNeeded: MICRO_STEPS, reason: "Simple text/style change detected" };
      }
    }
  }

  if (wordCount <= 20) {
    for (const pattern of LIGHT_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { scope: "light", stepsNeeded: LIGHT_STEPS, reason: "Minor UI adjustment detected" };
      }
    }
  }

  if (wordCount <= 40) {
    for (const pattern of MODERATE_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { scope: "moderate", stepsNeeded: MODERATE_STEPS, reason: "Component/section-level change detected" };
      }
    }
  }

  // Check for keywords suggesting full build
  const fullBuildKeywords = [
    "build", "create", "generate", "make me", "design",
    "e-commerce", "saas", "dashboard", "platform", "app", "website",
    "with auth", "with database", "with payment", "full", "complete",
  ];

  const hasFullBuildKeyword = fullBuildKeywords.some(k => trimmed.toLowerCase().includes(k));
  const isComplex = wordCount > 30 || (hasFullBuildKeyword && wordCount > 15);

  if (isComplex) {
    return { scope: "full", stepsNeeded: ALL_STEPS, reason: "Full application build required" };
  }

  // Default to moderate for medium-length prompts
  if (wordCount > 20) {
    return { scope: "moderate", stepsNeeded: MODERATE_STEPS, reason: "Moderate complexity detected" };
  }

  // Short but unmatched — default to light
  return { scope: "light", stepsNeeded: LIGHT_STEPS, reason: "Standard change detected" };
}
