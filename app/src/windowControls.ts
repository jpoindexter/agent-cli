import { getCurrentWindow } from "@tauri-apps/api/window";

export const toggleNativeWindowMaximize = async () => {
  try {
    const appWindow = getCurrentWindow();
    if (await appWindow.isMaximized()) await appWindow.unmaximize();
    else await appWindow.maximize();
  } catch {
    // The browser-based development preview has no native window to control.
  }
};
