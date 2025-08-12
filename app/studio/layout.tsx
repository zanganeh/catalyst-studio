// This layout is for legacy compatibility only
// It handles /studio routes that don't have an ID
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}