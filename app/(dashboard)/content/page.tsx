'use client'

import { redirect } from 'next/navigation'

export default function ContentPage() {
  // Redirect to content-builder for now
  // This will be expanded in future stories
  redirect('/content-builder')
}