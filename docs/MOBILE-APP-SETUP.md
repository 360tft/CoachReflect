# CoachReflection Mobile App Setup Guide

Everything you need to do to get the iOS and Android apps into the stores. Follow in order.

---

## Step 1: Run the Database Migration

Before anything else, add the new columns to your Supabase database.

1. Go to https://supabase.com/dashboard
2. Select the **CoachReflection** project
3. Click **SQL Editor** in the left sidebar
4. Paste this SQL and click **Run**:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_source TEXT CHECK (subscription_source IN ('stripe', 'apple', 'google'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_app_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_user_id ON profiles(revenuecat_app_user_id) WHERE revenuecat_app_user_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled'));
  END IF;
END $$;
```

5. You should see "Success. No rows returned" — that means it worked.

---

## Step 2: Generate Native Projects

Run these commands from the CoachReflect directory:

```bash
cd /home/kevin/CoachReflect
npx cap add ios
npx cap add android
npx cap sync
```

This creates `ios/` and `android/` directories in the project. You'll need Xcode installed for iOS (Mac only) and Android Studio for Android.

**If you've already run these before**, just run `npx cap sync` to update.

---

## Step 3: Create a RevenueCat Account

1. Go to https://www.revenuecat.com
2. Click **Get Started** (top right)
3. Sign up with your email (use admin@360tft.com)
4. Verify your email

---

## Step 4: Create a RevenueCat Project

1. After logging in, you'll land on the RevenueCat dashboard: https://app.revenuecat.com
2. Click **Create New Project**
3. Name it: `CoachReflection`
4. Click **Create Project**

---

## Step 5: Add iOS App to RevenueCat

1. Inside your RevenueCat project, click **Apps & providers** in the left sidebar
2. Click **+ New** (top right)
3. Select **Apple App Store**
4. Fill in:
   - **App name**: `Coach Reflection`
   - **Bundle ID**: `com.coachreflection.app`
   - **App Store Connect Shared Secret**: You'll get this from App Store Connect (see Step 7). Leave blank for now and come back to fill it in after Step 7d.
5. Click **Save**
6. Now go to **API keys** in the left sidebar — find the iOS key (starts with `appl_`). **Copy it** — you'll need it for Vercel env vars.

---

## Step 6: Add Android App to RevenueCat

1. Still in RevenueCat, click **Apps & providers** in the left sidebar → **+ New** (top right)
2. Select **Google Play Store**
3. Fill in:
   - **App name**: `Coach Reflection`
   - **Package name**: `com.coachreflection.app`
4. For the **Google Play service account credentials**, you'll need a JSON key file from Google Play Console. Leave blank for now and come back after Step 8c.
5. Click **Save**
6. Go to **API keys** in the left sidebar — find the Android key (starts with `goog_`). **Copy it** — you'll need it for Vercel env vars.

---

## Step 7: Set Up App Store Connect (iOS)

### 7a: Create the App

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click **My Apps** → the **+** button → **New App**
4. Fill in:
   - **Platforms**: iOS
   - **Name**: `Coach Reflection`
   - **Primary Language**: English (UK)
   - **Bundle ID**: Select `com.coachreflection.app` (you may need to register this in the Developer portal first — see 7b)
   - **SKU**: `coachreflection`
   - **User Access**: Full Access
5. Click **Create**

### 7b: Register the Bundle ID (if not already done)

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the **+** button
3. Select **App IDs** → **App**
4. Fill in:
   - **Description**: `Coach Reflection`
   - **Bundle ID**: Explicit → `com.coachreflection.app`
5. Under **Capabilities**, enable **In-App Purchase**
6. Click **Continue** → **Register**

### 7c: Create In-App Purchase Products

1. In App Store Connect, go to your Coach Reflection app
2. Click **Monetization** → **Subscriptions** in the left sidebar
3. Click **Create Subscription Group**
   - Group name: `Coach Reflection Pro`
4. Inside the group, click **Create Subscription** four times to create:

| Reference Name | Product ID | Duration | Price |
|---|---|---|---|
| Pro Monthly | `coachreflect_pro_monthly` | 1 Month | $7.99 |
| Pro Annual | `coachreflect_pro_annual` | 1 Year | $76.99 |
| Pro+ Monthly | `coachreflect_proplus_monthly` | 1 Month | $19.99 |
| Pro+ Annual | `coachreflect_proplus_annual` | 1 Year | $199.00 |

For each product:
- Click the product → **Subscription Prices** → **+** → Select your price → **Next** → **Confirm**
- Add a **Localisation** (display name and description shown to users):
  - Pro Monthly: "Pro — monthly" / "Unlimited reflections, voice notes, structured reflection, pattern detection"
  - Pro Annual: "Pro — annual" / "Save 20%. Unlimited reflections, voice notes, structured reflection, pattern detection"
  - Pro+ Monthly: "Pro+ — monthly" / "Everything in Pro plus unlimited voice notes, communication analysis, CPD documentation"
  - Pro+ Annual: "Pro+ — annual" / "Save 17%. Everything in Pro plus unlimited voice notes, communication analysis, CPD documentation"

### 7d: Get the Shared Secret (for RevenueCat)

1. In App Store Connect, go to your app
2. Click **General** → **App Information**
3. Scroll down to **App-Specific Shared Secret**
4. Click **Manage** → **Generate**
5. **Copy the shared secret**
6. Go back to RevenueCat → **Apps & providers** → click your iOS app → paste it into the **App Store Connect Shared Secret** field → **Save**

---

## Step 8: Set Up Google Play Console (Android)

### 8a: Create the App

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - **App name**: `Coach Reflection`
   - **Default language**: English (United Kingdom)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept the declarations and click **Create app**

### 8b: Create In-App Subscriptions

1. In your app, click **Monetise** → **Subscriptions** in the left sidebar
2. Click **Create subscription** four times:

| Product ID | Name |
|---|---|
| `coachreflect_pro_monthly` | Pro Monthly |
| `coachreflect_pro_annual` | Pro Annual |
| `coachreflect_proplus_monthly` | Pro+ Monthly |
| `coachreflect_proplus_annual` | Pro+ Annual |

For each subscription:
- Click into it → **Add a base plan**
- Set the billing period (1 month or 1 year)
- Click **Set price** → select your regions → enter the price ($7.99, $76.99, $19.99, or $199.00)
- Click **Activate**

### 8c: Create a Service Account (for RevenueCat)

RevenueCat needs a Google service account to verify purchases.

1. Go to https://console.cloud.google.com
2. Select or create a project for Coach Reflection
3. Go to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
   - Name: `revenuecat-coachreflect`
   - Click **Create and Continue**
   - Skip the role step (click **Continue**)
   - Click **Done**
5. Click on the service account you just created
6. Go to the **Keys** tab → **Add Key** → **Create New Key** → **JSON** → **Create**
7. A JSON file downloads — **keep this safe**

Now grant it access to Google Play:

8. Go to https://play.google.com/console → **Settings** (gear icon bottom left) → **API access**
9. Click **Link** next to your Google Cloud project
10. Under **Service accounts**, find `revenuecat-coachreflect` → click **Manage Play Console permissions**
11. Under **Account permissions**, enable:
    - **View app information and download bulk reports**
    - **View financial data, orders, and cancellation survey responses**
    - **Manage orders and subscriptions**
12. Click **Invite user** → **Send invitation**

Now upload to RevenueCat:

13. Go to RevenueCat → **Apps & providers** in the left sidebar → click your Android app
14. Upload the JSON key file you downloaded in step 6 into the **Service Account Credentials** field
15. Click **Save**

---

## Step 9: Set Up RevenueCat Product Catalog, Webhook, and API Keys

Everything in this step happens in the RevenueCat dashboard. The left sidebar has these sections:

```
Overview
Charts
Customers
Product catalog    <-- entitlements, offerings, products
Paywalls
Targeting
Experiments
Web
Customer Center
---
Apps & providers   <-- where you added iOS/Android apps
API keys           <-- where you find your public API keys
Integrations       <-- webhooks are here
Project settings
```

### 9a: Create Entitlements

1. Click **Product catalog** in the left sidebar
2. You'll see tabs across the top: **Entitlements**, **Products**, **Offerings**
3. Click the **Entitlements** tab
4. Click **+ New**
   - Identifier: `pro`
   - Display name: `Pro Access`
   - Click **Save**
5. Click **+ New** again
   - Identifier: `pro_plus`
   - Display name: `Pro+ Access`
   - Click **Save**

### 9b: Create Products

1. Still in **Product catalog**, click the **Products** tab
2. Click **+ New**
3. You need to create 4 products. For each one:
   - Enter the **Product identifier** (must match what you created in App Store Connect / Google Play)
   - Select the **App** (iOS or Android)
   - Click **Save**

Create these (you'll do each one twice — once for iOS, once for Android, 8 total):

| Product Identifier | App |
|---|---|
| `coachreflect_pro_monthly` | iOS (Apple App Store) |
| `coachreflect_pro_monthly` | Android (Google Play Store) |
| `coachreflect_pro_annual` | iOS |
| `coachreflect_pro_annual` | Android |
| `coachreflect_proplus_monthly` | iOS |
| `coachreflect_proplus_monthly` | Android |
| `coachreflect_proplus_annual` | iOS |
| `coachreflect_proplus_annual` | Android |

### 9c: Attach Products to Entitlements

1. Go back to the **Entitlements** tab
2. Click on the `pro` entitlement
3. Click **Attach** → select all 8 products (all Pro and Pro+ products)
   - Both Pro and Pro+ tiers should grant the `pro` entitlement (Pro+ is a superset of Pro)
4. Click **Save**
5. Go back, click on the `pro_plus` entitlement
6. Click **Attach** → select only the 4 Pro+ products (`coachreflect_proplus_monthly` and `coachreflect_proplus_annual`, both iOS and Android)
7. Click **Save**

### 9d: Create an Offering

1. Still in **Product catalog**, click the **Offerings** tab
2. You should see a **Default** offering already created. Click into it.
3. Click **+ New Package** and create two packages:

**Monthly package:**
- Package type: **Monthly**
- Click into it → **Attach Product** → select `coachreflect_pro_monthly` (iOS) and `coachreflect_pro_monthly` (Android)

**Annual package:**
- Package type: **Annual**
- Click into it → **Attach Product** → select `coachreflect_pro_annual` (iOS) and `coachreflect_pro_annual` (Android)

4. If you want Pro+ as a separate offering (recommended):
   - Go back to the **Offerings** tab
   - Click **+ New Offering**
   - Identifier: `pro_plus`
   - Display name: `Pro+ Plans`
   - Create Monthly and Annual packages with the Pro+ products

### 9e: Set Up the Webhook

1. Click **Integrations** in the left sidebar (not "Project settings")
2. Find **Webhooks** and click on it
3. Click **+ New Webhook** (or **Add endpoint**)
4. Fill in:
   - **Webhook URL**: `https://www.coachreflection.com/api/revenuecat/webhook`
   - **Authorization header value**: Generate a secret string first by running this in your terminal:
     ```bash
     openssl rand -hex 32
     ```
     Paste the output as the authorization header value.
5. Click **Save**
6. **Write down that secret string** — you'll need it as `REVENUECAT_WEBHOOK_SECRET` in Vercel (Step 10)

### 9f: Find Your API Keys

1. Click **API keys** in the left sidebar
2. You'll see your public API keys listed:
   - **iOS key** starts with `appl_` — copy it
   - **Android key** starts with `goog_` — copy it
3. You'll add these to Vercel in Step 10

---

## Step 10: Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select the **CoachReflection** project
3. Click **Settings** → **Environment Variables**
4. Add these three variables (select all environments: Production, Preview, Development):

| Key | Value | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_REVENUECAT_IOS_API_KEY` | `appl_xxxxxxxx` | RevenueCat → **API keys** (left sidebar) → iOS key |
| `NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY` | `goog_xxxxxxxx` | RevenueCat → **API keys** (left sidebar) → Android key |
| `REVENUECAT_WEBHOOK_SECRET` | The secret you created in Step 9e | The string you entered as the Authorization header value |

5. Click **Save** for each

---

## Step 11: Set Up Codemagic

### 11a: Create Account

1. Go to https://codemagic.io
2. Click **Get Started Free**
3. Sign up with GitHub (use the account that has the CoachReflect repo)

### 11b: Connect the Repo

1. In Codemagic dashboard, click **Add application**
2. Select **GitHub** → find `CoachReflect` repo
3. Select it → click **Add application**
4. Codemagic will detect the `codemagic.yaml` file automatically

### 11c: Set Up iOS Signing

1. In Codemagic, go to **Teams** → **Integrations** (or your app → **Settings**)
2. Under **Code signing — iOS**, click **App Store Connect**
3. You need to add an **App Store Connect API key**:
   - Go to https://appstoreconnect.apple.com/access/integrations/api
   - Click **Generate API Key** (or use an existing one)
   - **Name**: `Codemagic`
   - **Access**: `Developer`
   - Download the `.p8` file
   - Note the **Key ID** and **Issuer ID** (shown at the top of the page)
4. Back in Codemagic, upload the `.p8` file, enter Key ID and Issuer ID
5. Click **Save**

Codemagic will now automatically fetch your provisioning profiles and certificates.

### 11d: Set Up Android Signing

1. First, create an Android keystore (if you don't have one). Run this locally:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore coachreflection.keystore -alias coachreflection -keyalg RSA -keysize 2048 -validity 10000
```

It will ask for:
- **Keystore password**: Choose a strong password (save it!)
- **Key password**: Use the same password
- **First and last name**: `Kevin Middleton`
- **Organisation**: `360TFT`
- **City**: Your city
- **Country code**: `GB`

2. Convert the keystore to base64:

```bash
base64 -w 0 coachreflection.keystore
```

3. In Codemagic, go to your app → **Environment variables**
4. Add these variables under a group called `android_credentials`:

| Variable | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | The base64 string from step 2 |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password you chose |
| `ANDROID_KEY_ALIAS` | `coachreflection` |
| `ANDROID_KEY_PASSWORD` | The key password you chose |

5. **Mark all as "Secure"** (encrypted)

### 11e: Trigger a Build

1. Push the code to `main` branch
2. Or in Codemagic, click **Start new build** → select the workflow (iOS or Android)
3. Watch the build logs — first build may need to resolve signing issues

---

## Step 12: Submit to App Stores

### iOS (via Codemagic)

Once the iOS build succeeds in Codemagic, it automatically uploads to TestFlight.

1. Go to App Store Connect → your app → **TestFlight**
2. You'll see the build there — click it to start testing
3. When ready for production:
   - Go to **App Store** tab → fill in all required metadata
   - Screenshots (6.7" and 6.5" sizes minimum)
   - Description, keywords, privacy policy URL (`https://www.coachreflection.com/privacy`)
   - Support URL (`https://www.coachreflection.com/help`)
   - Age rating: Complete the questionnaire (educational app, no objectionable content → rated 4+)
4. Click **Submit for Review**

### Android (via Codemagic)

The Android build produces an `.aab` file. Upload it manually for the first release:

1. Download the `.aab` from Codemagic build artifacts
2. Go to Google Play Console → your app → **Production** → **Create new release**
3. Upload the `.aab` file
4. Fill in release notes
5. Fill in the **Store listing** (under **Grow** → **Store presence** → **Main store listing**):
   - App name, short description, full description
   - Screenshots (phone and tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)
   - Privacy policy URL: `https://www.coachreflection.com/privacy`
6. Complete the **Content rating** questionnaire
7. Complete the **Data safety** section:
   - Collects email addresses (account management)
   - Collects usage data (analytics)
8. Click **Submit for Review**

---

## Quick Reference: Product IDs

| Product | iOS Product ID | Android Product ID |
|---|---|---|
| Pro Monthly | `coachreflect_pro_monthly` | `coachreflect_pro_monthly` |
| Pro Annual | `coachreflect_pro_annual` | `coachreflect_pro_annual` |
| Pro+ Monthly | `coachreflect_proplus_monthly` | `coachreflect_proplus_monthly` |
| Pro+ Annual | `coachreflect_proplus_annual` | `coachreflect_proplus_annual` |

## Quick Reference: Environment Variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_REVENUECAT_IOS_API_KEY` | RevenueCat → **API keys** (left sidebar) → iOS key (starts with `appl_`) |
| `NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY` | RevenueCat → **API keys** (left sidebar) → Android key (starts with `goog_`) |
| `REVENUECAT_WEBHOOK_SECRET` | The secret you generated in Step 9e and entered as webhook Authorization header |

---

## Troubleshooting

**Build fails in Codemagic with signing error:**
- iOS: Check that the App Store Connect API key is uploaded correctly and has Developer access
- Android: Check that the keystore base64 is correct (`echo $ANDROID_KEYSTORE_BASE64 | base64 --decode | file -` should say "Java KeyStore")

**RevenueCat webhook not receiving events:**
- Check the webhook URL is exactly `https://www.coachreflection.com/api/revenuecat/webhook`
- Check `REVENUECAT_WEBHOOK_SECRET` in Vercel matches the Authorization header in RevenueCat
- Check RevenueCat webhook logs: **Integrations** (left sidebar) → **Webhooks** → click the webhook → view logs

**App loads blank white screen on native:**
- CSP issue. Check browser console for Content-Security-Policy errors
- Make sure Vercel has deployed the latest code with the updated `next.config.ts`

**Purchases not reflecting in the app:**
- Check RevenueCat webhook logs for errors
- Check Supabase → profiles table → `subscription_source` column is being set
- On the device: try "Restore Purchases" button
