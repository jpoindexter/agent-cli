import type { ComponentProps } from "react";
import type { SearchCommandDialog, SearchDialogCommand } from "./SearchCommandDialog";

type DialogProps = ComponentProps<typeof SearchCommandDialog>;

type PaletteController = {
  activeIndex: DialogProps["activeIndex"];
  close: DialogProps["onClose"];
  inputRef: DialogProps["inputRef"];
  onKeyDown: (
    event: Parameters<DialogProps["onKeyDown"]>[0], commands: SearchDialogCommand[],
  ) => void;
  query: DialogProps["query"];
  run: DialogProps["onRun"];
  setActiveIndex: DialogProps["onActiveIndexChange"];
  setQuery: DialogProps["onQueryChange"];
};

type DialogExtras = {
  commands: SearchDialogCommand[];
  error: DialogProps["error"];
  loading: DialogProps["loading"];
  shortcut: DialogProps["shortcut"];
};

export const searchDialogPropsFrom = (
  palette: PaletteController,
  extras: DialogExtras,
): DialogProps => ({
  activeIndex: palette.activeIndex,
  commands: extras.commands,
  error: extras.error,
  inputRef: palette.inputRef,
  loading: extras.loading,
  onActiveIndexChange: palette.setActiveIndex,
  onClose: palette.close,
  onKeyDown: (event) => palette.onKeyDown(event, extras.commands),
  onQueryChange: palette.setQuery,
  onRun: palette.run,
  query: palette.query,
  shortcut: extras.shortcut,
});
