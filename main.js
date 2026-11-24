// main.js
const { app, BrowserWindow, Menu, Tray, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { translit } = require('./translitEngine.js'); 

// Автономное хранение данных рядом с .exe при запуске в Portable-режиме
if (process.env.PORTABLE_EXECUTABLE_DIR) {
    app.setPath('userData', path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data'));
}

// Защита от запуска нескольких копий приложения
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

let mainWindow = null;
let tray = null;
let currentMode = 'seo'; 
let isQuitting = false;

// Воспроизведение четкого системного звука Windows (Ding)
function playSystemSound() {
    const dingCommand = 'powershell -NoProfile -NonInteractive -Command "(New-Object Media.SoundPlayer \'C:\\Windows\\Media\\Windows Ding.wav\').PlaySync()"';
    exec(dingCommand, (err) => {
        if (err) {
            exec('powershell -NoProfile -NonInteractive -Command "[System.Media.SystemSounds]::Asterisk.Play()"');
        }
    });
}

// Функция транслитерации содержимого буфера обмена
function handleTranslit() {
    const currentClipboard = clipboard.readText();
    if (currentClipboard && currentClipboard.trim().length > 0) {
        const transformed = translit(currentClipboard, currentMode);
        clipboard.writeText(transformed);
        playSystemSound();
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 650,
        minWidth: 800,
        minHeight: 500,
        autoHideMenuBar: true, 
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault(); 
            mainWindow.hide(); 
        }
        return false;
    });
}

function updateTrayMenu() {
    if (!tray) return;
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Открыть Workspace', click: () => { mainWindow.show(); mainWindow.focus(); } },
        { label: 'Транслитерировать буфер (Хоткей)', click: () => handleTranslit() },
        { type: 'separator' },
        { label: 'Режим: Обычный', type: 'radio', checked: currentMode === 'basic', click: () => setMode('basic') },
        { label: 'Режим: SEO URL (ЧПУ)', type: 'radio', checked: currentMode === 'seo', click: () => setMode('seo') },
        { label: 'Режим: Для ФИО (МИД)', type: 'radio', checked: currentMode === 'passport', click: () => setMode('passport') },
        { label: 'Режим: По ГОСТу', type: 'radio', checked: currentMode === 'gost', click: () => setMode('gost') },
        { type: 'separator' },
        { label: 'Выйти полностью', click: () => {
            isQuitting = true; 
            app.quit();
        }}
    ]);
    tray.setContextMenu(contextMenu);
}

function setMode(mode) {
    currentMode = mode;
    updateTrayMenu();
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('mode-changed', mode);
    }
}

function createTray() {
    const iconPath = path.join(__dirname, 'icon.ico');
    try {
        tray = new Tray(iconPath); 
        tray.setToolTip('Translit Workspace (Ctrl+Shift+T / Ctrl+Alt+T)');
        updateTrayMenu();
        tray.on('click', () => {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                mainWindow.show();
            }
        });
    } catch (e) {
        console.log("Трей запущен без иконки");
    }
}

function registerGlobalHotkeys() {
    globalShortcut.unregisterAll();

    // Регистрируем надежные комбинации: Ctrl+Shift+T, Ctrl+Alt+T и Alt+Shift+T
    const combinations = [
        'CommandOrControl+Shift+T',
        'CommandOrControl+Alt+T',
        'Alt+Shift+T'
    ];

    combinations.forEach((shortcut) => {
        try {
            globalShortcut.register(shortcut, () => {
                handleTranslit();
            });
        } catch (e) {}
    });
}

// При попытке запуска второй копии фокусируемся на существующем окне
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
});

// Синхронизация режимов из UI окна
ipcMain.on('set-mode', (event, mode) => {
    currentMode = mode;
    updateTrayMenu();
});

ipcMain.on('translit-clipboard', () => {
    handleTranslit();
});

app.on('window-all-closed', (e) => {
    e.preventDefault(); 
});

app.whenReady().then(() => {
    createWindow();
    createTray();
    registerGlobalHotkeys();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
