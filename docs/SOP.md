# Coach Reflection Standard Operating Procedures

## Daily Operations

### Monitoring

1. **Check Vercel Dashboard**
   - Review deployment status
   - Check for failed builds
   - Monitor function invocations and errors

2. **Check Supabase Dashboard**
   - Review database health
   - Check auth logs for failed attempts
   - Monitor storage usage

3. **Check Stripe Dashboard**
   - Review new subscriptions
   - Check for failed payments
   - Monitor revenue metrics

### Common Tasks

#### Adding a New User Manually
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter email and password
4. User will receive confirmation email

#### Granting Pro Access
1. Go to Supabase Dashboard > Table Editor > profiles
2. Find user by email or user_id
3. Update `subscription_tier` to "pro"
4. Update `subscription_status` to "active"

#### Resetting Monthly Reflection Counts
Run in Supabase SQL Editor:
```sql
UPDATE profiles SET reflections_this_month = 0;
```

## Weekly Operations

### Analytics Review
1. Check total signups this week
2. Review conversion rate (free → pro)
3. Monitor churn rate
4. Review AI usage (Claude API costs)

### Backup Verification
1. Verify Supabase point-in-time recovery is enabled
2. Check last successful backup timestamp

## Support Procedures

### Common Issues

#### "Can't log in"
1. Check if user exists in Supabase Auth
2. Verify email is confirmed
3. Try password reset flow
4. Check for auth errors in Supabase logs

#### "AI analysis not working"
1. Verify user has Pro subscription
2. Check Anthropic API key is valid
3. Review API route logs in Vercel
4. Check for rate limiting

#### "Session plan not extracting correctly"
1. Ask user to upload clearer image
2. Check image size (max 10MB)
3. Review Claude Vision response in logs
4. Confidence score < 0.5 indicates poor extraction

#### "Payment not going through"
1. Check Stripe Dashboard for failed payments
2. Verify webhook is receiving events
3. Check user's card on file
4. Review Stripe logs for errors

### Escalation

If unable to resolve:
1. Document the issue
2. Gather relevant logs (Vercel, Supabase, Stripe)
3. Contact Kevin with summary

## Deployment Procedures

### Standard Deployment
1. Ensure all tests pass locally: `npm run build`
2. Push to main branch
3. Vercel auto-deploys
4. Verify deployment in Vercel dashboard
5. Test critical flows (signup, login, create reflection)

### Rollback
1. Go to Vercel Dashboard > Deployments
2. Find last known good deployment
3. Click "..." > "Promote to Production"
4. Verify rollback successful

### Database Migrations
1. Review migration SQL in `supabase/migrations/`
2. Backup database (Supabase Dashboard > Database > Backups)
3. Run migration in Supabase SQL Editor
4. Deploy code changes
5. Verify application works with new schema

## Emergency Procedures

### Site Down
1. Check Vercel status page
2. Check Supabase status page
3. Review recent deployments for issues
4. If recent deploy caused issue, rollback immediately

### Data Breach Suspected
1. Disable Supabase API keys immediately
2. Rotate all secrets (Stripe, Anthropic, etc.)
3. Review auth logs for unauthorized access
4. Notify Kevin immediately
5. Assess scope of breach

### Stripe Webhook Failing
1. Check webhook logs in Stripe Dashboard
2. Verify endpoint URL is correct
3. Check signing secret matches
4. Review Vercel function logs
5. If persistent, temporarily process events manually

## Handoff Checklist

For sale or transfer of the product:

- [ ] Transfer GitHub repository access
- [ ] Transfer Vercel project ownership
- [ ] Transfer Supabase project ownership
- [ ] Transfer Stripe account (or create new)
- [ ] Transfer domain (if applicable)
- [ ] Provide all credentials via CREDENTIALS.md
- [ ] Walk through this SOP document
- [ ] Introduce to any active users
- [ ] Transfer email service (Resend) if applicable

## Contact Information

- **Owner**: Kevin Middleton
- **Emergency Email**: [Add email]
- **Services Status Pages**:
  - Vercel: status.vercel.com
  - Supabase: status.supabase.com
  - Stripe: status.stripe.com
  - Anthropic: status.anthropic.com
