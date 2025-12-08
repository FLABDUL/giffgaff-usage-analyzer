function extractGiffgaffUsage() {
  // Search for giffgaff usage emails
  var searchQuery = 'from:giffgaff.com "Check out your monthly usage today"';
  var threads = GmailApp.search(searchQuery, 0, 500); // Get up to 500 emails
  
  var data = [];
  
  // Process each thread
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      var subject = message.getSubject();
      var body = message.getPlainBody();
      var date = message.getDate();
      
      // Extract GB usage from email body
      // Looking for patterns like "2.20GB of 20GB" or "X.XXGB of"
      var gbPattern = /(\d+\.?\d*)\s*GB\s+of\s+(\d+\.?\d*)\s*GB/i;
      var match = body.match(gbPattern);
      
      if (match) {
        var usedGB = parseFloat(match[1]);
        var totalGB = parseFloat(match[2]);
        
        data.push({
          date: date,
          usedGB: usedGB,
          totalGB: totalGB,
          subject: subject
        });
      }
    }
  }
  
  // Sort by date (oldest first)
  data.sort(function(a, b) {
    return a.date - b.date;
  });
  
  // Create or get spreadsheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('giffgaff Usage History');
  }
  
  var sheet = spreadsheet.getActiveSheet();
  sheet.clear();
  sheet.setName('Usage Data');
  
  // Set headers
  sheet.appendRow(['Date', 'Used (GB)', 'Total (GB)', 'Usage %', 'Email Subject']);
  
  // Add data
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var usagePercent = (row.usedGB / row.totalGB * 100).toFixed(1);
    sheet.appendRow([
      Utilities.formatDate(row.date, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      row.usedGB,
      row.totalGB,
      usagePercent,
      row.subject
    ]);
  }
  
  // Format the sheet
  sheet.setFrozenRows(1);
  sheet.getRange('A1:E1').setFontWeight('bold');
  sheet.autoResizeColumns(1, 5);
  
  // Create a chart with plan threshold lines
  var chartRange = sheet.getRange(1, 1, data.length + 1, 2);
  var chart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(chartRange)
    .setPosition(2, 7, 0, 0) // Position chart to the right of data
    .setOption('title', 'giffgaff Data Usage Over Time')
    .setOption('hAxis', {title: 'Date'})
    .setOption('vAxis', {
      title: 'Data Used (GB)',
      gridlines: {color: '#ccc'},
    })
    .setOption('series', {
      0: {color: '#1a73e8', lineWidth: 2}
    })
    .setOption('legend', {position: 'bottom'})
    .setOption('width', 600)
    .setOption('height', 400)
    .build();
  
  sheet.insertChart(chart);
  
  // Add reference lines for giffgaff plans using a helper column
  // Create a new sheet for the enhanced chart with plan lines
  var chartSheet = spreadsheet.insertSheet('Usage Chart with Plans');
  
  // Copy date and usage data
  chartSheet.getRange('A1').setValue('Date');
  chartSheet.getRange('B1').setValue('Used (GB)');
  chartSheet.getRange('C1').setValue('2GB Plan');
  chartSheet.getRange('D1').setValue('5GB Plan');
  chartSheet.getRange('E1').setValue('8GB Plan');
  chartSheet.getRange('F1').setValue('10GB Plan');
  
  for (var i = 0; i < data.length; i++) {
    chartSheet.getRange(i + 2, 1).setValue(Utilities.formatDate(data[i].date, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
    chartSheet.getRange(i + 2, 2).setValue(data[i].usedGB);
    chartSheet.getRange(i + 2, 3).setValue(2);
    chartSheet.getRange(i + 2, 4).setValue(5);
    chartSheet.getRange(i + 2, 5).setValue(8);
    chartSheet.getRange(i + 2, 6).setValue(10);
  }
  
  // Format headers
  chartSheet.getRange('A1:F1').setFontWeight('bold');
  chartSheet.autoResizeColumns(1, 6);
  
  // Create chart with plan lines
  var planChartRange = chartSheet.getRange(1, 1, data.length + 1, 6);
  var planChart = chartSheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(planChartRange)
    .setPosition(2, 8, 0, 0)
    .setOption('title', 'giffgaff Data Usage with Plan Tiers')
    .setOption('hAxis', {title: 'Date'})
    .setOption('vAxis', {
      title: 'Data Used (GB)',
      gridlines: {color: '#e0e0e0'},
    })
    .setOption('series', {
      0: {color: '#1a73e8', lineWidth: 3}, // Actual usage - blue, thicker
      1: {color: '#ff0000', lineWidth: 1, lineDashStyle: [4, 4]}, // 2GB - red dashed
      2: {color: '#ff0000', lineWidth: 1, lineDashStyle: [4, 4]}, // 5GB - red dashed
      3: {color: '#ff0000', lineWidth: 1, lineDashStyle: [4, 4]}, // 8GB - red dashed
      4: {color: '#ff0000', lineWidth: 1, lineDashStyle: [4, 4]}  // 10GB - red dashed
    })
    .setOption('legend', {position: 'bottom'})
    .setOption('width', 800)
    .setOption('height', 500)
    .build();
  
  chartSheet.insertChart(planChart);
  
  // RULE-BASED ANALYSIS - Generate recommendations
  var analysis = analyzeUsageAndRecommendPlan(data);
  createRecommendationsSheet(spreadsheet, analysis);
  
  Logger.log('Extracted ' + data.length + ' usage records');
  Logger.log('Spreadsheet URL: ' + spreadsheet.getUrl());
  
  // Try to show alert only if UI is available (when run from spreadsheet)
  try {
    var ui = SpreadsheetApp.getUi();
    ui.alert('Success!', 
      'Extracted ' + data.length + ' usage records. Check the "Recommendations" sheet for cost analysis and plan suggestions!', 
      ui.ButtonSet.OK);
  } catch (e) {
    // Running from script editor - just log without error
    Logger.log('✓ Done! Open the spreadsheet to view results: ' + spreadsheet.getUrl());
  }
  
  // Return the URL so it shows in execution log
  return 'Successfully extracted ' + data.length + ' records. Spreadsheet: ' + spreadsheet.getUrl();
}

function analyzeUsageAndRecommendPlan(data) {
  // giffgaff plan prices (as of 2025)
  var plans = {
    '2GB': 6,
    '5GB': 8,
    '10GB': 10,
    '20GB': 12,
    'Unlimited': 15
  };
  
  var overage_rate = 0.02; // £0.02 per MB
  
  // Get last 12 months of data for analysis
  var now = new Date();
  var twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  var recentData = data.filter(function(d) { return d.date >= twelveMonthsAgo; });
  
  if (recentData.length === 0) {
    recentData = data; // Use all data if less than 12 months
  }
  
  // Calculate statistics
  var usages = recentData.map(function(d) { return d.usedGB; });
  var totalUsage = usages.reduce(function(a, b) { return a + b; }, 0);
  var avgUsage = totalUsage / usages.length;
  var maxUsage = Math.max.apply(null, usages);
  var minUsage = Math.min.apply(null, usages);
  
  // Count months exceeding each threshold
  var exceeds2GB = usages.filter(function(u) { return u > 2; }).length;
  var exceeds5GB = usages.filter(function(u) { return u > 5; }).length;
  var exceeds8GB = usages.filter(function(u) { return u > 8; }).length;
  var exceeds10GB = usages.filter(function(u) { return u > 10; }).length;
  
  // Calculate annual costs for different strategies
  var monthsAnalyzed = recentData.length;
  var monthsPerYear = 12;
  
  // Scenario 1: Always on 2GB plan
  var cost2GBAlways = plans['2GB'] * monthsPerYear;
  var overageMonths2GB = [];
  for (var i = 0; i < recentData.length; i++) {
    if (recentData[i].usedGB > 2) {
      var overageGB = recentData[i].usedGB - 2;
      var overageCost = overageGB * 1024 * overage_rate; // Convert GB to MB
      overageMonths2GB.push({
        date: recentData[i].date,
        usage: recentData[i].usedGB,
        overage: overageGB,
        cost: overageCost
      });
      cost2GBAlways += overageCost;
    }
  }
  
  // Scenario 2: 2GB plan + upgrade to 5GB when needed
  var cost2GBWith5GBUpgrades = (monthsPerYear - exceeds2GB) * plans['2GB'] + exceeds2GB * plans['5GB'];
  
  // Scenario 3: Always on 5GB plan
  var cost5GBAlways = plans['5GB'] * monthsPerYear;
  
  // Scenario 4: Always on 10GB plan
  var cost10GBAlways = plans['10GB'] * monthsPerYear;
  
  // Determine best plan recommendation
  var recommendation;
  var recommendedPlan;
  var annualSavings;
  var comparedTo = '5GB';
  
  if (maxUsage <= 2) {
    recommendedPlan = '2GB';
    recommendation = 'Your usage never exceeds 2GB. The 2GB plan is perfect for you.';
    annualSavings = cost5GBAlways - cost2GBAlways;
  } else if (exceeds2GB <= 2 && maxUsage <= 5) {
    recommendedPlan = '2GB with selective upgrades';
    var bestCost = Math.min(cost2GBAlways, cost2GBWith5GBUpgrades);
    recommendation = 'You exceed 2GB only ' + exceeds2GB + ' time(s) per year. Stay on 2GB plan and ';
    if (cost2GBAlways < cost2GBWith5GBUpgrades) {
      recommendation += 'pay the small overage charges (cheaper than upgrading).';
    } else {
      recommendation += 'upgrade to 5GB for those specific months.';
    }
    annualSavings = cost5GBAlways - bestCost;
  } else if (avgUsage < 5 && exceeds5GB <= 2) {
    recommendedPlan = '5GB';
    recommendation = 'Your average usage is ' + avgUsage.toFixed(2) + 'GB. The 5GB plan provides good headroom.';
    annualSavings = cost10GBAlways - cost5GBAlways;
    comparedTo = '10GB';
  } else if (avgUsage < 10) {
    recommendedPlan = '10GB';
    recommendation = 'Your usage frequently exceeds 5GB. The 10GB plan is recommended for peace of mind.';
    annualSavings = plans['Unlimited'] * monthsPerYear - cost10GBAlways;
    comparedTo = 'Unlimited';
  } else {
    recommendedPlan = 'Unlimited';
    recommendation = 'Your usage is high. Consider the Unlimited plan for worry-free usage.';
    annualSavings = 0;
    comparedTo = 'lower tier';
  }
  
  return {
    monthsAnalyzed: monthsAnalyzed,
    avgUsage: avgUsage,
    minUsage: minUsage,
    maxUsage: maxUsage,
    exceeds2GB: exceeds2GB,
    exceeds5GB: exceeds5GB,
    exceeds8GB: exceeds8GB,
    exceeds10GB: exceeds10GB,
    cost2GBAlways: cost2GBAlways,
    cost2GBWith5GBUpgrades: cost2GBWith5GBUpgrades,
    cost5GBAlways: cost5GBAlways,
    cost10GBAlways: cost10GBAlways,
    overageMonths2GB: overageMonths2GB,
    recommendedPlan: recommendedPlan,
    recommendation: recommendation,
    annualSavings: annualSavings,
    comparedTo: comparedTo,
    plans: plans
  };
}

function createRecommendationsSheet(spreadsheet, analysis) {
  // Create or clear recommendations sheet
  var recSheet = spreadsheet.getSheetByName('Recommendations');
  if (recSheet) {
    recSheet.clear();
  } else {
    recSheet = spreadsheet.insertSheet('Recommendations');
  }
  
  var row = 1;
  
  // Title
  recSheet.getRange(row, 1).setValue('giffgaff Plan Recommendation & Cost Analysis');
  recSheet.getRange(row, 1).setFontSize(16).setFontWeight('bold');
  row += 2;
  
  // Usage Summary
  recSheet.getRange(row, 1).setValue('📊 USAGE SUMMARY (Last ' + analysis.monthsAnalyzed + ' months)');
  recSheet.getRange(row, 1).setFontWeight('bold').setBackground('#e8f0fe');
  row++;
  recSheet.getRange(row, 1).setValue('Average monthly usage:');
  recSheet.getRange(row, 2).setValue(analysis.avgUsage.toFixed(2) + ' GB');
  row++;
  recSheet.getRange(row, 1).setValue('Minimum usage:');
  recSheet.getRange(row, 2).setValue(analysis.minUsage.toFixed(2) + ' GB');
  row++;
  recSheet.getRange(row, 1).setValue('Maximum usage:');
  recSheet.getRange(row, 2).setValue(analysis.maxUsage.toFixed(2) + ' GB');
  row++;
  recSheet.getRange(row, 1).setValue('Months exceeding 2GB:');
  recSheet.getRange(row, 2).setValue(analysis.exceeds2GB + ' times');
  row++;
  recSheet.getRange(row, 1).setValue('Months exceeding 5GB:');
  recSheet.getRange(row, 2).setValue(analysis.exceeds5GB + ' times');
  row += 2;
  
  // Recommendation
  recSheet.getRange(row, 1).setValue('💡 RECOMMENDATION');
  recSheet.getRange(row, 1).setFontWeight('bold').setBackground('#d4edda');
  row++;
  recSheet.getRange(row, 1, 1, 4).merge();
  recSheet.getRange(row, 1).setValue(analysis.recommendation).setWrap(true);
  recSheet.getRange(row, 1).setFontSize(12);
  row += 2;
  
  recSheet.getRange(row, 1).setValue('Recommended Plan:');
  recSheet.getRange(row, 1).setFontWeight('bold');
  recSheet.getRange(row, 2).setValue(analysis.recommendedPlan);
  recSheet.getRange(row, 2).setFontWeight('bold').setFontColor('#0066cc');
  row++;
  
  if (analysis.annualSavings > 0) {
    recSheet.getRange(row, 1).setValue('Potential annual savings:');
    recSheet.getRange(row, 1).setFontWeight('bold');
    recSheet.getRange(row, 2).setValue('£' + analysis.annualSavings.toFixed(2) + ' vs ' + analysis.comparedTo + ' plan');
    recSheet.getRange(row, 2).setFontWeight('bold').setFontColor('#00aa00');
  }
  row += 2;
  
  // Cost Comparison Table
  recSheet.getRange(row, 1).setValue('💰 ANNUAL COST COMPARISON');
  recSheet.getRange(row, 1).setFontWeight('bold').setBackground('#fff3cd');
  row++;
  
  recSheet.getRange(row, 1).setValue('Strategy');
  recSheet.getRange(row, 2).setValue('Annual Cost');
  recSheet.getRange(row, 3).setValue('vs 5GB Plan');
  recSheet.getRange(row, 1, 1, 3).setFontWeight('bold').setBackground('#f0f0f0');
  row++;
  
  recSheet.getRange(row, 1).setValue('Always on 2GB plan (with overage charges)');
  recSheet.getRange(row, 2).setValue('£' + analysis.cost2GBAlways.toFixed(2));
  recSheet.getRange(row, 3).setValue('Save £' + (analysis.cost5GBAlways - analysis.cost2GBAlways).toFixed(2));
  row++;
  
  recSheet.getRange(row, 1).setValue('2GB plan + upgrade to 5GB when needed');
  recSheet.getRange(row, 2).setValue('£' + analysis.cost2GBWith5GBUpgrades.toFixed(2));
  recSheet.getRange(row, 3).setValue('Save £' + (analysis.cost5GBAlways - analysis.cost2GBWith5GBUpgrades).toFixed(2));
  row++;
  
  recSheet.getRange(row, 1).setValue('Always on 5GB plan');
  recSheet.getRange(row, 2).setValue('£' + analysis.cost5GBAlways.toFixed(2));
  recSheet.getRange(row, 3).setValue('-');
  recSheet.getRange(row, 1, 1, 3).setBackground('#ffffcc');
  row++;
  
  recSheet.getRange(row, 1).setValue('Always on 10GB plan');
  recSheet.getRange(row, 2).setValue('£' + analysis.cost10GBAlways.toFixed(2));
  recSheet.getRange(row, 3).setValue('Cost £' + (analysis.cost10GBAlways - analysis.cost5GBAlways).toFixed(2) + ' more');
  row += 2;
  
  // Overage details if applicable
  if (analysis.overageMonths2GB.length > 0) {
    recSheet.getRange(row, 1).setValue('⚠️ MONTHS YOU EXCEEDED 2GB');
    recSheet.getRange(row, 1).setFontWeight('bold').setBackground('#f8d7da');
    row++;
    
    recSheet.getRange(row, 1).setValue('Date');
    recSheet.getRange(row, 2).setValue('Usage (GB)');
    recSheet.getRange(row, 3).setValue('Overage (GB)');
    recSheet.getRange(row, 4).setValue('Overage Cost');
    recSheet.getRange(row, 1, 1, 4).setFontWeight('bold').setBackground('#f0f0f0');
    row++;
    
    for (var i = 0; i < analysis.overageMonths2GB.length; i++) {
      var month = analysis.overageMonths2GB[i];
      recSheet.getRange(row, 1).setValue(Utilities.formatDate(month.date, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
      recSheet.getRange(row, 2).setValue(month.usage.toFixed(2));
      recSheet.getRange(row, 3).setValue(month.overage.toFixed(2));
      recSheet.getRange(row, 4).setValue('£' + month.cost.toFixed(2));
      row++;
    }
    
    row++;
    recSheet.getRange(row, 1).setValue('💡 TIP: For these months, you could either:');
    recSheet.getRange(row, 1).setFontWeight('bold');
    row++;
    recSheet.getRange(row, 1, 1, 4).merge();
    recSheet.getRange(row, 1).setValue('• Pay the small overage charges (total: £' + 
      analysis.overageMonths2GB.reduce(function(sum, m) { return sum + m.cost; }, 0).toFixed(2) + '), OR');
    row++;
    recSheet.getRange(row, 1, 1, 4).merge();
    recSheet.getRange(row, 1).setValue('• Upgrade to 5GB for those months (would cost £' + 
      (analysis.plans['5GB'] * analysis.overageMonths2GB.length).toFixed(2) + ' extra)');
  }
  
  // Format columns
  recSheet.setColumnWidth(1, 300);
  recSheet.setColumnWidth(2, 150);
  recSheet.setColumnWidth(3, 150);
  recSheet.setColumnWidth(4, 150);
  
  // Move Recommendations sheet to front
  spreadsheet.setActiveSheet(recSheet);
  spreadsheet.moveActiveSheet(1);
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('giffgaff Usage')
      .addItem('Extract Usage Data', 'extractGiffgaffUsage')
      .addToUi();
}
