import * as electron from 'electron';

if (process.platform != 'darwin') {
  electron.app.on('window-all-closed', () => electron.app.quit());
}

electron.app.on('ready', () => {
  const mainWindow = new electron.BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 320,
    minHeight: 240,
    acceptFirstMouse: true,
    title: 'GridPrompt',
    titleBarStyle: 'hidden'
  });
  mainWindow.loadURL(`file://${__dirname}/../ui/index.html`);
  mainWindow.show();
});
