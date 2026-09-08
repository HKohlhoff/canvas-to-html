import type { HighlighterCore, LanguageInput, ThemeInput } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bashLanguage from "shiki/langs/bash.mjs";
import csharpLanguage from "shiki/langs/csharp.mjs";
import cssLanguage from "shiki/langs/css.mjs";
import htmlLanguage from "shiki/langs/html.mjs";
import javaLanguage from "shiki/langs/java.mjs";
import javascriptLanguage from "shiki/langs/javascript.mjs";
import jsonLanguage from "shiki/langs/json.mjs";
import latexLanguage from "shiki/langs/latex.mjs";
import markdownLanguage from "shiki/langs/markdown.mjs";
import phpLanguage from "shiki/langs/php.mjs";
import powershellLanguage from "shiki/langs/powershell.mjs";
import pythonLanguage from "shiki/langs/python.mjs";
import sqlLanguage from "shiki/langs/sql.mjs";
import texLanguage from "shiki/langs/tex.mjs";
import typescriptLanguage from "shiki/langs/typescript.mjs";
import yamlLanguage from "shiki/langs/yaml.mjs";
import catppuccinLatteTheme from "shiki/themes/catppuccin-latte.mjs";
import catppuccinMochaTheme from "shiki/themes/catppuccin-mocha.mjs";
import darkPlusTheme from "shiki/themes/dark-plus.mjs";
import githubDarkTheme from "shiki/themes/github-dark-default.mjs";
import githubLightTheme from "shiki/themes/github-light-default.mjs";
import lightPlusTheme from "shiki/themes/light-plus.mjs";
import materialLightTheme from "shiki/themes/material-theme-lighter.mjs";
import materialTheme from "shiki/themes/material-theme.mjs";
import oneDarkTheme from "shiki/themes/one-dark-pro.mjs";
import oneLightTheme from "shiki/themes/one-light.mjs";
import { escapeAttribute, escapeHtml } from "./html";
import type { HighlightingThemeChoice } from "./types";

const SHIKI_THEMES: Record<HighlightingThemeChoice, { dark: string; light: string }> = {
  shiki: {
    dark: "one-dark-pro",
    light: "one-light",
  },
  github: {
    dark: "github-dark-default",
    light: "github-light-default",
  },
  vscode: {
    dark: "dark-plus",
    light: "light-plus",
  },
  catppuccin: {
    dark: "catppuccin-mocha",
    light: "catppuccin-latte",
  },
  material: {
    dark: "material-theme",
    light: "material-theme-lighter",
  },
};

const SHIKI_FALLBACK_LANGUAGE = "text";

const shikiThemeModules: ThemeInput[] = [
  oneDarkTheme,
  oneLightTheme,
  githubDarkTheme,
  githubLightTheme,
  darkPlusTheme,
  lightPlusTheme,
  catppuccinMochaTheme,
  catppuccinLatteTheme,
  materialTheme,
  materialLightTheme,
];

const shikiLanguageModules: Record<string, LanguageInput> = {
  bash: bashLanguage,
  css: cssLanguage,
  csharp: csharpLanguage,
  html: htmlLanguage,
  java: javaLanguage,
  javascript: javascriptLanguage,
  json: jsonLanguage,
  latex: latexLanguage,
  markdown: markdownLanguage,
  php: phpLanguage,
  powershell: powershellLanguage,
  python: pythonLanguage,
  sql: sqlLanguage,
  tex: texLanguage,
  typescript: typescriptLanguage,
  yaml: yamlLanguage,
};

let shikiHighlighterPromise: Promise<HighlighterCore> | null = null;

async function getShikiHighlighter(): Promise<HighlighterCore> {
  if (!shikiHighlighterPromise) {
    shikiHighlighterPromise = (async () => {
      return createHighlighterCore({
        themes: shikiThemeModules,
        langs: Object.values(shikiLanguageModules),
        engine: createJavaScriptRegexEngine(),
      });
    })();
  }

  return shikiHighlighterPromise;
}

function normalizeCodeLanguage(lang: string): string {
  const normalized = String(lang || "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    "": SHIKI_FALLBACK_LANGUAGE,
    js: "javascript",
    ts: "typescript",
    "c#": "csharp",
    csharp: "csharp",
    cs: "csharp",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    ps1: "powershell",
    yml: "yaml",
    md: "markdown",
    tex: "latex",
    txt: "text",
    plaintext: "text",
  };

  return aliases[normalized] ?? normalized;
}

function resolveHighlightingTheme(choice: HighlightingThemeChoice | undefined, darkMode: boolean): string {
  const selected = SHIKI_THEMES[choice || "shiki"] || SHIKI_THEMES.shiki;
  return darkMode ? selected.dark : selected.light;
}

export async function renderCodeBlock(
  code: string,
  lang: string,
  darkMode: boolean,
  highlightingTheme?: HighlightingThemeChoice,
): Promise<string> {
  const normalizedLang = normalizeCodeLanguage(lang);
  const shikiTheme = resolveHighlightingTheme(highlightingTheme, darkMode);

  try {
    const highlighter = await getShikiHighlighter();
    const loaded = new Set(highlighter.getLoadedLanguages());
    if (!loaded.has(normalizedLang)) {
      const languageModule = shikiLanguageModules[normalizedLang];
      if (languageModule) {
        await highlighter.loadLanguage(languageModule);
      } else {
        await highlighter.loadLanguage(normalizedLang as never);
      }
    }
    return highlighter.codeToHtml(code, {
      lang: normalizedLang as never,
      theme: shikiTheme,
    });
  } catch {
    const className = lang ? ` class="language-${escapeAttribute(lang)}"` : "";
    return `<pre><code${className}>${escapeHtml(code)}</code></pre>`;
  }
}
