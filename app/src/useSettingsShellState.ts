import { useState } from "react";

import type { SettingsCategoryId } from "./settingsModalData";
import { useSettingsRuntimeStatus } from "./useSettingsRuntimeStatus";
import { useShellLayout } from "./useShellLayout";

export const useSettingsShellState = (workspacePath: string | null) => {
  const [settingsOpen, setSettingsOpenState] = useState(false);
  const [settingsInitialCategory, setSettingsInitialCategory] = useState<SettingsCategoryId>("general");
  const setSettingsOpen = (open: boolean) => {
    if (open) setSettingsInitialCategory("general");
    setSettingsOpenState(open);
  };
  const openSettings = (category: SettingsCategoryId = "general") => {
    setSettingsInitialCategory(category);
    setSettingsOpenState(true);
  };
  const settingsRuntime = useSettingsRuntimeStatus(settingsOpen, workspacePath);
  const shellLayout = useShellLayout(() => setSettingsOpenState(false));
  return {
    openSettings, setSettingsOpen, settingsInitialCategory, settingsOpen, settingsRuntime, shellLayout,
  };
};
