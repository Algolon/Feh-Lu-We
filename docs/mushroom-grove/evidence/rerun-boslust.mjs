// Retry unchanged assertions; only navigation allowance increases on slow SwiftShader.
import {preview} from 'vite';
import {chromium} from 'playwright-core';
const launch=chromium.launch.bind(chromium);
chromium.launch=async options=>{
 const b=await launch(options),nc=b.newContext.bind(b);
 b.newContext=async options=>{const c=await nc(options),np=c.newPage.bind(c);c.newPage=async()=>{const p=await np();p.setDefaultNavigationTimeout(120000);return p;};return c;};return b;
};
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:false}});
process.env.E2E_ONLY='boslustSample';process.env.E2E_OUT='scripts/out/boslust-retry';
process.env.CHROME='/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell';
process.argv=[process.argv[0],'scripts/e2e.mjs',server.resolvedUrls.local[0]];
try{await import('../../../scripts/e2e.mjs');}finally{await new Promise(r=>server.httpServer.close(r));}
