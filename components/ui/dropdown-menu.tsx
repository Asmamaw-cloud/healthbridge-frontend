'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  dropdownId: string;
};

const DropdownMenuContext =
  createContext<DropdownMenuContextValue | null>(null);

export function DropdownMenu({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const dropdownId = useId();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === 'boolean';
  const currentOpen = isControlled ? (open as boolean) : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const value = useMemo(
    () => ({ open: currentOpen, setOpen, dropdownId }),
    [currentOpen, dropdownId],
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
}: {
  children: React.ReactElement;
  className?: string;
}) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenuTrigger must be used inside DropdownMenu');

  useEffect(() => {
    // Close when user clicks outside the trigger+content area.
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const inside = target.closest?.(`[data-dropdown-id="${ctx.dropdownId}"]`);
      if (!inside) ctx.setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [ctx]);

  return (
    <div
      className={className}
      onClick={() => ctx.setOpen(!ctx.open)}
      role="presentation"
      data-dropdown-id={ctx.dropdownId}
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenuContent must be used inside DropdownMenu');

  if (!ctx.open) return null;

  return (
    <div
      role="menu"
      aria-labelledby={ctx.dropdownId}
      className={
        className ??
        'absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-lg'
      }
      data-dropdown-id={ctx.dropdownId}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenuItem must be used inside DropdownMenu');

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onClick?.();
        ctx.setOpen(false);
      }}
      className={
        className ??
        'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/60'
      }
    >
      {children}
    </button>
  );
}

