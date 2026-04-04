'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("@playwright/test");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG = {
    baseUrl: process.env.DEMO_URL || 'http://localhost:5173',
    outputDir: path_1.default.join(__dirname, '../screenshots'),
    viewport: { width: 1920, height: 1080 },
    mobileViewport: { width: 375, height: 812 },
    waitTimeout: 10000,
    browserPath: 'C:/Users/VIVIM.inc/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe',
};
const FLOWS = {
    onboarding: {
        name: 'Onboarding Flow',
        description: 'First-time user experience',
        pages: [
            { path: '/login', name: 'login-screen', wait: 2000 },
            { path: '/home', name: 'home-empty', wait: 3000 },
            { path: '/capture', name: 'capture-page', wait: 2000 },
            { path: '/for-you', name: 'for-you-feed', wait: 3000 },
        ],
    },
    'core-features': {
        name: 'Core Features',
        description: 'Main app features',
        pages: [
            { path: '/home', name: 'home-archive', wait: 2000 },
            { path: '/archive', name: 'archive-all', wait: 2000 },
            { path: '/for-you', name: 'for-you', wait: 3000 },
            { path: '/conversation/:id', name: 'conversation-view', wait: 3000 },
        ],
    },
    'knowledge-graph': {
        name: 'Knowledge Graph',
        description: 'Canvas and graph visualization',
        pages: [
            { path: '/canvas', name: 'canvas-view', wait: 5000 },
            { path: '/search?q=react', name: 'search-results', wait: 3000 },
        ],
    },
    sharing: {
        name: 'Sharing',
        description: 'Circles and sharing features',
        pages: [
            { path: '/circles', name: 'circles-list', wait: 2000 },
            { path: '/circles/founders', name: 'circle-detail', wait: 2000 },
        ],
    },
    social: {
        name: 'Social',
        description: 'Friends, groups, profile',
        pages: [
            { path: '/friends', name: 'friends-list', wait: 2000 },
            { path: '/groups', name: 'groups-list', wait: 2000 },
            { path: '/profile', name: 'profile-page', wait: 2000 },
        ],
    },
    investor: {
        name: 'Investor Demo',
        description: 'Key screenshots for investor deck',
        pages: [
            { path: '/home', name: 'investor-home', wait: 2000 },
            { path: '/for-you', name: 'investor-for-you', wait: 2000 },
            { path: '/canvas', name: 'investor-graph', wait: 3000 },
            { path: `/conversation/${process.env.DEMO_CONVERSATION_ID || ':id'}`, name: 'investor-conversation', wait: 2000 },
        ],
    },
};
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
async function capturePage(browser, url, outputPath, viewport, waitTime) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    try {
        console.log('  Capturing: ' + url);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(waitTime);
        await page.screenshot({ path: outputPath, fullPage: true });
        await context.close();
        return true;
    }
    catch (err) {
        console.error('  Failed: ' + (err instanceof Error ? err.message : err));
        await context.close();
        return false;
    }
}
async function runCapture(options) {
    if (options === void 0) { options = {}; }
    var _a = options.flow, flow = _a === void 0 ? 'investor' : _a, _b = options.device, device = _b === void 0 ? 'desktop' : _b, _c = options.skipExisting, skipExisting = _c === void 0 ? true : _c;
    var viewport = device === 'mobile' ? CONFIG.mobileViewport : CONFIG.viewport;
    var deviceName = device === 'mobile' ? 'mobile' : 'desktop';
    console.log('\n📸 VIVIM Screenshot Capture Tool\n');
    console.log('═'.repeat(50));
    console.log('Flow: ' + (FLOWS[flow] ? FLOWS[flow].name : flow));
    console.log('Device: ' + deviceName + ' (' + viewport.width + 'x' + viewport.height + ')');
    console.log('Output: ' + CONFIG.outputDir);
    console.log('═'.repeat(50) + '\n');
    var flowConfig = FLOWS[flow];
    if (!flowConfig) {
        console.error('Unknown flow: ' + flow);
        console.log('Available flows: ' + Object.keys(FLOWS).join(', '));
        process.exit(1);
    }
    ensureDir(CONFIG.outputDir);
    ensureDir(path_1.default.join(CONFIG.outputDir, flow));
    var browser = await playwright_1.chromium.launch({
        headless: true,
        executablePath: CONFIG.browserPath,
        timeout: 15000,
    });
    var successCount = 0;
    var skipCount = 0;
    for (var _i = 0, _d = flowConfig.pages; _i < _d.length; _i++) {
        var pageConfig = _d[_i];
        var filename = deviceName + '-' + pageConfig.name + '.png';
        var outputPath = path_1.default.join(CONFIG.outputDir, flow, filename);
        var fullUrl = pageConfig.path.startsWith('http')
            ? pageConfig.path
            : '' + CONFIG.baseUrl + pageConfig.path;
        if (skipExisting && fs_1.default.existsSync(outputPath)) {
            console.log('  Skipping existing: ' + filename);
            skipCount++;
            continue;
        }
        var success = await capturePage(browser, fullUrl, outputPath, viewport, pageConfig.wait);
        if (success) {
            successCount++;
            console.log('  Saved: ' + outputPath);
        }
    }
    await browser.close();
    console.log('\n' + '═'.repeat(50));
    console.log('Capture complete!');
    console.log('   Success: ' + successCount + ' | Skipped: ' + skipCount + ' | Total: ' + flowConfig.pages.length);
    console.log('═'.repeat(50) + '\n');
    return { successCount: successCount, skipCount: skipCount };
}
var args = process.argv.slice(2);
var flowArg = args.find(function (a) { return a.startsWith('--flow='); });
var deviceArg = args.find(function (a) { return a.startsWith('--device='); });
var flow = flowArg ? flowArg.split('=')[1] : 'investor';
var device = (deviceArg && deviceArg.split('=')[1]) || 'desktop';
runCapture({ flow: flow, device: device }).catch(function (err) {
    console.error('Capture failed:', err);
    process.exit(1);
});
