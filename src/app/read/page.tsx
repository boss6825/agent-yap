import { redirect } from "next/navigation";
import { getPrimaryBook } from "@/lib/content";

export default function ReadIndex() {
  redirect(getPrimaryBook().slides[0].href);
}
