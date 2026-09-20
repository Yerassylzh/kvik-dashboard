'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  HelpCircle,
  MessageCircle,
  BookOpen,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface HelpSupportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpSupportModal({ isOpen, onOpenChange }: HelpSupportModalProps) {
  const t = useTranslations('dashboard');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <HelpCircle className="w-5 h-5" />
          </div>
          <DialogTitle>{t('help_modal.title')}</DialogTitle>
          <DialogDescription>{t('help_modal.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <a
            href="https://t.me/kvik_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {t('help_modal.telegram_title')}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t('help_modal.telegram_desc')}
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
          </a>

          <a
            href="https://docs.kvik.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {t('help_modal.docs_title')}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t('help_modal.docs_desc')}
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
          </a>

          <a
            href="mailto:support@kvik.ai"
            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {t('help_modal.email_title')}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t('help_modal.email_desc')}
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
          </a>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs cursor-pointer"
          >
            {t('help_modal.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
