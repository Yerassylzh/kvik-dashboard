"use client";

import React from "react";
import { LeadsPage } from "@/components/dashboard/leads/LeadsPage";

interface ClientsPageProps {
  initialLeadId?: string;
}

export function ClientsPage({ initialLeadId }: ClientsPageProps) {
  return <LeadsPage initialLeadId={initialLeadId} />;
}
