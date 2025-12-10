# Facebook Marketplace Onboarding Guide

Welcome! This guide will walk you through connecting your Facebook Business account to ListForge so you can publish listings to Facebook Marketplace.

## Before You Begin

You'll need:
- A personal Facebook account
- A Facebook Page for your business
- Access to Meta Business Suite (business.facebook.com)
- Admin access to your business's Product Catalog

**Time Required:** 15-30 minutes for initial setup (plus 1-4 weeks for Meta verification if not already completed)

---

## Step 1: Verify Your Business with Meta

Meta requires business verification before you can use commerce features.

### Check Your Verification Status

1. Go to [Meta Business Suite Settings](https://business.facebook.com/settings/info)
2. Look for "Business Verification" in the left sidebar
3. Check your current status:
   - **Verified** - You're ready to proceed to Step 2
   - **Not Started** - You need to complete verification
   - **Pending** - Wait for Meta to complete review

### Complete Verification (if needed)

1. Click **Start Verification**
2. Provide:
   - Legal business name
   - Business address
   - Phone number
   - Business website
3. Upload supporting documents:
   - Business license, or
   - Utility bill with business name, or
   - Tax documents
4. Complete phone verification
5. Wait for Meta review (typically 1-4 business days)

---

## Step 2: Set Up Your Product Catalog

A Product Catalog is where Facebook stores your product listings.

### Create a New Catalog

1. Go to [Commerce Manager](https://business.facebook.com/commerce/)
2. Click **Create a Catalog**
3. Select **E-commerce** as the catalog type
4. Name your catalog (e.g., "ListForge Products")
5. Select your Business Manager account
6. Click **Create**

### Find Your Catalog ID

1. Open your catalog in Commerce Manager
2. Click **Settings** in the left sidebar
3. Your **Catalog ID** is displayed at the top
4. Save this ID - you'll enter it when connecting in ListForge

---

## Step 3: Connect to ListForge

### Start the Connection

1. Log into ListForge
2. Go to **Settings** > **Marketplace Connections**
3. Find **Facebook Marketplace** in the list
4. Click **Connect**

### Authorize ListForge

1. You'll be redirected to Facebook
2. Log in if prompted
3. Review the permissions ListForge is requesting:
   - Manage your product catalog
   - Read your Page information
   - Manage your business settings
4. Click **Continue** to grant access
5. Select which Page to connect (if you have multiple)
6. Click **Done**

### Complete Setup in ListForge

1. You'll be redirected back to ListForge
2. Enter your **Catalog ID** from Step 2
3. Click **Save**
4. Your Facebook account should now appear as "Connected"

---

## Step 4: Publish Your First Listing

### Requirements for Facebook Listings

Facebook has specific requirements for product listings:

| Field | Requirements |
|-------|-------------|
| Title | 1-150 characters |
| Description | 1-9,999 characters |
| Price | Must be in cents (e.g., $19.99 = 1999) |
| Images | At least 1, min 500x500px, max 8MB |
| Condition | new, refurbished, used_like_new, used_good, used_fair |

### Publish from ListForge

1. Go to your **Items** list
2. Select an item that's ready to publish
3. Click **Publish to Marketplaces**
4. Check **Facebook Marketplace**
5. Review/edit the listing details
6. Click **Publish**

### Check Your Listing

1. Go to [Commerce Manager](https://business.facebook.com/commerce/)
2. Open your catalog
3. Click **Items** to see your products
4. New listings may take 5-15 minutes to appear

---

## Troubleshooting

### "Unable to connect" Error

**Possible causes:**
- Your Facebook session expired - try logging in again
- Browser blocking popups - allow popups from ListForge
- Missing business verification - complete Step 1

**Solution:** Clear your browser cache, then try connecting again.

### "Permission denied" Error

**Possible causes:**
- You're not an admin on the Facebook Page
- Your business isn't verified
- The app hasn't been approved for your permissions

**Solution:** Verify you have admin access to the Page and your business is verified.

### Listing Not Appearing on Marketplace

**Possible causes:**
- Listing is in review (can take up to 24 hours)
- Listing violated Facebook Commerce Policies
- Price is $0 or invalid

**Solution:**
1. Check Commerce Manager for review status
2. Review Facebook's [Commerce Policies](https://www.facebook.com/policies/commerce)
3. Verify price is greater than $0

### "Token expired" Error

Facebook tokens expire after approximately 60 days.

**Solution:**
1. Go to Settings > Marketplace Connections
2. Click **Reconnect** next to Facebook
3. Complete the authorization flow again

---

## Managing Your Connection

### Disconnect Facebook

1. Go to **Settings** > **Marketplace Connections**
2. Find your Facebook account
3. Click the trash icon
4. Confirm disconnection

Note: This won't delete listings already published to Facebook.

### Refresh Your Token

If you see "Token Expiring Soon":

1. Go to **Settings** > **Marketplace Connections**
2. Click **Try Refresh** next to Facebook
3. If that fails, click **Reconnect**

---

## Facebook Commerce Policies

Your listings must comply with Facebook's Commerce Policies. Key rules:

**Allowed:**
- Physical products you own
- New and used items
- Most retail categories

**Not Allowed:**
- Services (use Facebook Services instead)
- Digital products
- Animals
- Weapons/ammunition
- Adult products
- Alcohol, tobacco, drugs
- Recalled items
- Tickets to events

For the complete list, see [Facebook Commerce Policies](https://www.facebook.com/policies/commerce).

---

## Rate Limits

Facebook has rate limits to prevent abuse:

| Action | Limit |
|--------|-------|
| New listings | ~200 per hour |
| Updates | ~200 per hour |
| API calls | Varies by permission level |

If you hit rate limits, ListForge will automatically retry after a delay.

---

## Getting Help

### ListForge Support

- Check our [FAQ](/help/faq)
- Contact support: support@listforge.com

### Facebook Resources

- [Commerce Manager Help](https://www.facebook.com/business/help/commerce-manager)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [Facebook Commerce Policies](https://www.facebook.com/policies/commerce)

---

## Quick Reference

| Item | Where to Find It |
|------|------------------|
| Catalog ID | Commerce Manager > Settings |
| Business Verification | Meta Business Suite > Settings > Business Info |
| Page Admin Access | Facebook Page > Settings > Page Roles |
| Listing Status | Commerce Manager > Catalog > Items |
| Connection Status | ListForge > Settings > Marketplace Connections |

---

## Appendix: Permission Scopes

When you connect, ListForge requests these permissions:

| Permission | What It Allows |
|------------|----------------|
| `catalog_management` | Create and update product listings |
| `pages_read_engagement` | Read your Page's basic information |
| `business_management` | Access your business settings |
| `pages_show_list` | See which Pages you manage |

ListForge does **not** request:
- Access to your personal profile
- Ability to post on your personal timeline
- Access to your friends list
- Messenger access
