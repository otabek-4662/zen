import { contextBridge } from 'electron';

// Securely expose a minimal, read-only API to the renderer.
// contextIsolation keeps this bridge separate from the page's
// JavaScript context, so no Node.js internals leak to the UI.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  // Placeholder hook for future TDLib-backed IPC calls.
  // Real Telegram connectivity would be wired through ipcRenderer here.
  isDesktop: true,
});
