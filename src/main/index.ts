import { app, shell, BrowserWindow, ipcMain ,Menu,Tray} from 'electron'

import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'



let mainWindow ;

function createWindow(): void {
    
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 700,
    show: false,
    frame:false,
    resizable:false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag:true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  


  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    console.log("oooooooooooooo")
    return { action: 'deny' }
  })
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5') {
      // 阻止默认的F5刷新行为
      event.preventDefault();
      mainWindow.webContents.send('before-input-event',input.key);
    }
    if(input.key === 'F10'){
      event.preventDefault();
      mainWindow.webContents.openDevTools()
    }
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {

    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    

    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })



  createWindow()



  // 处理来自预加载脚本的IPC消息
  ipcMain.handle('fetch-url', async (_, url, options) => {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  });
  ipcMain.handle('set-proxy', async (_, proxyServer, proxyEnable) => {
    const child_process = require('child_process');
    //修改注册表实现网络代理   
     try {

          const regKey =  "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
          if(proxyEnable){
           child_process.exec(`reg add "${regKey}" /v ProxyServer /t REG_SZ /d ${proxyServer}`);
           child_process.exec(`reg add "${regKey}" /v ProxyEnable /t REG_DWORD /d 1 /f`);
           
          }else{
            child_process.exec(`reg add "${regKey}" /v ProxyEnable /t REG_DWORD /d 0 /f`);
          }

      } catch (error) {
          console.log(error);
      }
  });

  ipcMain.handle('get-proxy-enable', async () => {
      
      const value =  await getProxyValue();
      let result: string = `${value}`;
      return result.indexOf("0x1")>-1;
      
  });

  ipcMain.handle('get-app-path', async () => {
    return is.dev?app.getAppPath():join(app.getAppPath(),"../")
   
  });

  ipcMain.handle('get-version',() => app.getVersion());

  ipcMain.on('window-minimize', () =>  mainWindow.minimize());
  ipcMain.on('window-maximize', () =>  mainWindow.maximize());
  ipcMain.on('window-close',() =>  mainWindow.close()); 
  ipcMain.on('devtools-open',() =>  mainWindow.webContents.openDevTools()); 

  
  let tray = new Tray(join(app.getAppPath(), '/resources/icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: '设置', click: () => { createSetting() } },
    { label: '退出', click: () => { mainWindow.destroy(); } },
  ]);

  tray.setToolTip('XTools正在后台运行');
  tray.setContextMenu(contextMenu);
  tray.on('click', function () {
     mainWindow.show();
  });
 
  //--proxy-server=http://127.0.0.1:20171,https://127.0.0.1:20172
  //app.commandLine.appendSwitch("disable-site-isolation-trials");
  
})

function createSetting(): void {
  // Create the browser window.
   let settingWindow = new BrowserWindow({
    width: 1280,
    height: 700,
    show: false,
    frame:false,
    resizable:false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag:true
    }
   })

   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    settingWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
   } else {
    settingWindow.loadFile(join(__dirname, '../renderer/setting.html'))
   }
}



async function getProxyValue() {
  
  return new Promise((resolve, reject) =>{
    
    const child_process = require('child_process');
      const regKey =  "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ProxyEnable";
      child_process.exec(`reg query "${regKey}"`, (error, stdout, stderr) => {
        let result = error + stdout + stderr;
        //console.log(error + stdout + stderr);
        if(error){
          reject(result);
        }else{
          resolve(result);          
        }
        
     });
  }); 
  
}