"use client";

import React from "react";
import { connectWhatsApp } from "@/lib/api/channels";
import { WhatsAppChannelMetadata } from "@/types/channels";
import { OAuthCallbackView } from "@/components/onboarding/channel/OAuthCallbackView";

export default function WhatsAppCallbackPage() {
  return (
    <OAuthCallbackView
      channelName="WhatsApp"
      channelType="WHATSAPP"
      themeColor="emerald"
      connectApi={connectWhatsApp}
      extractDetail={(channel) => {
        const meta = channel.metadata as WhatsAppChannelMetadata | undefined;
        return meta?.displayPhoneNumber || meta?.verifiedName || undefined;
      }}
    />
  );
}
