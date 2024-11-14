import { shell,ipcRenderer,contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  
  openExternal: shell.openExternal,

  //实现跨域http请求
  fetch: async (url, options) => {
    return ipcRenderer.invoke('fetch-url', url, options);
  },

  //获取应用程序运行根目录
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  //获取引用程序当前版本号
  getVersion: () => ipcRenderer.invoke('get-version'),

  //获取本地代理配置状态
  getProxyEnable:  () => ipcRenderer.invoke('get-proxy-enable'),

  //设置本地代理
  setProxy: async(proxyServer,proxyEnable)=>{
    console.log("set-proxy---")  
    return ipcRenderer.invoke('set-proxy', proxyServer,proxyEnable);
  },

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
