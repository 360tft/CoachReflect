// Club License System for CoachReflect
// Allows teams/clubs to purchase group subscriptions

import { createAdminClient } from "@/lib/supabase/admin"
import { CLUB_TIERS, type ClubTier, getClubTier } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface Club {
  id: string
  name: string
  admin_user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'trialing' | null
  tier: ClubTier
  max_seats: number
  billing_period: 'monthly' | 'annual'
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface ClubMembership {
  id: string
  club_id: string
  user_id: string
  role: 'admin' | 'coach'
  status: 'pending' | 'active' | 'removed'
  invited_email: string | null
  invited_at: string | null
  joined_at: string | null
  created_at: string
}

export interface ClubWithMembers extends Club {
  memberships: ClubMembership[]
  member_count: number
}

// =============================================================================
// CLUB QUERIES
// =============================================================================

/**
 * Get club by ID
 */
export async function getClub(clubId: string): Promise<Club | null> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .single()

  if (error || !data) return null
  return data as Club
}

/**
 * Get club by admin user ID
 */
export async function getClubByAdmin(adminUserId: string): Promise<Club | null> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('clubs')
    .select('*')
    .eq('admin_user_id', adminUserId)
    .eq('subscription_status', 'active')
    .single()

  if (error || !data) return null
  return data as Club
}

/**
 * Get club with all members
 */
export async function getClubWithMembers(clubId: string): Promise<ClubWithMembers | null> {
  const adminClient = createAdminClient()

  const { data: club, error: clubError } = await adminClient
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .single()

  if (clubError || !club) return null

  const { data: memberships } = await adminClient
    .from('club_memberships')
    .select('*')
    .eq('club_id', clubId)
    .neq('status', 'removed')

  return {
    ...club,
    memberships: memberships || [],
    member_count: memberships?.filter(m => m.status === 'active').length || 0,
  } as ClubWithMembers
}

/**
 * Get user's club membership
 */
