import type { KeyboardEvent, MouseEvent } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import type { EditorView, ViewUpdate } from "@codemirror/view";

import { editorExtensionsFor } from "./editorLanguages";
import { EditorSaveError } from "./EditorSaveError";

export type EditorCodeSurfaceProps = {
  conflict: boolean;
  error: string | null;
  filePath: string;
  loading: boolean;
  recoveryError: string | null;
  saving: boolean;
  value: string;
  onChange: (value: string) => void;
  onContextMenu: (event: MouseEvent<HTMLDivElement>) => void;
  onCreateEditor: (view: EditorView) => void;
  onOpenExternally: () => void;
  onOverwrite: () => void;
  onReload: () => void;
  onRetry: () => void;
  onSave: () => void;
  onUpdate: (update: ViewUpdate) => void;
};

export function EditorCodeSurface(props: EditorCodeSurfaceProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      props.onSave();
    }
  };
  return (
    <div className="editor-code" onContextMenu={props.onContextMenu} onKeyDown={handleKeyDown}>
      {props.error ? (
        <EditorSaveError
          message={props.error}
          recoveryError={props.recoveryError}
          saving={props.saving}
          canOpenExternally
          conflict={props.conflict}
          onRetry={props.onRetry}
          onReload={props.onReload}
          onOverwrite={props.onOverwrite}
          onOpenExternally={props.onOpenExternally}
        />
      ) : null}
      <CodeMirror
        key={props.filePath}
        value={props.value}
        height="100%"
        theme={oneDark}
        basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, highlightActiveLineGutter: true }}
        editable={!props.loading}
        extensions={editorExtensionsFor(props.filePath)}
        onChange={props.onChange}
        onCreateEditor={props.onCreateEditor}
        onUpdate={props.onUpdate}
      />
    </div>
  );
}
