// main.js
const { app, BrowserWindow, Menu, Tray, globalShortcut, clipboard, dialog, shell } = require('electron');
const path = require('path');
const { translit } = require('./translitEngine.js'); 

let mainWindow;
let tray = null;
let currentMode = 'seo'; 
let isQuitting = false; 

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
            contextIsolation: false
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

function createTray() {
    const iconPath = path.join(__dirname, 'icon.ico');
    try {
        tray = new Tray(iconPath); 
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Открыть Workspace', click: () => mainWindow.show() },
            { type: 'separator' },
            { label: 'Режим: Обычный', type: 'radio', click: () => { currentMode = 'basic'; } },
            { label: 'Режим: SEO URL', type: 'radio', checked: true, click: () => { currentMode = 'seo'; } },
            { label: 'Режим: Для ФИО', type: 'radio', click: () => { currentMode = 'passport'; } },
            { label: 'Режим: По ГОСТу', type: 'radio', click: () => { currentMode = 'gost'; } },
            { type: 'separator' },
            { label: 'Выйти полностью', click: () => {
                isQuitting = true; 
                app.quit();
            }}
        ]);
        tray.setToolTip('Умный транслит');
        tray.setContextMenu(contextMenu);
        tray.on('click', () => mainWindow.show());
    } catch (e) {
        console.log("Трей запущен без иконки");
    }
}

function registerGlobalHotkeys() {
    // Очищаем старые комбинации
    globalShortcut.unregisterAll();

    // МЕНЯЕМ ХОТКЕЙ НА БОЛЕЕ НАДЕЖНЫЙ: Ctrl+Shift+T
    const registered = globalShortcut.register('CommandOrControl+Shift+T', () => {
        const currentClipboard = clipboard.readText();
        
        if (currentClipboard) {
            const transformed = translit(currentClipboard, currentMode);
            clipboard.writeText(transformed);
            
            // Воспроизводим звуковое уведомление вместо всплывающего окна
            shell.beep();
        }
    });

    if (!registered) {
        console.log('Ошибка: Комбинация Ctrl+Shift+T занята другой системой!');
    }
}

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