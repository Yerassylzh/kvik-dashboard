"use client";

import React from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Clock,
  ExternalLink,
  Archive,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { useLeadDetail } from "@/hooks/useLeads";
import type { LeadStatus } from "@/lib/api/leads";

interface LeadDetailProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onArchive: (leadId: string) => void;
}

const statusOptions: Array<{ id: LeadStatus; label: string }> = [
  { id: "NEW", label: "Новые" },
  { id: "QUALIFIED", label: "Квалифицирован" },
  { id: "APPOINTMENT_SET", label: "Запись создана" },
  { id: "DEAL_WON", label: "Успешно" },
  { id: "DEAL_LOST", label: "Отказ" },
];

export function LeadDetail({
  leadId,
  isOpen,
  onClose,
  onStatusChange,
  onArchive,
}: LeadDetailProps) {
  const t = useTranslations("dashboard");
  const { lead, isLoading } = useLeadDetail(leadId);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="panel"
      title={t("leads.detail_title")}
      description="Карточка клиента и история взаимодействий"
    >
      <div className="space-y-6">
        {/* Header Profile */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
          <EntityAvatar name={lead?.name || "Лид"} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-foreground truncate">
              {lead?.name || "Без имени"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge type="lead" status={lead?.status || "NEW"} />
              {lead?.sourceChannel && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                  {lead.sourceChannel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Изменить этап сделки
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => lead && onStatusChange(lead.id, opt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  lead?.status === opt.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("leads.detail_contact")}
          </h4>
          <div className="space-y-2 text-sm">
            {lead?.phone && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-foreground font-medium">{lead.phone}</span>
              </div>
            )}
            {lead?.email && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{lead.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Niche Data / Service Interest */}
        {lead?.nicheData && typeof lead.nicheData === "object" && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("leads.detail_interest")}
            </h4>
            <div className="p-3.5 rounded-xl bg-card border border-border/50 text-xs text-foreground space-y-1">
              {Object.entries(lead.nicheData as Record<string, string>).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{k}:</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Conversations */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("leads.detail_dialogues")}
          </h4>
          {(!lead?.conversations || lead.conversations.length === 0) ? (
            <p className="text-xs text-muted-foreground py-2">Диалогов пока нет</p>
          ) : (
            <div className="space-y-2">
              {lead.conversations.map((conv: any) => (
                <Link
                  key={conv.id}
                  href={`/inbox/${conv.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">
                      Диалог ({conv.channelType})
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Linked Bookings */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("leads.detail_bookings")}
          </h4>
          {(!lead?.bookings || lead.bookings.length === 0) ? (
            <p className="text-xs text-muted-foreground py-2">Записей пока нет</p>
          ) : (
            <div className="space-y-2">
              {lead.bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {booking.serviceName || "Услуга"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(booking.startTime).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                  </div>
                  <StatusBadge type="booking" status={booking.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archive Button */}
        <div className="pt-4 border-t border-border/50">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (lead) {
                onArchive(lead.id);
                onClose();
              }
            }}
            className="w-full gap-2 text-xs"
          >
            <Archive className="w-4 h-4" />
            <span>{t("leads.archive_btn")}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
