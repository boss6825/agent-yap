import { notFound } from "next/navigation";
import { getBook, getNavManifest } from "@/lib/content";
import { ReaderChrome } from "@/components/reader/ReaderChrome";
import { ThemeProvider } from "@/lib/theme";

const READER_THEME_INIT = `(function(){try{var t=localStorage.getItem("yap-theme")||localStorage.getItem("yap-reader-theme");var map={light:"plain-light",dark:"plain-dark",sepia:"sepia-light","sepia-dark":"sepia-dark","plain-light":"plain-light","plain-dark":"plain-dark","sepia-light":"sepia-light"};if(!t||(t!=="plain-light"&&t!=="plain-dark"&&t!=="sepia-light"&&t!=="sepia-dark"))t=map[t]||"plain-light";var f=(t==="sepia-light"||t==="sepia-dark")?"sepia":"plain";var l=t==="plain-dark"?"dark":t==="sepia-light"?"sepia":t==="sepia-dark"?"sepia-dark":"light";var r=document.documentElement;r.setAttribute("data-theme",t);r.setAttribute("data-theme-family",f);r.setAttribute("data-reader-theme",l);r.setAttribute("data-reader-family",f==="sepia"?"paper":"system");r.style.setProperty("--reader-family",f);}catch(e){}})();`;

export default async function ReaderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ book: string }>;
}) {
  const { book } = await params;
  if (!getBook(book)) notFound();
  const manifest = getNavManifest(book);
  return (
    <ThemeProvider>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: READER_THEME_INIT }}
      />
      <ReaderChrome manifest={manifest}>{children}</ReaderChrome>
    </ThemeProvider>
  );
}
