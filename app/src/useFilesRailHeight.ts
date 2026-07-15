import { useEffect, useState, type RefObject } from "react";

export type RailResizeObserver = (
  element: HTMLDivElement,
  onResize: () => void,
) => () => void;

const observeNative: RailResizeObserver = (element, onResize) => {
  const observer = new ResizeObserver(onResize);
  observer.observe(element);
  return () => observer.disconnect();
};

export function useFilesRailHeight(
  active: boolean,
  railRef: RefObject<HTMLDivElement | null>,
  observe: RailResizeObserver = observeNative,
) {
  const [height, setHeight] = useState(240);
  useEffect(() => {
    if (!active) return;
    const element = railRef.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      setHeight(Math.max(120, Math.floor(rect.height)));
    };
    update();
    return observe(element, update);
  }, [active, observe, railRef]);
  return height;
}
