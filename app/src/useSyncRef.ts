import { useEffect, type RefObject } from "react";

export const useSyncRef = <T>(ref: RefObject<T>, value: T) => {
  useEffect(() => {
    ref.current = value;
  }, [ref, value]);
};
