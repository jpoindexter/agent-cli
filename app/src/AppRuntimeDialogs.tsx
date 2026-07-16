import type { ComponentProps } from "react";

import { AppNotices } from "./AppNotices";
import { OrchestrationDialog } from "./OrchestrationDialog";

export type AppRuntimeDialogsProps = {
  notices: ComponentProps<typeof AppNotices>;
  orchestration: ComponentProps<typeof OrchestrationDialog>;
};

export const AppRuntimeDialogs = ({ notices, orchestration }: AppRuntimeDialogsProps) => (
  <>
    <AppNotices {...notices} />
    <OrchestrationDialog {...orchestration} />
  </>
);
