const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  getPin: () => ipcRenderer.invoke('win:getPin'),
  setPin: (on) => ipcRenderer.invoke('win:setPin', on),
  getOpacity: () => ipcRenderer.invoke('win:getOpacity'),
  setOpacity: (v) => ipcRenderer.invoke('win:setOpacity', v),
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
});
