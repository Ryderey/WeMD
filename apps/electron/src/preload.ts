import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    isElectron: true,
    platform: process.platform,

    fs: {
        selectWorkspace: () => ipcRenderer.invoke('workspace:select'),
        setWorkspace: (dir: string) => ipcRenderer.invoke('workspace:set', dir),
        listFiles: (dir?: string) => ipcRenderer.invoke('file:list', dir),
        readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
        createFile: (payload: { filename?: string; content?: string }) => ipcRenderer.invoke('file:create', payload),
        saveFile: (payload: { filePath: string; content: string }) => ipcRenderer.invoke('file:save', payload),
        renameFile: (payload: { oldPath: string; newName: string }) => ipcRenderer.invoke('file:rename', payload),
        deleteFile: (filePath: string) => ipcRenderer.invoke('file:delete', filePath),
        revealInFinder: (filePath: string) => ipcRenderer.invoke('file:reveal', filePath),

        // 文件夹管理
        createFolder: (folderName: string) => ipcRenderer.invoke('folder:create', folderName),
        moveFile: (payload: { filePath: string; targetFolder: string }) => ipcRenderer.invoke('folder:move', payload),
        inspectFolder: (folderPath: string) => ipcRenderer.invoke('folder:inspect', folderPath),
        deleteFolder: (payload: string | { folderPath: string; recursive?: boolean }) =>
            ipcRenderer.invoke('folder:delete', payload),
        renameFolder: (payload: { folderPath: string; newName: string }) => ipcRenderer.invoke('folder:rename', payload),
        moveFolder: (payload: { folderPath: string; targetFolder: string }) => ipcRenderer.invoke('folder:move-folder', payload),

        onRefresh: (callback: () => void) => {
            const handler = (_event: IpcRendererEvent) => callback();
            ipcRenderer.on('file:refresh', handler);
            return handler;
        },
        removeRefreshListener: (handler: (event: IpcRendererEvent, ...args: any[]) => void) => {
            ipcRenderer.removeListener('file:refresh', handler);
        },

        onMenuNewFile: (callback: () => void) => {
            const handler = (_event: IpcRendererEvent) => callback();
            ipcRenderer.on('menu:new-file', handler);
            return handler;
        },
        onMenuSave: (callback: () => void) => {
            const handler = (_event: IpcRendererEvent) => callback();
            ipcRenderer.on('menu:save', handler);
            return handler;
        },
        onMenuSwitchWorkspace: (callback: () => void) => {
            const handler = (_event: IpcRendererEvent) => callback();
            ipcRenderer.on('menu:switch-workspace', handler);
            return handler;
        },

        removeAllListeners: () => {
            ipcRenderer.removeAllListeners('file:refresh');
            ipcRenderer.removeAllListeners('menu:new-file');
            ipcRenderer.removeAllListeners('menu:save');
            ipcRenderer.removeAllListeners('menu:switch-workspace');
        }
    },

    // 窗口控制 (用于 Windows 自定义标题栏)
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    },

    shell: {
        openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    },
    clipboard: {
        writeHTML: (payload: { html: string; text: string }) =>
            ipcRenderer.invoke('clipboard:writeHTML', payload),
        writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
    },
});
