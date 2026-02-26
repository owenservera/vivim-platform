# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:esbuild] Transform failed with 3 errors: C:/0-BlackBoxProject-0/vivim-app-og/vivim-app/pwa/src/stores/index.ts:6:9: ERROR: Multiple exports with the same name \"useSettingsStore\" C:/0-BlackBoxProject-0/vivim-app-og/vivim-app/pwa/src/stores/index.ts:7:9: ERROR: Multiple exports with the same name \"useSyncStore\" C:/0-BlackBoxProject-0/vivim-app-og/vivim-app/pwa/src/stores/index.ts:8:9: ERROR: Multiple exports with the same name \"useUIStore\""
  - generic [ref=e5]: C:/0-BlackBoxProject-0/vivim-app-og/vivim-app/pwa/src/stores/index.ts:6:9
  - generic [ref=e6]: "Multiple exports with the same name \"useSettingsStore\" 4 | export { useUIStore } from './ui.store'; 5 | export { useAppStore } from './appStore'; 6 | export { useSettingsStore } from './settings.store'; | ^ 7 | export { useSyncStore } from './sync.store'; 8 | export { useUIStore } from './ui.store'; Multiple exports with the same name \"useSyncStore\" 5 | export { useAppStore } from './appStore'; 6 | export { useSettingsStore } from './settings.store'; 7 | export { useSyncStore } from './sync.store'; | ^ 8 | export { useUIStore } from './ui.store'; 9 | Multiple exports with the same name \"useUIStore\" 6 | export { useSettingsStore } from './settings.store'; 7 | export { useSyncStore } from './sync.store'; 8 | export { useUIStore } from './ui.store'; | ^ 9 |"
  - generic [ref=e7]: at failureErrorWithLog (C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\node_modules\.bun\esbuild@0.27.3\node_modules\esbuild\lib\main.js:1467:19) at <anonymous> (C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\node_modules\.bun\esbuild@0.27.3\node_modules\esbuild\lib\main.js:736:50) at <anonymous> (C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\node_modules\.bun\esbuild@0.27.3\node_modules\esbuild\lib\main.js:603:9) at handleIncomingPacket (C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\node_modules\.bun\esbuild@0.27.3\node_modules\esbuild\lib\main.js:658:12) at readFromStdout (C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\node_modules\.bun\esbuild@0.27.3\node_modules\esbuild\lib\main.js:581:7) at emit (node:events:95:22) at addChunk (internal:streams/readable:264:47) at readableAddChunkPushByteMode (internal:streams/readable:242:18) at handleArrayBufferViewResult (internal:streams/native-readable:89:16) at <anonymous> (internal:streams/native-readable:53:68) at processTicksAndRejections (native)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```