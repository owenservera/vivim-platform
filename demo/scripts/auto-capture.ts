import { spawn } from 'child_process';

async function waitForServer(url: string, timeoutMs: number = 60000): Promise<boolean> {
  const start = Date.now();
  console.log(`⏳ Polling ${url}...`);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Ignored, server not up yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function runAutoCapture() {
  console.log('🤖 Starting fully automated capture pipeline...');
  
  // 1. Spawn Dev Server
  const devServer = spawn('bun', ['run', 'dev'], { 
    cwd: process.cwd(), 
    shell: true, 
    stdio: 'ignore' 
  });
  
  console.log('⏳ Waiting for development server (http://localhost:5173)...');
  
  // 2. Wait for connectivity
  const isUp = await waitForServer('http://localhost:5173');
  
  if (!isUp) {
    console.error('❌ Development server failed to start within 60s.');
    devServer.kill();
    process.exit(1);
  }
  
  console.log('✅ Server is up! Executing highlights capture...');

  // 3. Execute demo-highlights
  const captureProcess = spawn('bun', ['run', 'demo/scripts/demo-highlights.ts', '--focus=knowledgeGraph', '--record-video'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit'
  });

  captureProcess.on('close', (code) => {
    console.log(`\n🎉 Capture completed with code ${code}. Cleaning up dev server...`);
    devServer.kill();
    // Also kill potentially orphaned tree on Windows
    spawn('taskkill', ['/pid', devServer.pid!.toString(), '/f', '/t']);
    process.exit(code || 0);
  });
}

runAutoCapture().catch(err => {
  console.error(err);
  process.exit(1);
});
