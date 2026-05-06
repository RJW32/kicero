#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

async function launchBrowser() {
  // On Linux (e.g. Cloudflare Pages build) use @sparticuz/chromium, which
  // ships a self-contained Chromium that doesn't depend on system libs like
  // libatk-1.0.so.0. Locally (e.g. macOS) fall back to the chromium that
  // puppeteer downloads on install.
  if (process.platform === 'linux') {
    const {default: chromium} = await import('@sparticuz/chromium');
    return puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const distDir = join(projectRoot, 'dist');

const PREVIEW_PORT = 4178;
const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
const SITE_ORIGIN = 'https://kicero.co.uk';

const blogSlugs = [
  'how-much-should-a-small-business-website-cost-uk-2026',
  'why-scottish-small-businesses-need-fast-simple-websites',
  'custom-website-vs-wix-vs-squarespace',
];

const routes = [
  '/',
  '/services',
  '/portfolio',
  '/contact',
  '/blog',
  ...blogSlugs.map((slug) => `/blog/${slug}`),
  '/privacy',
  '/terms',
];

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function startPreviewServer() {
  const proc = spawn(
    'npx',
    [
      'vite',
      'preview',
      '--port',
      String(PREVIEW_PORT),
      '--host',
      PREVIEW_HOST,
      '--strictPort',
    ],
    {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {...process.env, FORCE_COLOR: '0', NO_COLOR: '1'},
    },
  );

  proc.stdout.on('data', (chunk) => {
    process.stdout.write(`[preview] ${chunk}`);
  });
  proc.stderr.on('data', (chunk) => {
    process.stderr.write(`[preview] ${chunk}`);
  });
  // Don't let the piped stdio keep our event loop alive once we've signalled
  // the child to exit (Cloudflare's build runner has been hanging here).
  proc.stdout?.unref?.();
  proc.stderr?.unref?.();
  proc.unref?.();

  return proc;
}

async function stopPreviewServer(proc, graceMs = 3_000) {
  if (!proc || proc.exitCode !== null || proc.killed) return;

  const exited = new Promise((resolve) => {
    proc.once('exit', () => resolve());
    proc.once('close', () => resolve());
  });

  try {
    proc.kill('SIGTERM');
  } catch {}

  const timedOut = await Promise.race([
    exited.then(() => false),
    sleep(graceMs).then(() => true),
  ]);

  if (timedOut && proc.exitCode === null) {
    try {
      proc.kill('SIGKILL');
    } catch {}
    await Promise.race([exited, sleep(2_000)]);
  }
}

async function closeBrowserSafely(browser, timeoutMs = 8_000) {
  if (!browser) return;
  try {
    await Promise.race([
      browser.close(),
      sleep(timeoutMs).then(() => {
        throw new Error('browser.close() timed out');
      }),
    ]);
  } catch (err) {
    console.warn(
      `[prerender] browser.close() failed: ${
        err instanceof Error ? err.message : String(err)
      } - falling back to killing the browser process`,
    );
    try {
      const proc = browser.process?.();
      if (proc && proc.exitCode === null) {
        proc.kill('SIGKILL');
      }
    } catch {}
  }
}

async function waitForServer(url, proc, timeoutMs = 60_000) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    if (proc.exitCode !== null) {
      throw new Error(
        `Preview server exited with code ${proc.exitCode} before becoming ready`,
      );
    }
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
      lastError = new Error(`status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await sleep(500);
  }
  throw new Error(
    `Preview server never responded at ${url} (last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    })`,
  );
}

async function prerender(browser, route) {
  const page = await browser.newPage();
  await page.setViewport({width: 1280, height: 800});

  const targetUrl = `${PREVIEW_URL}${route}?prerender=1`;
  const response = await page.goto(targetUrl, {
    waitUntil: 'networkidle0',
    timeout: 30_000,
  });

  const status = response?.status();
  if (!response || status >= 500) {
    await page.close();
    throw new Error(`Failed to load ${targetUrl} (status ${status})`);
  }

  await page.waitForSelector('#main-content', {timeout: 10_000});
  await sleep(400);

  const html = await page.content();

  const sanitized = html
    .replace(/\?prerender=1/g, '')
    .replace(/href="(\/[^"]*)\?prerender=1"/g, 'href="$1"');

  await page.close();
  return sanitized;
}

async function writeRouteHtml(route, html) {
  const target =
    route === '/'
      ? join(distDir, 'index.html')
      : join(distDir, route.replace(/^\//, ''), 'index.html');
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, html, 'utf-8');
  console.log(`  wrote ${target.replace(projectRoot + '/', '')}`);
}

function buildSitemap(allRoutes) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = allRoutes
    .map((route) => {
      const loc = `${SITE_ORIGIN}${route === '/' ? '' : route}`;
      const priority =
        route === '/' ? '1.0' : route.startsWith('/blog/') ? '0.7' : '0.8';
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  await readFile(join(distDir, 'index.html'), 'utf-8');

  console.log('Starting preview server...');
  const previewProc = startPreviewServer();

  try {
    await waitForServer(PREVIEW_URL, previewProc);
    console.log(`Preview ready at ${PREVIEW_URL}`);

    const browser = await launchBrowser();

    try {
      for (const route of routes) {
        console.log(`Prerendering ${route}`);
        const html = await prerender(browser, route);
        await writeRouteHtml(route, html);
      }

      const sitemap = buildSitemap(routes);
      await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf-8');
      console.log('  wrote dist/sitemap.xml');
    } finally {
      await closeBrowserSafely(browser);
    }
  } finally {
    await stopPreviewServer(previewProc);
  }
}

// Hard-exit safety net: if anything (Chromium subprocesses, dangling sockets,
// piped stdio) keeps the event loop alive after main() resolves, Cloudflare
// will eventually time the build out. We've written every artifact we need
// to disk by the time main() resolves successfully, so it's safe to force-exit.
const HARD_EXIT_MS = 10_000;

main()
  .then(() => {
    setTimeout(() => process.exit(0), HARD_EXIT_MS).unref();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    setTimeout(() => process.exit(1), HARD_EXIT_MS).unref();
    process.exit(1);
  });
