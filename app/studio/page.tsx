import { redirect } from 'next/navigation';

export default function LegacyStudioPage() {
  // Redirect legacy /studio to /studio/default for backward compatibility
  redirect('/studio/default');
}