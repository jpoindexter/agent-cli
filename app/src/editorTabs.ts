export type EditorTabItem = {
  id: string;
  name: string;
  path: string;
};

export type EditorBufferSnapshot = {
  text: string;
  savedText: string;
};

const pathIsWithin = (path: string, parentPath: string) =>
  path === parentPath || path.startsWith(`${parentPath}/`);

const replacePathPrefix = (path: string, from: string, to: string) =>
  path === from ? to : `${to}${path.slice(from.length)}`;

export const upsertEditorTab = <T extends EditorTabItem>(tabs: T[], file: T): T[] => {
  if (tabs.some((tab) => tab.path === file.path)) return tabs;
  return [...tabs, file];
};

export const removeEditorTab = <T extends EditorTabItem>(
  tabs: T[],
  activePath: string | null,
  closingPath: string,
) => {
  const closingIndex = tabs.findIndex((tab) => tab.path === closingPath);
  if (closingIndex === -1) return { tabs, nextActivePath: activePath };
  const nextTabs = tabs.filter((tab) => tab.path !== closingPath);
  if (activePath !== closingPath) return { tabs: nextTabs, nextActivePath: activePath };
  const nextActive = nextTabs[Math.min(closingIndex, nextTabs.length - 1)] ?? null;
  return { tabs: nextTabs, nextActivePath: nextActive?.path ?? null };
};

export const dirtyEditorTabPaths = (
  tabs: EditorTabItem[],
  buffers: Record<string, EditorBufferSnapshot>,
  activePath: string | null,
  activeDirty: boolean,
) =>
  tabs
    .filter((tab) => {
      if (tab.path === activePath) return activeDirty;
      const buffer = buffers[tab.path];
      return buffer ? buffer.text !== buffer.savedText : false;
    })
    .map((tab) => tab.path);

export const retargetEditorTabs = <T extends EditorTabItem>(
  tabs: T[],
  fromPath: string,
  toPath: string,
  nameForPath: (path: string) => string,
): T[] =>
  tabs.map((tab) => {
    if (!pathIsWithin(tab.path, fromPath)) return tab;
    const path = replacePathPrefix(tab.path, fromPath, toPath);
    return { ...tab, id: path, path, name: nameForPath(path) };
  });

export const removeEditorTabsWithin = <T extends EditorTabItem>(tabs: T[], parentPath: string): T[] =>
  tabs.filter((tab) => !pathIsWithin(tab.path, parentPath));

export const retargetEditorBuffers = <T>(
  buffers: Record<string, T>,
  fromPath: string,
  toPath: string,
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(buffers).map(([path, buffer]) => [
      pathIsWithin(path, fromPath) ? replacePathPrefix(path, fromPath, toPath) : path,
      buffer,
    ]),
  );

export const removeEditorBuffersWithin = <T>(buffers: Record<string, T>, parentPath: string): Record<string, T> =>
  Object.fromEntries(Object.entries(buffers).filter(([path]) => !pathIsWithin(path, parentPath)));
