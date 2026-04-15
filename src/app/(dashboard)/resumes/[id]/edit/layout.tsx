export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override the dashboard layout's padding for the full-bleed editor
  return <div className="-m-6 h-[calc(100vh-0px)]">{children}</div>;
}
