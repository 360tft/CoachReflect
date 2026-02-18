import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { SharedDrillView } from './shared-drill-view'

interface Props {
  params: Promise<{ id: string }>
}

async function findDrill(id: string) {
  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('saved_drills')
    .select('id, share_id, name, description, category, age_group, type, set_piece_type, drill_data, view_count, created_at')
    .eq('share_id', id)
    .eq('is_active', true)
    .single()

  if (data) {
    // Increment view count (fire and forget)
    adminClient
      .from('saved_drills')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => {})
    return data
  }

  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const drill = await findDrill(id)

  const title = drill?.name || 'Shared Drill'
  const description = drill?.description || `A ${drill?.category || 'football'} ${drill?.type === 'set-piece' ? 'set piece' : 'drill'} created with CoachReflection`

  return {
    title: `${title} | CoachReflection`,
    description,
    openGraph: {
      title: `${title} | CoachReflection`,
      description,
      type: 'article',
      siteName: 'CoachReflection',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | CoachReflection`,
      description,
    },
  }
}

export default async function SharedDrillPage({ params }: Props) {
  const { id } = await params
  const drill = await findDrill(id)

  if (!drill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Drill not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This drill may have been removed or the link is invalid.</p>
          <a href="/" className="text-[#E5A11C] hover:text-[#d4940f] font-medium">Go to CoachReflection</a>
        </div>
      </div>
    )
  }

  return <SharedDrillView drill={drill} />
}
