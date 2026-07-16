const basename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

type EditorFileUtilityActionsOptions<TFile extends { name: string; path: string }, TView> = {
  copyText: (text: string) => Promise<unknown>;
  getSelectedFile: () => TFile | null;
  getView: () => TView | null;
  notify: (message: string) => void;
  openExternal: (path: string) => Promise<unknown>;
  openFileDirect: (file: TFile, options: { focusEditor: boolean }) => Promise<unknown>;
  openSearchPanel: (view: TView) => void;
  revealInDir: (path: string) => Promise<unknown>;
  saveFile: (options: { force: boolean }) => Promise<unknown>;
  scheduleFrame: (callback: () => void) => void;
  setRecoveryError: (error: string | null) => void;
};

const openExternally = async <TFile extends { name: string; path: string }, TView>(
  options: EditorFileUtilityActionsOptions<TFile, TView>,
) => {
  const file = options.getSelectedFile();
  if (!file) return;
  options.setRecoveryError(null);
  try {
    await options.openExternal(file.path);
  } catch (err) {
    options.setRecoveryError(`Could not open ${file.name} externally: ${err}`);
  }
};

const reveal = async <TFile extends { name: string; path: string }, TView>(
  options: EditorFileUtilityActionsOptions<TFile, TView>,
) => {
  const file = options.getSelectedFile();
  if (!file) return;
  options.setRecoveryError(null);
  try {
    await options.revealInDir(file.path);
  } catch (err) {
    options.setRecoveryError(`Could not reveal ${file.name}: ${err}`);
  }
};

const openSearch = <TFile extends { name: string; path: string }, TView extends { focus: () => void }>(
  options: EditorFileUtilityActionsOptions<TFile, TView>,
) => {
  const view = options.getView();
  if (!view) return;
  options.openSearchPanel(view);
  options.scheduleFrame(() => view.focus());
};

export const createEditorFileUtilityActions = <
  TFile extends { name: string; path: string },
  TView extends { focus: () => void },
>(options: EditorFileUtilityActionsOptions<TFile, TView>) => ({
  copyPath: async (path: string) => {
    await options.copyText(path);
    options.notify(`Copied ${basename(path)} path`);
  },
  openExternally: () => openExternally(options),
  openSearch: () => openSearch(options),
  overwrite: async () => { await options.saveFile({ force: true }); },
  reloadFromDisk: async () => {
    const file = options.getSelectedFile();
    if (!file) return;
    await options.openFileDirect(file, { focusEditor: true });
  },
  reveal: () => reveal(options),
});
