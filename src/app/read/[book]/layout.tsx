import { notFound } from "next/navigation";
import { getBook, getNavManifest } from "@/lib/content";
import { ReaderChrome } from "@/components/reader/ReaderChrome";
import { ReaderThemeProvider } from "@/components/reader/theme/ReaderThemeProvider";

const READER_THEME_INIT = `(function(){try{var t=localStorage.getItem("yap-reader-theme");if(t!=="light"&&t!=="dark"&&t!=="sepia"&&t!=="sepia-dark")t="light";var f=(t==="sepia"||t==="sepia-dark")?"paper":"system";document.documentElement.setAttribute("data-reader-theme",t);document.documentElement.setAttribute("data-reader-family",f);}catch(e){}})();`;

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
    <ReaderThemeProvider>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: READER_THEME_INIT }}
      />
      <ReaderChrome manifest={manifest}>{children}</ReaderChrome>
    </ReaderThemeProvider>
  );
}
