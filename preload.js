const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    runScheduler: (data) => ipcRenderer.invoke('run-scheduler', data)
});
