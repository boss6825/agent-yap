export default function PlainDarkThemePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="plain-dark"
      data-theme-family="plain"
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
