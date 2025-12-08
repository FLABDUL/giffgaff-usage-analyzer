# giffgaff Usage Analyzer

Automatically extract your giffgaff mobile data usage from Gmail and get intelligent cost-saving recommendations.

## Features

- 📊 Extracts all historical usage data from giffgaff emails
- 📈 Creates beautiful charts showing usage trends over time
- 💡 Provides intelligent plan recommendations based on your actual usage
- 💰 Calculates potential annual savings across different plan strategies
- ⚠️ Identifies months where you exceeded plan limits
- 🎯 Compares costs: overage charges vs upgrading plans

## What You'll Get

The script creates a Google Spreadsheet with:
1. **Usage Data Sheet**: All your monthly usage in a table
2. **Usage Chart with Plans**: Visual graph with 2GB, 5GB, 8GB, 10GB threshold lines
3. **Recommendations Sheet**: Personalized analysis including:
   - Average, min, max usage statistics
   - Best plan recommendation for your usage pattern
   - Annual cost comparison for different strategies
   - Specific months you exceeded limits with costs
   - Actionable tips on whether to pay overage or upgrade

## Setup Instructions

### Step 1: Copy the Script
1. Go to [script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Delete any default code
4. Copy all the code from `Code.gs` in this repository
5. Paste it into the script editor
6. Click the **save icon** (💾) and name it "giffgaff Usage Analyzer"

### Step 2: Authorize the Script
1. Click the **Run** button (▶️) at the top
2. Select **"extractGiffgaffUsage"** from the dropdown if not already selected
3. Click **Run**
4. A permissions dialog will appear - click **"Review permissions"**
5. Choose your Google account
6. Click **"Advanced"** → **"Go to [Untitled project] (unsafe)"**
   - (It's safe - it's your own script, Google just warns about unverified apps)
7. Click **"Allow"** to grant permissions to:
   - Read your Gmail messages
   - Create Google Sheets in your Drive

### Step 3: Run and View Results
1. The script will run and process your emails (takes 10-30 seconds)
2. Check the **Execution log** at the bottom for the spreadsheet URL, or
3. Go to [drive.google.com](https://drive.google.com) and look for "giffgaff Usage History"
4. Open the spreadsheet and check the **"Recommendations"** sheet first!

## How It Works

1. Searches your Gmail for giffgaff usage emails
2. Extracts data usage (GB) and dates from each email
3. Analyzes your usage patterns over the last 12 months
4. Calculates costs for different plan strategies:
   - Always on 2GB plan (with overage charges)
   - 2GB plan + selective upgrades to 5GB
   - Always on 5GB plan
   - Always on 10GB plan
5. Recommends the most cost-effective option
6. Shows you exactly how much you could save

## Privacy & Security

- ✅ All data stays in YOUR Google account
- ✅ No data is sent to external servers
- ✅ No API keys or third-party services needed
- ✅ Code is open source - you can review exactly what it does
- ✅ Only accesses giffgaff usage emails (search: `from:giffgaff.com "Check out your monthly usage today"`)

## Requirements

- A Gmail account with giffgaff usage emails
- Google Apps Script access (free with any Google account)

## Troubleshooting

**"No usage records found"**
- Make sure you have giffgaff emails in your Gmail
- Check that emails are from `giffgaff.com` with subject containing "Check out your monthly usage today"

**"Cannot call SpreadsheetApp.getUi() from this context"**
- This is normal when running from script editor
- The script still works! Check your Google Drive for the spreadsheet
- To avoid this message, run the script from the spreadsheet: Extensions → Apps Script → Run

**Permissions warning**
- Google shows warnings for unverified scripts
- This is your own script, so it's safe to proceed
- The script only accesses your own Gmail and creates spreadsheets in your own Drive

## Re-running the Analysis

To update your analysis with new months:
1. Open your "giffgaff Usage History" spreadsheet
2. Go to **Extensions** → **Apps Script**
3. Click the **Run** button
4. The script will refresh all data and recommendations

## Cost Information

- Script is **100% free** to use
- Uses only Google Apps Script (included free with Google accounts)
- No API costs or subscriptions
- All analysis is rule-based (no AI API calls)

## Contributing

Found a bug or have a suggestion? Please open an issue or submit a pull request!

## License

MIT License - feel free to modify and share!

## Credits

Created to help giffgaff users optimize their mobile plans and save money.

## License

MIT License - feel free to modify and share!

---

**Star this repo ⭐ if you found it useful!**
```
