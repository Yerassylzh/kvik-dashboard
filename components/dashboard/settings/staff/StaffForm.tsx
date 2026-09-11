"use client";

import React, { useState } from "react";
import { Plus, User, Phone, Briefcase } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateStaffPayload } from "@/lib/api/staff";

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStaffPayload) => Promise<unknown>;
}

export function StaffForm({ isOpen, onClose, onSubmit }: StaffFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        role: role.trim() || undefined,
        phone: phone.trim() || undefined,
        specializations: specializations
          ? specializations.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      onClose();
      setName("");
      setRole("");
      setPhone("");
      setSpecializations("");
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title="Добавить специалиста"
      description="Специалист появится в расписании и в онлайн-записи ИИ"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Имя специалиста *</label>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Анна Смирнова"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Должность / Роль</label>
            <Input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Стилист, Косметолог..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Телефон</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 701 000 0000"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Специализации (через запятую)
          </label>
          <Input
            type="text"
            value={specializations}
            onChange={(e) => setSpecializations(e.target.value)}
            placeholder="Стрижка, Окрашивание, Укладка"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" size="sm" disabled={!name.trim() || isSubmitting} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Добавить</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
