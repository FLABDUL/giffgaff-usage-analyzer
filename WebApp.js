// WebApp.js — Web app entrypoints

function doGet() {
  // Serve the HTML UI
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('giffgaff Usage Analyzer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Called by the client UI to run the analysis.
 * It calls `extractGiffgaffUsage()` (which returns the spreadsheet URL).
 */
function analyzeGiffgaffUsage() {
  try {
    var spreadsheetUrl = extractGiffgaffUsage();
    return {
      success: true,
      message: 'Analysis complete! Check your Google Drive for "' + GGA_CONFIG.SPREADSHEET_NAME + '"',
      spreadsheetUrl: spreadsheetUrl
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}
