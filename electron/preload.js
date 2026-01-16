import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
    onBackendStatusChange: (callback) => ipcRenderer.on('backend-status-change', callback)
});
