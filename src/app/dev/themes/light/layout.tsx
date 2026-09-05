export default function LightThemePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-reader-theme="light"
      data-reader-family="system"
      style={{ width: 1440, height: 900, overflow: "hidden" }}
    >
      {children}
    </div>
  );
}
