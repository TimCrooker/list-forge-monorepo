export interface HelpArticle {
  slug: string
  title: string
  category: string
  readTime: string
  keywords: string[]
  content: string
}

export const helpArticles: HelpArticle[] = [
  {
    slug: 'connect-ebay-account',
    title: 'How do I connect my eBay account to ListForge?',
    category: 'Marketplace Integrations',
    readTime: '3 min',
    keywords: ['ebay', 'connect', 'integration', 'marketplace', 'oauth'],
    content: `
## Connecting Your eBay Account

Connecting your eBay seller account to ListForge enables automatic listing publication, inventory synchronization, and sales tracking across your eBay store.

### Prerequisites

Before you begin, ensure you have:
- An active eBay seller account
- A verified PayPal or eBay Managed Payments account linked to your eBay
- Store subscription (optional but recommended for higher listing limits)

### Step-by-Step Connection Process

**Step 1: Navigate to Settings**

1. Log in to your ListForge dashboard
2. Click on **Settings** in the left sidebar
3. Select **Marketplace Connections**

**Step 2: Initiate eBay Connection**

1. Find the eBay card in the marketplace list
2. Click **Connect eBay Account**
3. You'll be redirected to eBay's secure login page

**Step 3: Authorize ListForge**

1. Log in to your eBay account
2. Review the permissions ListForge is requesting:
   - Read your eBay account information
   - Create and manage listings on your behalf
   - Access your selling data and order history
3. Click **Agree** to authorize

**Step 4: Confirm Connection**

After authorization, you'll be redirected back to ListForge. You should see:
- A green "Connected" status on your eBay card
- Your eBay username displayed
- Access to eBay-specific settings

### Permissions Explained

ListForge requests the following eBay permissions:

- **Account Info**: To display your seller name and store information
- **Listing Management**: To create, edit, and end listings
- **Selling Data**: To track sales and update inventory
- **Order Access**: To monitor when items sell and update ListForge inventory

We never access your financial information or make purchases on your behalf.

### Troubleshooting

**"Authorization Failed" Error**
- Clear your browser cache and cookies
- Try using a different browser
- Ensure you're logging into the correct eBay account

**"Account Already Connected" Error**
- Your eBay account may be connected to another ListForge account
- Disconnect from the other account first, or contact support

**Connection Expires**
- eBay tokens expire after 18 months
- You'll receive an email reminder before expiration
- Simply reconnect by clicking **Reconnect** in settings

### Next Steps

Once connected, you can:
1. Set default eBay listing preferences
2. Configure automatic publishing rules
3. Start publishing listings to eBay with one click
`,
  },
  {
    slug: 'ai-confidence-scores',
    title: 'Understanding AI research confidence scores and data sources',
    category: 'AI Research',
    readTime: '5 min',
    keywords: ['ai', 'confidence', 'research', 'scores', 'accuracy', 'data source'],
    content: `
## Understanding AI Confidence Scores

When ListForge's AI researches your items, it provides confidence scores that indicate how certain the system is about its findings. Understanding these scores helps you make better decisions about when to trust AI recommendations and when to review manually.

### What Confidence Scores Mean

Confidence scores are expressed as percentages:

**90-100% (High Confidence)**
- AI found strong, consistent evidence
- Multiple data sources agree
- Direct product matches with abundant comparable sales
- *Action:* Quick review and approve

**75-89% (Good Confidence)**
- Solid evidence with minor gaps
- Primary identification likely correct
- Some fields may be inferred
- *Action:* Standard review, verify key details

**50-74% (Moderate Confidence)**
- Partial evidence found
- Identification is plausible but uncertain
- Limited comparable data
- *Action:* Careful manual review required

**Below 50% (Low Confidence)**
- AI is uncertain
- Item may be rare or unusual
- Conflicting or missing data
- *Action:* Manual research essential

### Field-Level Confidence

Beyond overall confidence, you can see confidence for individual fields:

- **Title**: How certain is the AI about the product name?
- **Brand**: Was the brand clearly identified?
- **Model**: Is this the exact model or a guess?
- **Condition**: How well could condition be assessed from photos?
- **Price**: How reliable is the pricing data?

This helps you focus your review on uncertain fields rather than re-checking everything.

### Data Sources

ListForge uses multiple data sources for research:

**Visual Recognition**
- Analyzes product photos using computer vision
- Identifies brands, categories, and product features
- Detects text and logos in images

**Barcode Database**
- UPC/EAN lookups for exact product identification
- Links to manufacturer specifications
- Highest accuracy source when available

**Product Catalogs**
- Cross-references against product databases
- Matches against known product listings
- Provides specifications and details

**Marketplace Data**
- Analyzes sold listings from eBay, Amazon, etc.
- Tracks current active listings for competition
- Provides pricing trends and history

### Viewing Evidence

For each item, you can view the evidence supporting the AI's conclusions:

1. Click on an item in your Review Queue
2. Look for the "Research Evidence" panel
3. See which sources contributed to each finding
4. Review the specific comparable sales used for pricing

### Improving Confidence Scores

You can improve AI accuracy by:

- **Better photos**: Clear, well-lit, multiple angles
- **Barcode scans**: Always scan barcodes when available
- **Brand visibility**: Ensure brand markings are photographed
- **Complete items**: Photograph all components and packaging

### Using Scores for Workflow

Smart sellers use confidence scores to prioritize:

- High confidence items: Batch approve quickly
- Medium confidence: Quick individual review
- Low confidence: Detailed attention required

This tiered approach maximizes efficiency while maintaining quality.
`,
  },
  {
    slug: 'mobile-item-capture',
    title: 'Using the mobile app to capture items with your camera',
    category: 'Mobile App',
    readTime: '2 min',
    keywords: ['mobile', 'camera', 'capture', 'barcode', 'scanning', 'photo'],
    content: `
## Mobile Item Capture

The ListForge mobile app lets you capture items anywhere using your phone's camera. Whether you're at a thrift store, estate sale, or processing inventory at home, mobile capture streamlines your workflow.

### Getting Started

1. Download the ListForge app from the App Store or Google Play
2. Log in with your ListForge account
3. Tap the **+** button to start a new capture

### Capture Modes

**Barcode Scanner**
For items with barcodes:
1. Select "Barcode" mode
2. Point camera at the barcode
3. Hold steady until it scans
4. AI instantly identifies the product

*Tip:* Barcode scans have 98%+ accuracy for exact product identification.

**Photo Capture**
For items without barcodes:
1. Select "Photo" mode
2. Take 2-4 photos from different angles
3. Include brand markings, labels, and any damage
4. Tap "Process" to start AI research

### Best Practices

**Lighting**
- Use natural light when possible
- Avoid harsh shadows or reflections
- Overcast conditions work best outdoors

**Angles**
- Front view (main product shot)
- Back view (labels, markings)
- Detail shots (logos, model numbers)
- Condition photos (any wear or damage)

**Focus**
- Tap the screen to focus on the item
- Ensure text is readable in photos
- Keep the camera steady

### Offline Mode

The app works without internet:
- Photos save locally on your device
- Items queue in "Pending Sync" status
- Automatic upload when you reconnect
- AI research begins after sync

### Batch Capture

For processing multiple items:
1. Enable "Batch Mode" in settings
2. Capture items rapidly without waiting
3. All items queue for processing
4. Review the entire batch later

### Quick Eval

Use Quick Eval for sourcing decisions:
1. Snap a photo of an item on the shelf
2. Get instant identification and price estimate
3. Make informed buy/pass decisions in seconds

### Syncing to Web

All captures automatically sync to your web dashboard:
- View on any device
- Review in the full Review Queue
- Access all AI research results
- Publish to marketplaces
`,
  },
  {
    slug: 'pricing-analysis',
    title: 'How does AI pricing analysis and comp research work?',
    category: 'AI Research',
    readTime: '4 min',
    keywords: ['pricing', 'comps', 'analysis', 'ai', 'market research', 'comparable'],
    content: `
## AI Pricing Analysis

ListForge's AI analyzes market data to suggest optimal pricing for your items. Understanding how this works helps you make better pricing decisions.

### How Pricing Analysis Works

**Step 1: Product Identification**
Before pricing, the AI identifies exactly what you're selling:
- Brand and manufacturer
- Model and variant
- Condition assessment
- Completeness (accessories, packaging)

**Step 2: Comparable Sales Search**
The AI searches for recently sold items matching your product:
- Same brand and model
- Similar condition
- Recent sales (typically last 90 days)
- Multiple marketplaces scanned

**Step 3: Price Analysis**
For each comparable, the system records:
- Final sale price
- Time to sale (how long was it listed?)
- Sale format (auction vs. fixed price)
- Shipping costs (included or separate)

**Step 4: Price Range Generation**
Based on comparables, you receive three price points:
- **Quick Sale**: Lower bound for fast sales
- **Market Price**: Competitive standard pricing
- **Premium**: Upper bound for maximum value

### Understanding Comparables

The AI shows you the actual sales used for pricing:

- **Exact matches**: Same product, same condition
- **Similar matches**: Same category, comparable features
- **Price and date**: What it sold for and when
- **Match quality**: How closely it matches your item

Review these comparables to verify the AI found the right products.

### Price Confidence

The AI indicates how confident it is in pricing:

- **High confidence**: Abundant comparables, clear market
- **Medium confidence**: Reasonable data with some gaps
- **Low confidence**: Limited comparables, manual review suggested

Low confidence often means:
- Rare or unusual item
- New product without sales history
- Regional product with limited data

### Adjusting AI Prices

You can always override AI pricing based on:

- Your market knowledge
- Condition nuances not visible in photos
- Bundle deals or customer relationships
- Cash flow needs requiring faster sales

Document your reasoning—over time you'll learn when your judgment beats the AI.

### Market Trends

The AI detects pricing trends:
- Rising prices (increasing demand)
- Falling prices (declining demand)
- Seasonal patterns (holiday spikes, etc.)

Use this information to time your listings strategically.

### Pricing by Marketplace

Different marketplaces command different prices:
- **Amazon**: Often highest (convenience premium)
- **eBay**: Middle (competitive market)
- **Facebook**: Often lowest (local pickup, negotiation)

ListForge shows marketplace-specific pricing when you cross-list.
`,
  },
  {
    slug: 'cross-posting-listings',
    title: 'Cross-posting listings to multiple marketplaces',
    category: 'Marketplace Integrations',
    readTime: '6 min',
    keywords: ['cross-post', 'multiple', 'marketplace', 'ebay', 'amazon', 'sync'],
    content: `
## Cross-Posting to Multiple Marketplaces

ListForge makes it easy to list items on multiple marketplaces simultaneously. Cross-posting maximizes your exposure and helps items sell faster.

### Supported Marketplaces

ListForge currently supports:
- **eBay**: Full listing and inventory sync
- **Amazon**: Catalog matching and FBA support
- **Facebook Marketplace**: Local and shipped listings

### Setting Up Cross-Posting

**Step 1: Connect Your Accounts**
1. Go to Settings > Marketplace Connections
2. Connect each marketplace you want to use
3. Complete the authorization for each

**Step 2: Configure Defaults**
For each marketplace, set your preferences:
- Default shipping options
- Return policies
- Payment preferences
- Category mappings

**Step 3: Enable Cross-Posting**
1. Go to Settings > Publishing
2. Enable "Multi-Marketplace Publishing"
3. Select your default marketplaces

### Publishing to Multiple Marketplaces

**Option 1: Publish All**
When you're ready to list:
1. Select items in your inventory
2. Click "Publish to Marketplaces"
3. Choose "All Connected Marketplaces"
4. Listings go live on all platforms

**Option 2: Selective Publishing**
For more control:
1. Select items to publish
2. Click "Publish to Marketplaces"
3. Choose specific marketplaces
4. Each platform can have different settings

### Inventory Synchronization

When an item sells on any marketplace:
1. ListForge receives the sale notification
2. Other marketplace listings automatically end
3. Item moves to "Sold" status
4. No manual deactivation needed

This prevents overselling and account issues.

### Marketplace-Specific Optimization

Each marketplace has different requirements:

**eBay**
- Detailed item specifics improve search visibility
- Best Offer can help with stale inventory
- Auction format for rare items

**Amazon**
- Match existing catalog entries when possible
- Strict condition guidelines
- FBA dramatically increases visibility

**Facebook Marketplace**
- Strong photos are essential
- Quick response time matters
- Be prepared for local pickup logistics

### Pricing Across Marketplaces

Consider tiered pricing:
- Amazon: 15-25% premium (convenience buyers)
- eBay: Market baseline
- Facebook: 10-20% discount (local, negotiation)

ListForge lets you set different prices per marketplace.

### Troubleshooting

**Listing Fails on One Marketplace**
- Check marketplace-specific requirements
- Verify category mapping is correct
- Review any error messages in the activity log

**Inventory Not Syncing**
- Confirm marketplace connection is active
- Check for authentication expiration
- Contact support if issues persist

**Duplicate Listings**
- Always publish through ListForge
- Never create listings directly on marketplaces for ListForge-managed items
- Use the "Import Existing Listings" feature if needed
`,
  },
  {
    slug: 'subscription-billing',
    title: 'Managing your subscription and billing settings',
    category: 'Account & Billing',
    readTime: '2 min',
    keywords: ['subscription', 'billing', 'cancel', 'upgrade', 'payment'],
    content: `
## Managing Your Subscription

Access and manage all aspects of your ListForge subscription from your account settings.

### Viewing Your Current Plan

1. Click your profile icon in the top right
2. Select **Settings**
3. Go to **Subscription & Billing**

Here you'll see:
- Your current plan name
- Monthly/annual billing cycle
- Next billing date
- Features included in your plan

### Upgrading Your Plan

To access more features or higher limits:

1. Go to Subscription & Billing
2. Click **Change Plan**
3. Select your desired plan
4. Review the price difference
5. Click **Upgrade Now**

Changes take effect immediately. You'll be charged a prorated amount for the remainder of your billing cycle.

### Downgrading Your Plan

To switch to a lower-tier plan:

1. Go to Subscription & Billing
2. Click **Change Plan**
3. Select the lower plan
4. Review what features you'll lose
5. Click **Downgrade**

Downgrades take effect at the end of your current billing cycle. You'll retain access to premium features until then.

### Updating Payment Method

1. Go to Subscription & Billing
2. Click **Payment Methods**
3. Click **Add New Card** or **Update**
4. Enter your new card details
5. Click **Save**

Your new card will be charged for future payments.

### Viewing Billing History

1. Go to Subscription & Billing
2. Click **Billing History**
3. View all past invoices
4. Click any invoice to download PDF

### Cancelling Your Subscription

To cancel:

1. Go to Subscription & Billing
2. Click **Cancel Subscription**
3. Tell us why you're leaving (optional)
4. Confirm cancellation

After cancellation:
- You'll retain access until your billing cycle ends
- Your data is preserved for 90 days
- You can resubscribe anytime to restore access

### Annual vs. Monthly Billing

Save money by switching to annual billing:
- Annual plans are discounted (typically 2 months free)
- All features identical to monthly
- No commitment beyond the year

To switch:
1. Go to Subscription & Billing
2. Click **Switch to Annual**
3. Review the savings
4. Confirm

### Tax Information

For business accounts:
1. Go to Subscription & Billing
2. Click **Tax Information**
3. Enter your business details and tax ID
4. Tax-exempt invoices will be generated
`,
  },
  {
    slug: 'ai-review-queue',
    title: 'What is the AI review queue and how do I use it?',
    category: 'Getting Started',
    readTime: '4 min',
    keywords: ['review', 'queue', 'ai', 'approve', 'reject', 'workflow'],
    content: `
## The AI Review Queue

The Review Queue is where you verify AI research results before publishing listings. It's your quality control checkpoint—ensuring accuracy while maintaining efficiency.

### Accessing the Review Queue

1. Click **Review Queue** in the left sidebar
2. Or click the queue count in your dashboard header
3. Items awaiting review appear in a list

### Understanding Queue Status

Items in the queue have statuses:

- **Pending Review**: AI research complete, awaiting your approval
- **In Progress**: You've started reviewing but haven't finished
- **Needs Attention**: AI flagged something unusual

### Reviewing an Item

Click any item to open the review panel:

**Information Shown:**
- Item photos (swipeable gallery)
- AI-generated title and description
- Item specifics (brand, model, condition, etc.)
- Suggested price range with confidence score
- Comparable sales used for pricing

**Confidence Indicators:**
- Green: High confidence (90%+)
- Yellow: Medium confidence (70-89%)
- Red: Low confidence (<70%)

### Review Actions

**Approve**
- AI research is correct
- Item is ready for publishing
- Click the green checkmark or press Space

**Edit & Approve**
- Make corrections to any field
- Click the field to edit
- Save and approve when done

**Request Re-Research**
- AI got it wrong, try again
- May help with better photos
- Click "Re-Research" button

**Archive**
- Don't want to list this item
- Removes from queue
- Item saved in archive

### Efficient Review Workflow

**Tier 1: Quick Approve (90%+ confidence)**
- Glance at photo vs. title
- Check price seems reasonable
- Approve with one click
- Time: 5-10 seconds per item

**Tier 2: Standard Review (70-89%)**
- Verify title matches item
- Check key specifics
- Review pricing comparables
- Time: 30-60 seconds per item

**Tier 3: Deep Review (<70%)**
- Carefully examine photos
- Verify or correct identification
- Manual pricing research if needed
- Time: 2-5 minutes per item

### Keyboard Shortcuts

Speed up review with shortcuts:

- **Space**: Approve current item
- **Arrow keys**: Navigate between items
- **E**: Enter edit mode
- **P**: Jump to price field
- **Esc**: Exit edit mode

### Batch Operations

For high-volume review:

1. Filter by confidence level
2. Select multiple high-confidence items
3. Click **Approve Selected**
4. Process them all at once

### Queue Management Tips

- Review daily to prevent backlog
- Prioritize high-value items
- Use filters to work in batches
- Set a daily review target

The Review Queue is where AI efficiency meets human expertise. Master it, and you'll process inventory faster than ever.
`,
  },
  {
    slug: 'quick-eval',
    title: 'Using Quick Eval to instantly assess item value',
    category: 'Mobile App',
    readTime: '3 min',
    keywords: ['quick eval', 'mobile', 'instant', 'value', 'assessment', 'photo'],
    content: `
## Quick Eval: Instant Value Assessment

Quick Eval lets you instantly assess an item's value before you buy it. Perfect for thrift stores, estate sales, and anywhere you need to make fast sourcing decisions.

### What is Quick Eval?

Quick Eval is a lightweight mode in the ListForge mobile app that:
- Instantly identifies products from a photo
- Shows estimated market value
- Helps you decide buy or pass in seconds
- Doesn't add items to your inventory

### How to Use Quick Eval

1. Open the ListForge mobile app
2. Tap the **Quick Eval** button (lightning bolt icon)
3. Point camera at the item
4. Snap a photo
5. Get instant results

### Understanding Results

Quick Eval shows:

**Product Match**
- What the AI thinks the item is
- Match confidence percentage
- Brand and category

**Value Estimate**
- Estimated selling price range
- Based on recent comparable sales
- Low / Average / High prices shown

**Profit Indicator**
- Green: Good margin potential
- Yellow: Moderate margin
- Red: Low margin or loss

### Quick Eval vs. Full Capture

| Feature | Quick Eval | Full Capture |
|---------|------------|--------------|
| Purpose | Sourcing decisions | Inventory management |
| Speed | Instant (~3 seconds) | Full research (30 seconds) |
| Detail | Basic price estimate | Complete listing data |
| Saved? | No | Yes, to your inventory |
| Offline | No | Yes |

### Best Practices

**At Thrift Stores**
- Evaluate items before putting in cart
- Compare store price to selling price
- Make data-driven sourcing decisions

**At Estate Sales**
- Quickly assess unfamiliar items
- Focus your limited time on winners
- Skip items with poor margins

**Photography Tips**
- Include brand markings in frame
- Capture any barcodes visible
- One clear photo is usually enough

### Upgrading to Full Capture

If Quick Eval shows promise:
1. Tap **Add to Inventory**
2. Take additional photos
3. Item enters full research queue
4. Complete listing data generated

### Accuracy Notes

Quick Eval uses the same AI as full research, but with lighter analysis for speed. For the most accurate results:

- Full Capture with multiple photos
- Barcode scans when available
- Complete research workflow

Quick Eval is designed for speed, not perfection—it helps you make fast go/no-go decisions while sourcing.

### Offline Alternative

Quick Eval requires internet. When offline:
1. Use Full Capture instead
2. Photos save locally
3. Research happens when you reconnect
4. Review results later
`,
  },
  {
    slug: 'failed-research-runs',
    title: 'Troubleshooting failed research runs',
    category: 'Troubleshooting',
    readTime: '5 min',
    keywords: ['troubleshooting', 'failed', 'research', 'error', 'retry'],
    content: `
## Troubleshooting Failed Research Runs

Occasionally, AI research may fail to complete. This guide helps you understand why and how to resolve issues.

### Common Failure Reasons

**Photo Quality Issues**
- Blurry or out-of-focus images
- Poor lighting (too dark or too bright)
- Photos don't show the actual item
- Resolution too low

*Solution:* Re-capture with better photos. Ensure clear, well-lit images from multiple angles.

**Unidentifiable Items**
- Very obscure or rare products
- Handmade or one-of-a-kind items
- Items without branding or markings
- Heavily damaged items

*Solution:* These may require manual identification. Check the item for any model numbers, brand marks, or labels you might have missed.

**Network Errors**
- Connection interrupted during research
- Timeout due to slow connection
- Server temporarily unavailable

*Solution:* Simply retry the research. Network issues are usually temporary.

**Rate Limiting**
- Too many research requests too quickly
- Usually affects bulk operations

*Solution:* Wait a few minutes and retry. Consider staggering bulk uploads.

### How to Retry Failed Research

**Single Item**
1. Go to the item in your inventory
2. Click the **Retry Research** button
3. Wait for research to complete

**Bulk Retry**
1. Filter items by "Research Failed" status
2. Select all failed items
3. Click **Retry Selected**
4. Research runs in parallel

### Checking Error Details

For specific error information:
1. Click the failed item
2. Look for "Research Status" section
3. Click "View Error Details"
4. Note the specific error message

Common error codes:
- **E001**: Photo quality insufficient
- **E002**: No product match found
- **E003**: Network timeout
- **E004**: Rate limit exceeded
- **E005**: System error (contact support)

### Improving Research Success

**Better Photos**
- Use natural, diffused lighting
- Capture multiple angles
- Include brand markings and labels
- Photograph barcodes when available
- Avoid busy backgrounds

**More Information**
- Add any known product details manually
- Include model numbers if visible
- Note the brand if you know it

**Optimal Timing**
- Avoid peak usage hours for bulk operations
- Spread large uploads throughout the day
- Use scheduling for batch processing

### When to Contact Support

Contact support if:
- Same item fails repeatedly with good photos
- Error code E005 appears
- Large percentage of items failing
- Unusual error messages

Include:
- Item photos
- Error message/code
- Steps you've already tried

### Preventing Failures

1. **Photo checklist**: Good lighting, multiple angles, visible branding
2. **Stable connection**: Ensure reliable internet before bulk uploads
3. **Reasonable pace**: Don't upload hundreds of items at once
4. **Regular review**: Process items daily to catch issues early

Most research failures are resolved by simply taking better photos. When in doubt, recapture the item with clearer images.
`,
  },
  {
    slug: 'edit-listing-data',
    title: 'How to manually edit AI-generated listing data',
    category: 'Getting Started',
    readTime: '3 min',
    keywords: ['edit', 'listing', 'manual', 'override', 'ai', 'data'],
    content: `
## Editing AI-Generated Listing Data

While ListForge's AI generates complete listings automatically, you can always edit any field to correct errors or add your expertise.

### Where to Edit

You can edit items in two places:

**In the Review Queue**
1. Click any item awaiting review
2. Click any field to edit
3. Make your changes
4. Click **Save & Approve**

**In Your Inventory**
1. Navigate to the item in your inventory
2. Click **Edit** button
3. Modify any fields
4. Click **Save Changes**

### Editable Fields

**Basic Information**
- Title (product name)
- Description (full listing text)
- Condition (new, used, etc.)
- Category (marketplace category)

**Item Specifics**
- Brand
- Model
- Color
- Size
- Material
- Any other attributes

**Pricing**
- Your selling price
- Original/retail price (for comparison)
- Minimum acceptable price (for offers)

**Photos**
- Reorder existing photos
- Add new photos
- Remove photos
- Set primary photo

### Best Practices

**Titles**
- Keep under 80 characters
- Include brand, model, and key features
- Avoid ALL CAPS or excessive punctuation
- Include color/size when relevant

**Descriptions**
- Lead with key selling points
- Mention condition accurately
- Include measurements when applicable
- Note what's included/excluded

**Condition**
- Be honest—over-promise leads to returns
- Document any flaws in description and photos
- When in doubt, grade conservatively

**Pricing**
- Review AI comparables before changing
- Consider your cash flow needs
- Factor in marketplace fees

### Bulk Editing

To edit multiple items at once:
1. Select items in inventory view
2. Click **Bulk Edit**
3. Choose fields to modify
4. Enter new values
5. Click **Apply to Selected**

Available for bulk edit:
- Category
- Condition
- Pricing adjustments (% or fixed)
- Status changes

### Preserving AI Data

When you edit, the original AI-generated data is preserved:
- Click "View Original" to see AI suggestions
- Restore any field to AI value with one click
- Compare your edits to AI recommendations

### Edit History

All changes are tracked:
1. Click the item
2. Select "Edit History"
3. See what changed and when
4. Optionally revert to previous version

This helps you track what you've modified and recover from mistakes.

### Sync Considerations

If already published to marketplaces:
- Edits sync automatically
- Changes reflect within minutes
- Some fields may have marketplace restrictions

Always verify changes propagated correctly to your live listings.
`,
  },
]
