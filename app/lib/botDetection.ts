/**
 * Client-side check for known bots/crawlers/automation tools, used to skip
 * loading analytics scripts (GTM, GA4, Meta Pixel, TikTok Pixel) entirely.
 *
 * Broader than the existing server-side isbot() check in entry.server.tsx
 * (isbot v3.8.0's bundled pattern list predates most LLM/AI crawlers and is
 * only used there to pick an SSR streaming strategy, not to gate
 * analytics).
 *
 * IMPORTANT — what this can and can't actually catch (confirmed against
 * vendor docs and independent technical analysis, July 2026): GPTBot,
 * ChatGPT-User, OAI-SearchBot (OpenAI); ClaudeBot, Claude-User,
 * Claude-SearchBot (Anthropic); PerplexityBot, Perplexity-User; CCBot
 * (Common Crawl); Bytespider (ByteDance); and Amazonbot are all documented
 * as fetching raw HTML with no JavaScript engine at all. None of them can
 * ever reach this code path regardless of the regex below, because the
 * analytics script itself never executes for a request that never runs JS
 * in the first place — this is *not* a gap in this check, it's a structural
 * property of how those crawlers work. They're listed here purely as
 * harmless defense-in-depth in case that ever changes, not because this is
 * expected to filter them in practice.
 *
 * What this check actually protects against is the traffic that DOES run a
 * real JS engine and would otherwise pollute GA4/Meta/Ads/TikTok like a
 * genuine visitor: headless-browser automation frameworks (Puppeteer,
 * Playwright, Selenium) and scrapers built on them. Google's own crawlers
 * (Googlebot, Google-Extended, GoogleOther) are a partial exception — they
 * share Google's headless rendering infrastructure and do render JS in a
 * second crawl phase — so they're included in the generic pattern too.
 *
 * To actually *measure* real LLM/AI crawler traffic (as opposed to
 * filtering its accidental appearance in client-side analytics), the
 * correct tool is server-side: Cloudflare's Bot Analytics / Verified Bots
 * (once zone access is set up) or raw Oxygen access logs — not GA4, which
 * is structurally blind to any request that never executes its tracking
 * script.
 *
 * Sources: developers.openai.com/api/docs/bots · support.claude.com (Claude
 * crawlers) · developers.google.com/crawling/docs/crawlers-fetchers ·
 * docs.perplexity.ai/docs/resources/perplexity-crawlers ·
 * commoncrawl.org/ccbot · developer.amazon.com/amazonbot ·
 * w3.org/TR/webdriver2 (navigator.webdriver) ·
 * github.com/omrilotan/isbot (generic bot/spider pattern, including its
 * own negative-lookbehind fix for brand names like the CUBOT phone that
 * would otherwise false-positive on a bare "bot" substring match).
 */
const NAMED_AI_CRAWLER_PATTERN =
  /gptbot|chatgpt-user|oai-searchbot|claudebot|claude-user|claude-searchbot|perplexitybot|perplexity-user|ccbot|bytespider|google-extended|amazonbot|meta-externalagent|meta-externalfetcher|meta-webindexer|facebookexternalhit/i;

// Borrowed from isbot (github.com/omrilotan/isbot, src/patterns.json) —
// already carries the negative lookbehind that excludes "CUBOT" (a real
// Android phone brand) from matching the bare "bot" suffix.
const GENERIC_BOT_PATTERN =
  /(?<! cu)bots?(?:\b|_)|crawl|spider|slurp|fetcher|prerender/i;

const AUTOMATION_FRAMEWORK_PATTERN =
  /headlesschrome|puppeteer|playwright|phantomjs|selenium/i;

function hasBotUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    NAMED_AI_CRAWLER_PATTERN.test(ua) ||
    GENERIC_BOT_PATTERN.test(ua) ||
    AUTOMATION_FRAMEWORK_PATTERN.test(ua)
  );
}

/**
 * navigator.webdriver (W3C WebDriver spec, NavigatorAutomationInformation
 * mixin) — Selenium/Playwright/Puppeteer all set this true by default in an
 * unmodified session. Catches headful automation and UA-spoofed scrapers
 * the string check above misses. Not foolproof: stealth plugins
 * (puppeteer-extra-plugin-stealth, undetected-chromedriver) patch this
 * property specifically to evade detection — one layer, not a sole gate.
 */
function hasWebdriverFlag(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.webdriver === true;
}

export function isLikelyBot(): boolean {
  return hasBotUserAgent() || hasWebdriverFlag();
}
