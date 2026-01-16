import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 在 ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'resources', 'icon.ico')
    });

    // 加载前端构建产物
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));

    mainWindow.on('closed', function () {
        mainWindow = null;
        if (backendProcess) {
            backendProcess.kill();
        }
    });
}

function startBackend() {
    const backendPath = path.join(__dirname, '..', 'backend');
    const startScript = path.join(backendPath, 'start_electron.bat');
    
    backendProcess = spawn(startScript, [], {
        cwd: backendPath,
        stdio: 'inherit',
        shell: true
    });

    backendProcess.on('error', (error) => {
        console.error('启动后端服务失败:', error);
    });

    backendProcess.on('close', (code) => {
        console.log('后端服务已关闭，退出码:', code);
    });
}

app.on('ready', () => {
    createWindow();
    startBackend();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (backendProcess) {
            backendProcess.kill();
        }
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
        if (!backendProcess || backendProcess.exitCode !== null) {
            startBackend();
        }
    }
});

// 处理前端请求
ipcMain.handle('get-backend-status', () => {
    return {
        running: backendProcess && backendProcess.exitCode === null
    };
});
