export default function PlainDarkThemePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="plain-dark"
      data-reader-theme="dark"
      data-reader-family="system"
      style={{
        width: 1440,
        height: 900,
        overflow: "hidden",
        background: "#000000",
        colorScheme: "dark",
      }}
    >
      {children}
    </div>
  );
}
