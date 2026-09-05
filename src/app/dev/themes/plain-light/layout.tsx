export default function PlainLightThemePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="plain-light"
      data-theme-family="plain"
      style={{ width: 1440, height: 900, overflow: "hidden" }}
    >
      {children}
    </div>
  );
}
