"use client";

import React from "react";
import { connectInstagram } from "@/lib/api/channels";
import { InstagramChannelMetadata } from "@/types/channels";
import { OAuthCallbackView } from "@/components/onboarding/channel/OAuthCallbackView";

export default function InstagramCallbackPage() {
  return (
    <OAuthCallbackView
      channelName="Instagram"
      channelType="INSTAGRAM"
      themeColor="purple"
      connectApi={connectInstagram}
      extractDetail={(channel) => {
        const meta = channel.metadata as InstagramChannelMetadata | undefined;
        const username = meta?.igUsername || meta?.name || undefined;
        return username ? `@${username.replace(/^@/, "")}` : undefined;
      }}
    />
  );
}
