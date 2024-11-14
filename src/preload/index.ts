import { shell,ipcRenderer,contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  
  openExternal: shell.openExternal,

  fetch: async (url, options) => {
    return ipcRenderer.invoke('fetch-url', url, options);
  },
  getAppPath: () => ipcRenderer.invoke('get-app-path')
  ,
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  readFile:function(){
    
  },

  downloadMenuData(){
    

    return new Promise((resolve, reject) => {
      const http = require('http');
      const options = {
          hostname: 'http://www.baidu.com/',
          port: 80,
          path: '/',
          method: 'GET'
      };
      const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
              data += chunk;
          });
          res.on('end', () => {
            resolve(data);
          });
      });
      req.on('error', (error) => {
        reject(error);
      });
      req.end();  

    });

  }

}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