export async function getUserClubMembership(userId: string): Promise<{
  club: Club
  membership: ClubMembership
} | null> {
  const adminClient = createAdminClient()

  const { data: membership, error } = await adminClient
    .from('club_memberships')
    .select(`
      *,
      clubs (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !membership) return null

  // Check if the club subscription is active
  const club = (membership as Record<string, unknown>).clubs as Club
  if (club.subscription_status !== 'active') return null

  return {
    club,
    membership: membership as ClubMembership,
  }
}

/**
 * Check if user has Pro access via club membership
 */
export async function hasClubAccess(userId: string): Promise<boolean> {
  const membership = await getUserClubMembership(userId)
  return membership !== null
}

// =============================================================================
// CLUB MANAGEMENT
// =============================================================================

/**
 * Create a new club (called after Stripe checkout success)
 */
export async function createClub(params: {
  name: string
  adminUserId: string
  tier: ClubTier
  billingPeriod: 'monthly' | 'annual'
  stripeCustomerId: string
  stripeSubscriptionId: string
  currentPeriodEnd: string
}): Promise<Club> {
  const adminClient = createAdminClient()
  const tierConfig = getClubTier(params.tier)

  if (!tierConfig) {
    throw new Error(`Invalid club tier: ${params.tier}`)
  }

  // Create the club
  const { data: club, error: clubError } = await adminClient
    .from('clubs')
    .insert({
      name: params.name,
      admin_user_id: params.adminUserId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      subscription_status: 'active',
      tier: params.tier,
      max_seats: tierConfig.maxSeats,
      billing_period: params.billingPeriod,
      current_period_end: params.currentPeriodEnd,
    })
    .select()
    .single()

  if (clubError || !club) {
    throw new Error(`Failed to create club: ${clubError?.message}`)
  }

  // Add admin as first member
  await adminClient
    .from('club_memberships')
    .insert({
      club_id: club.id,
      user_id: params.adminUserId,
      role: 'admin',
      status: 'active',
      joined_at: new Date().toISOString(),
    })

  return club as Club
}

/**
 * Update club subscription status (called from webhook)
 */
export async function updateClubSubscription(
  stripeSubscriptionId: string,
  status: Club['subscription_status'],
  currentPeriodEnd?: string
): Promise<void> {
  const adminClient = createAdminClient()

  const updateData: Partial<Club> = {
    subscription_status: status,
    updated_at: new Date().toISOString(),
  }

  if (currentPeriodEnd) {
    updateData.current_period_end = currentPeriodEnd
  }

  await adminClient
    .from('clubs')
    .update(updateData)
    .eq('stripe_subscription_id', stripeSubscriptionId)
}

/**
 * Invite a coach to the club
 */
export async function inviteCoach(
  clubId: string,
  email: string,
  invitedByUserId: string
): Promise<ClubMembership> {
  const adminClient = createAdminClient()

  // Check if club has available seats
  const club = await getClubWithMembers(clubId)
  if (!club) {
    throw new Error('Club not found')
  }

  if (club.member_count >= club.max_seats) {
    throw new Error(`Club has reached maximum seats (${club.max_seats})`)
  }

  // Check if email is already invited
  const { data: existing } = await adminClient
    .from('club_memberships')
    .select('id, status')
    .eq('club_id', clubId)
    .eq('invited_email', email.toLowerCase())
    .single()

  if (existing && existing.status !== 'removed') {
    throw new Error('This email has already been invited')
  }

  // Create pending membership
  const { data: membership, error } = await adminClient
    .from('club_memberships')
    .insert({
      club_id: clubId,
      user_id: null, // Will be set when user accepts
      role: 'coach',
      status: 'pending',
      invited_email: email.toLowerCase(),
      invited_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !membership) {
    throw new Error(`Failed to create invitation: ${error?.message}`)
  }

  return membership as ClubMembership
}

/**
 * Accept club invitation
 */
export async function acceptInvitation(
  membershipId: string,
  userId: string
): Promise<ClubMembership> {
  const adminClient = createAdminClient()

  const { data: membership, error } = await adminClient
    .from('club_memberships')
    .update({
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    .eq('id', membershipId)
    .eq('status', 'pending')
    .select()
    .single()

  if (error || !membership) {
    throw new Error('Failed to accept invitation')
  }

  return membership as ClubMembership
}

/**
 * Remove a coach from the club
 */
export async function removeCoach(
  clubId: string,
  membershipId: string,
  removedByUserId: string
): Promise<void> {
  const adminClient = createAdminClient()

  // Verify the remover is an admin
  const { data: adminMembership } = await adminClient
    .from('club_memberships')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', removedByUserId)
    .single()

  if (!adminMembership || adminMembership.role !== 'admin') {
    throw new Error('Only club admins can remove members')
  }

  // Remove the member (soft delete)
  await adminClient
    .from('club_memberships')
    .update({ status: 'removed' })
    .eq('id', membershipId)
    .eq('club_id', clubId)
    .neq('role', 'admin') // Can't remove admin
}

// =============================================================================
// SUBSCRIPTION HELPERS
// =============================================================================

/**
 * Get subscription type for a user (individual, club, or free)
 */
export async function getSubscriptionType(userId: string): Promise<'individual' | 'club' | 'free'> {
  const adminClient = createAdminClient()

  // Check for individual subscription first
  const { data: profile } = await adminClient
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('user_id', userId)
    .single()

  if (profile?.subscription_tier !== 'free' && profile?.subscription_status === 'active') {
    return 'individual'
  }

  // Check for club membership
  const hasClub = await hasClubAccess(userId)
  if (hasClub) {
    return 'club'
  }

  return 'free'
}

/**
 * Check if user has active Pro subscription (individual or club)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  // Check pro testers whitelist
  const whitelist = process.env.PRO_TESTERS_WHITELIST?.split(',') || []
  const adminClient = createAdminClient()

  const { data: user } = await adminClient.auth.admin.getUserById(userId)
  if (user?.user?.email && whitelist.includes(user.user.email)) {
    return true
  }

  const subscriptionType = await getSubscriptionType(userId)
  return subscriptionType !== 'free'
}
