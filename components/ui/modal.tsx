"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import clsx from "clsx";

// ─── Side Panel ──────────────────────────────────────────────────────────────

export interface SidePanelProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
}

const panelWidths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export function SidePanel({
  open,
  isOpen,
  onClose,
  title,
  description,
  children,
  width = "md",
}: SidePanelProps) {
  const isPanelOpen = isOpen !== undefined ? isOpen : Boolean(open);

  useEffect(() => {
    if (isPanelOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPanelOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />

          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={clsx(
              "fixed right-0 top-0 z-50 h-full bg-card border-l border-border shadow-2xl flex flex-col w-full",
              panelWidths[width]
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-base font-extrabold text-foreground tracking-tight truncate">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto themed-scroll p-6">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Centered Dialog ─────────────────────────────────────────────────────────

export interface DialogProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const dialogWidths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export function Dialog({
  open,
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: DialogProps) {
  const isDialogOpen = isOpen !== undefined ? isOpen : Boolean(open);

  useEffect(() => {
    if (isDialogOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDialogOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isDialogOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className={clsx(
                "w-full bg-card border border-border rounded-2xl shadow-2xl flex flex-col",
                dialogWidths[maxWidth]
              )}
            >
              {(title || description) && (
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
                  <div className="min-w-0">
                    {title && (
                      <h2 className="text-base font-extrabold text-foreground tracking-tight">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 cursor-pointer"
                    aria-label="Закрыть"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Unified Modal Wrapper ───────────────────────────────────────────────────

export interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: "dialog" | "panel";
  width?: "sm" | "md" | "lg";
}

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "dialog",
  width = "md",
}: ModalProps) {
  if (variant === "panel") {
    return (
      <SidePanel
        open={open}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        description={description}
        width={width}
      >
        {children}
      </SidePanel>
    );
  }

  return (
    <Dialog
      open={open}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth={width}
    >
      {children}
    </Dialog>
  );
}
