# Supabase Email Templates for Coach Reflection

Copy these templates into Supabase Dashboard → Authentication → Email Templates.

Brand Color: `#E5A11C` (Gold)

---

## 1. Confirm Signup

**Subject:** Confirm your Coach Reflection account

```html
<h2 style="color: #E5A11C; font-family: Arial, sans-serif;">Welcome to Coach Reflection</h2>

<p style="font-family: Arial, sans-serif; color: #374151; font-size: 16px;">
Thanks for signing up! Please confirm your email address to get started:
</p>

<p style="margin: 24px 0;">
<a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=signup" style="background-color: #E5A11C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; display: inline-block; font-weight: bold;">
Confirm Email
</a>
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
If you didn't create an account with Coach Reflection, you can safely ignore this email.
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
— The Coach Reflection Team
</p>
```

---

## 2. Reset Password (Recovery)

**Subject:** Reset your Coach Reflection password

```html
<h2 style="color: #E5A11C; font-family: Arial, sans-serif;">Reset Your Password</h2>

<p style="font-family: Arial, sans-serif; color: #374151; font-size: 16px;">
We received a request to reset your password. Click the button below to choose a new one:
</p>

<p style="margin: 24px 0;">
<a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=recovery" style="background-color: #E5A11C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; display: inline-block; font-weight: bold;">
Reset Password
</a>
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
— The Coach Reflection Team
</p>
```

---

## 3. Magic Link

**Subject:** Your Coach Reflection login link

```html
<h2 style="color: #E5A11C; font-family: Arial, sans-serif;">Your Login Link</h2>

<p style="font-family: Arial, sans-serif; color: #374151; font-size: 16px;">
Click the button below to log in to Coach Reflection:
</p>

<p style="margin: 24px 0;">
<a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=magiclink" style="background-color: #E5A11C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; display: inline-block; font-weight: bold;">
Log In
</a>
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
This link will expire in 24 hours. If you didn't request this link, you can safely ignore this email.
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
— The Coach Reflection Team
</p>
```

---

## 4. Change Email Address

**Subject:** Confirm your new email address

```html
<h2 style="color: #E5A11C; font-family: Arial, sans-serif;">Confirm Email Change</h2>

<p style="font-family: Arial, sans-serif; color: #374151; font-size: 16px;">
You requested to change your email address. Click the button below to confirm:
</p>

<p style="margin: 24px 0;">
<a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=email_change" style="background-color: #E5A11C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; display: inline-block; font-weight: bold;">
Confirm New Email
</a>
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
If you didn't request this change, please contact support immediately.
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
— The Coach Reflection Team
</p>
```

---

## 5. Invite User

**Subject:** You've been invited to Coach Reflection

```html
<h2 style="color: #E5A11C; font-family: Arial, sans-serif;">You're Invited!</h2>

<p style="font-family: Arial, sans-serif; color: #374151; font-size: 16px;">
You've been invited to join Coach Reflection. Click the button below to accept and set up your account:
</p>

<p style="margin: 24px 0;">
<a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=invite" style="background-color: #E5A11C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; display: inline-block; font-weight: bold;">
Accept Invitation
</a>
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
This invitation will expire in 7 days.
</p>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
— The Coach Reflection Team
</p>
```

---

## Supabase Settings

In Supabase Dashboard → Authentication → Email Templates:

| Setting | Value |
|---------|-------|
| Site URL | `https://coachreflection.com` |
| Redirect URLs | `https://coachreflection.com/**` |

Make sure the callback URLs point to `/api/auth/callback` (not `/auth/callback`).
