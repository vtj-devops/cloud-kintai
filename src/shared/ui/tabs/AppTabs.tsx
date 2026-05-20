import { type KeyboardEvent, type ReactNode, useId, useRef } from "react";

export type AppTabValue = string | number;

export type AppTabItem<T extends AppTabValue> = {
  value: T;
  label: string;
  content: ReactNode;
  disabled?: boolean;
};

export type AppTabAppearance =
  | "underline"
  | "bordered"
  | "chip"
  // legacy aliases kept for backward compatibility
  | "pill"
  | "mui-standard";

export type AppTabsProps<T extends AppTabValue> = {
  value: T;
  onChange: (value: T) => void;
  items: AppTabItem<T>[];
  appearance?: AppTabAppearance;
  tabsProps?: {
    "aria-label"?: string;
    variant?: "standard" | "scrollable" | "fullWidth";
    sx?: unknown;
  };
  panelPadding?: number;
};

const resolveAppearance = (
  raw: AppTabAppearance,
): "underline" | "bordered" | "chip" => {
  if (raw === "pill") return "chip";
  if (raw === "mui-standard") return "underline";
  return raw;
};

export function AppTabs<T extends AppTabValue>({
  value,
  onChange,
  items,
  appearance: appearanceProp = "underline",
  tabsProps,
  panelPadding = 2,
}: AppTabsProps<T>) {
  const appearance = resolveAppearance(appearanceProp);
  const isFullWidth = tabsProps?.variant === "fullWidth";
  const idBase = useId().replace(/:/g, "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = items.findIndex((item) => item.value === value);

  const findNextEnabledIndex = (currentIndex: number, direction: 1 | -1) => {
    if (items.length === 0) {
      return currentIndex;
    }

    for (let offset = 1; offset <= items.length; offset += 1) {
      const nextIndex =
        (currentIndex + direction * offset + items.length) % items.length;

      if (!items[nextIndex]?.disabled) {
        return nextIndex;
      }
    }

    return currentIndex;
  };

  const findEdgeEnabledIndex = (direction: 1 | -1) => {
    const indices =
      direction === 1
        ? items.map((_, index) => index)
        : items.map((_, index) => items.length - index - 1);

    return indices.find((index) => !items[index]?.disabled) ?? activeIndex;
  };

  const focusTab = (index: number) => {
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = findNextEnabledIndex(currentIndex, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = findNextEnabledIndex(currentIndex, -1);
        break;
      case "Home":
        nextIndex = findEdgeEnabledIndex(1);
        break;
      case "End":
        nextIndex = findEdgeEnabledIndex(-1);
        break;
      default:
        return;
    }

    event.preventDefault();

    const nextValue = items[nextIndex]?.value;
    if (nextValue !== undefined && nextIndex !== currentIndex) {
      onChange(nextValue);
    }

    focusTab(nextIndex);
  };

  const tabListClassName = (() => {
    const widthClass = isFullWidth ? "w-full" : "w-fit max-w-full";
    if (appearance === "underline") {
      return `flex overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-white ${widthClass}`;
    }
    if (appearance === "bordered") {
      return `flex overflow-x-auto overflow-y-hidden px-4 pt-4 ${widthClass}`;
    }
    // chip
    return `flex gap-2 overflow-x-auto overflow-y-hidden pb-1 ${widthClass}`;
  })();

  const getTabClassName = (isActive: boolean) => {
    const widthClass = isFullWidth ? "flex-1 whitespace-nowrap" : "whitespace-nowrap";

    if (appearance === "underline") {
      return [
        "relative min-w-fit appearance-none border-0 bg-transparent px-4 py-3 text-sm shadow-none transition-colors outline-none focus:outline-none focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "hover:bg-slate-50",
        widthClass,
        isActive
          ? "font-semibold text-emerald-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-t-sm after:bg-emerald-600 after:content-['']"
          : "font-medium text-slate-500 hover:text-slate-700",
      ].join(" ");
    }

    if (appearance === "bordered") {
      return [
        "relative min-w-fit appearance-none px-5 py-2.5 text-sm font-medium transition-colors outline-none focus:outline-none focus-visible:outline-none",
        "rounded-t-md border border-b-0",
        "disabled:cursor-not-allowed disabled:opacity-40",
        widthClass,
        isActive
          ? "border-slate-200 bg-white text-emerald-700 font-semibold -mb-px z-10"
          : "border-transparent bg-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700",
      ].join(" ");
    }

    // chip
    return [
      "min-w-fit rounded-full border px-4 py-2 text-sm font-medium transition",
      "disabled:cursor-not-allowed disabled:opacity-40",
      widthClass,
      isActive
        ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_10px_24px_-18px_rgba(16,185,129,0.8)]"
        : "border-slate-300 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
    ].join(" ");
  };

  const panelWrapperClassName =
    appearance === "bordered"
      ? "rounded-b-md rounded-tr-md border border-slate-200 bg-white"
      : "";

  return (
    <>
      <div
        role="tablist"
        aria-label={tabsProps?.["aria-label"] ?? "app-tabs"}
        className={tabListClassName}
      >
        {items.map((tab, idx) => (
          <button
            key={String(tab.value)}
            type="button"
            role="tab"
            id={`${idBase}-tab-${idx}`}
            aria-selected={value === tab.value}
            aria-controls={`${idBase}-panel-${idx}`}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            tabIndex={value === tab.value ? 0 : -1}
            onKeyDown={(event) => handleKeyDown(event, idx)}
            ref={(element) => {
              tabRefs.current[idx] = element;
            }}
            className={getTabClassName(value === tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={panelWrapperClassName}>
        {items.map((tab, idx) => (
          <div
            key={`panel-${String(tab.value)}`}
            id={`${idBase}-panel-${idx}`}
            role="tabpanel"
            aria-labelledby={`${idBase}-tab-${idx}`}
            hidden={value !== tab.value}
            style={{ padding: `${panelPadding * 8}px` }}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </>
  );
}
