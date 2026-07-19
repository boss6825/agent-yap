"use client";

import { useEffect } from "react";
import {
  setSlideContext,
  type SlideContext,
} from "@/components/reader/slide-context";

/**
 * Zero-UI client component mounted by the (server-rendered) slide page.
 * Publishes the current slide's content to the slide-context store so the
 * chat panel can ground answers in what the reader is looking at.
 */
export function SlideContextBridge(props: SlideContext) {
  const { href, title, chapterNumber, chapterTitle, markdown } = props;
  useEffect(() => {
    setSlideContext({ href, title, chapterNumber, chapterTitle, markdown });
  }, [href, title, chapterNumber, chapterTitle, markdown]);
  return null;
}
