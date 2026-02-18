# Supabase Email Templates for CoachReflection

Copy each template into Supabase Dashboard → Authentication → Email Templates

---

## 1. Confirm Signup

**Subject:** Confirm your CoachReflection account

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 32px; font-weight: bold; color: #E5A11C;">CR</span>
      <h1 style="font-size: 24px; color: #1f2937; margin: 10px 0;">CoachReflection</h1>
    </div>

    <!-- Content -->
    <p style="font-size: 16px; margin: 16px 0;">Welcome to CoachReflection!</p>

    <p style="font-size: 16px; margin: 16px 0;">Click the button below to confirm your email address and start your coaching journey.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #E5A11C; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">Confirm Email</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">If you didn't create an account with CoachReflection, you can safely ignore this email.</p>

    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin: 0;">Part of the 360TFT family of coaching tools</p>
  </div>
</body>
</html>
```

---

## 2. Magic Link

**Subject:** Your CoachReflection login link

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 32px; font-weight: bold; color: #E5A11C;">CR</span>
      <h1 style="font-size: 24px; color: #1f2937; margin: 10px 0;">CoachReflection</h1>
    </div>

    <!-- Content -->
    <p style="font-size: 16px; margin: 16px 0;">Click the button below to sign in to your CoachReflection account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #E5A11C; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">Sign In</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>

    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin: 0;">Part of the 360TFT family of coaching tools</p>
  </div>
</body>
</html>
```

---

## 3. Reset Password

**Subject:** Reset your CoachReflection password

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 32px; font-weight: bold; color: #E5A11C;">CR</span>
      <h1 style="font-size: 24px; color: #1f2937; margin: 10px 0;">CoachReflection</h1>
    </div>

    <!-- Content -->
    <p style="font-size: 16px; margin: 16px 0;">We received a request to reset your password.</p>

    <p style="font-size: 16px; margin: 16px 0;">Click the button below to choose a new password.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #E5A11C; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">Reset Password</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">This link expires in 24 hours. If you didn't request a password reset, you can safely ignore this email - your password won't change.</p>

    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin: 0;">Part of the 360TFT family of coaching tools</p>
  </div>
</body>
</html>
```

---

## 4. Change Email Address

**Subject:** Confirm your new email address

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 32px; font-weight: bold; color: #E5A11C;">CR</span>
      <h1 style="font-size: 24px; color: #1f2937; margin: 10px 0;">CoachReflection</h1>
    </div>

    <!-- Content -->
    <p style="font-size: 16px; margin: 16px 0;">You requested to change your email address.</p>

    <p style="font-size: 16px; margin: 16px 0;">Click the button below to confirm this new email address.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #E5A11C; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">Confirm New Email</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">If you didn't request this change, please contact us immediately.</p>

    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin: 0;">Part of the 360TFT family of coaching tools</p>
  </div>
</body>
</html>
```

---

## 5. Invite User (for clubs)

**Subject:** You've been invited to CoachReflection

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 32px; font-weight: bold; color: #E5A11C;">CR</span>
      <h1 style="font-size: 24px; color: #1f2937; margin: 10px 0;">CoachReflection</h1>
    </div>

    <!-- Content -->
    <p style="font-size: 16px; margin: 16px 0;">You've been invited to join CoachReflection!</p>

    <p style="font-size: 16px; margin: 16px 0;">Click the button below to accept the invitation and set up your account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #E5A11C; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">Accept Invitation</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">This invitation expires in 7 days.</p>

    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin: 0;">Part of the 360TFT family of coaching tools</p>
  </div>
</body>
</html>
```

---

## How to Apply

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Click on each template type
3. Paste the Subject line
4. Paste the HTML body
5. Save

**Note:** The `{{ .ConfirmationURL }}` variable is automatically replaced by Supabase with the actual confirmation link.
