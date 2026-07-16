const FOCUS_LINE_DELAY_MS = 60;

type Ref<T> = { current: T };

type EditorViewLike<TEffect> = {
  dispatch: (spec: { effects: TEffect; selection: { anchor: number } }) => void;
  focus: () => void;
  state: { doc: { line: (line: number) => { from: number }; lines: number } };
};

type EditorReviewNavigationOptions<TFile, TGitFile extends { path: string }, TEffect> = {
  buffers: Ref<Record<string, { savedText: string; text: string }>>;
  getDiffReviewPath: () => string | null;
  getEditorText: () => string;
  getGitFiles: () => TGitFile[];
  getRoot: () => string | null;
  getSavedText: () => string;
  getSelectedPath: () => string | null;
  getView: () => EditorViewLike<TEffect> | null;
  makeFileNode: (path: string) => TFile;
  openGitDiff: (file: TGitFile) => Promise<boolean>;
  requestOpenFile: (file: TFile, options: { focusEditor: boolean }) => Promise<boolean>;
  revealEditorTools: () => void;
  schedule: (callback: () => void, delayMs: number) => void;
  scrollEffect: (position: number) => TEffect;
};

const focusEditorLine = <TFile, TGitFile extends { path: string }, TEffect>(
  options: EditorReviewNavigationOptions<TFile, TGitFile, TEffect>,
  line: number,
) => {
  const targetLine = Math.max(1, line);
  options.schedule(() => {
    const view = options.getView();
    if (!view) return;
    const docLine = view.state.doc.line(Math.min(targetLine, view.state.doc.lines));
    view.dispatch({
      selection: { anchor: docLine.from },
      effects: options.scrollEffect(docLine.from),
    });
    view.focus();
  }, FOCUS_LINE_DELAY_MS);
};

const reviewRunCardFile = async <TFile, TGitFile extends { path: string }, TEffect>(
  options: EditorReviewNavigationOptions<TFile, TGitFile, TEffect>,
  relativePath: string,
) => {
  const normalized = relativePath.trim().replace(/^\.\//, "");
  const changedFile = options.getGitFiles().find((file) => file.path === normalized);
  if (changedFile) {
    if (await options.openGitDiff(changedFile)) options.revealEditorTools();
    return;
  }
  const root = options.getRoot();
  if (!root || !normalized) return;
  const opened = await options.requestOpenFile(
    options.makeFileNode(`${root}/${normalized}`), { focusEditor: true },
  );
  if (opened) options.revealEditorTools();
};

const openDiffFile = async <TFile, TGitFile extends { path: string }, TEffect>(
  options: EditorReviewNavigationOptions<TFile, TGitFile, TEffect>,
  line: number | null,
) => {
  const path = options.getDiffReviewPath();
  if (!path) return;
  const opened = await options.requestOpenFile(options.makeFileNode(path), { focusEditor: true });
  if (opened && line != null) focusEditorLine(options, line);
};

const hasUnsavedBufferForPath = <TFile, TGitFile extends { path: string }, TEffect>(
  options: EditorReviewNavigationOptions<TFile, TGitFile, TEffect>,
  path: string,
) => {
  if (options.getSelectedPath() === path && options.getEditorText() !== options.getSavedText()) {
    return true;
  }
  const buffered = options.buffers.current[path];
  return Boolean(buffered && buffered.text !== buffered.savedText);
};

export const createEditorReviewNavigation = <TFile, TGitFile extends { path: string }, TEffect>(
  options: EditorReviewNavigationOptions<TFile, TGitFile, TEffect>,
) => ({
  focusEditorLine: (line: number) => focusEditorLine(options, line),
  hasUnsavedBufferForPath: (path: string) => hasUnsavedBufferForPath(options, path),
  openDiffFile: (line: number | null = null) => openDiffFile(options, line),
  reviewRunCardFile: (relativePath: string) => reviewRunCardFile(options, relativePath),
});
