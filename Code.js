// test clasp push
function extractGiffgaffUsage() {
  // Search for giffgaff usage emails
  var searchQuery = GGA_CONFIG.SEARCH_QUERY;
  var threads = GmailApp.search(searchQuery, 0, GGA_CONFIG.SEARCH_MAX_RESULTS); // configurable max results
  
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
    spreadsheet = SpreadsheetApp.create(GGA_CONFIG.SPREADSHEET_NAME);
  }
  
  // Use or create the Usage Data sheet
  var sheet = spreadsheet.getSheetByName(GGA_CONFIG.SHEETS.USAGE_DATA);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(GGA_CONFIG.SHEETS.USAGE_DATA);
  } else {
    sheet.clear();
  }

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
    .setOption('vAxis', { title: 'Data Used (GB)', gridlines: {color: '#ccc'} })
    .setOption('series', { 0: {color: '#1a73e8', lineWidth: 2} })
    .setOption('legend', {position: 'bottom'})
    .setOption('width', 600)
    .setOption('height', 400)
    .build();
  
  sheet.insertChart(chart);
  
  // Add reference lines for giffgaff plans using a helper column
  // Get or create the chart sheet
  var chartSheetName = GGA_CONFIG.SHEETS.CHART;
  var chartSheet = spreadsheet.getSheetByName(chartSheetName);
  if (!chartSheet) {
    chartSheet = spreadsheet.insertSheet(chartSheetName);
  } else {
    chartSheet.clear();
  }
  
  // Copy date and usage data
  chartSheet.getRange('A1').setValue('Date');
  chartSheet.getRange('B1').setValue('Used (GB)');

  // Build plan header columns dynamically using config
  var finitePlans = GGA_CONFIG.PLANS.filter(function(p) { return p.capacityGB < Infinity; });
  for (var pIndex = 0; pIndex < finitePlans.length; pIndex++) {
    chartSheet.getRange(1, 3 + pIndex).setValue(finitePlans[pIndex].name + ' Plan');
  }

  for (var i = 0; i < data.length; i++) {
    chartSheet.getRange(i + 2, 1).setValue(Utilities.formatDate(data[i].date, Session.getScriptTimeZone(), GGA_CONFIG.DATE_FORMAT));
    chartSheet.getRange(i + 2, 2).setValue(data[i].usedGB);
    for (var j = 0; j < finitePlans.length; j++) {
      chartSheet.getRange(i + 2, 3 + j).setValue(finitePlans[j].capacityGB);
    }
  }

  // Format headers
  var totalCols = 2 + finitePlans.length;
  var lastColLetter = String.fromCharCode(64 + totalCols); // works if columns < 26 (fine for this use case)
  chartSheet.getRange('A1:' + lastColLetter + '1').setFontWeight('bold');
  chartSheet.autoResizeColumns(1, totalCols);

  // Build the 'series' options dynamically for chart using plan colors
  var seriesOptions = {};
  // 0 => actual series
  seriesOptions[0] = {color: '#1a73e8', lineWidth: 3};
  for (var k = 0; k < finitePlans.length; k++) {
    // Our plan lines are series index 1..n (following the Used(GB) column)
    var seriesIndex = k + 1;
    var planColor = finitePlans[k].color || '#999999';
    seriesOptions[seriesIndex] = { color: planColor, lineWidth: 1, lineDashStyle: [4, 4] };
  }

  // Create chart with plan lines
  var planChartRange = chartSheet.getRange(1, 1, data.length + 1, totalCols);
  var planChart = chartSheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(planChartRange)
    .setPosition(GGA_CONFIG.CHART_OPTIONS.POSITION_ROW, GGA_CONFIG.CHART_OPTIONS.POSITION_COL, 0, 0)
    .setOption('title', 'giffgaff Data Usage with Plan Tiers')
    .setOption('hAxis', {title: 'Date'})
    .setOption('vAxis', { title: 'Data Used (GB)', gridlines: {color: '#e0e0e0'} })
    .setOption('series', seriesOptions)
    .setOption('legend', {position: 'bottom'})
    .setOption('width', GGA_CONFIG.CHART_OPTIONS.WIDTH)
    .setOption('height', GGA_CONFIG.CHART_OPTIONS.HEIGHT)
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
  
  // Return the spreadsheet URL (used by the web UI)
  return spreadsheet.getUrl();
}

function analyzeUsageAndRecommendPlan(data) {
  // Use the plan config and overage rate from the config file:
  var plans = GGA_CONFIG.PLANS;
  var overage_rate = GGA_CONFIG.OVERAGE_RATE_PER_MB; // £0.02 per MB

  // Get last 12 months of data for analysis
  var now = new Date();
  var twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  var recentData = data.filter(function(d) { return d.date >= twelveMonthsAgo; });
  if (recentData.length === 0) {
    recentData = data; // Use all data if less than 12 months available
  }

  // Calculate statistics
  var usages = recentData.map(function(d) { return d.usedGB; });
  var monthsAnalyzed = usages.length || 0;
  var totalUsage = usages.reduce(function(a, b) { return a + b; }, 0);
  var avgUsage = monthsAnalyzed > 0 ? totalUsage / monthsAnalyzed : 0;
  var maxUsage = monthsAnalyzed > 0 ? Math.max.apply(null, usages) : 0;
  var minUsage = monthsAnalyzed > 0 ? Math.min.apply(null, usages) : 0;

  // Count months exceeding each plan threshold
  var exceeds = {};
  plans.forEach(function(p) {
    exceeds[p.name] = usages.filter(function(u) { return u > p.capacityGB; }).length;
  });

  // Calculate annual costs for being always-on each plan (basic annual cost)
  var monthsPerYear = 12;
  var costAlways = {};
  plans.forEach(function(p) {
    costAlways[p.name] = p.price * monthsPerYear;
  });

  // Determine overage months for the smallest plan (2GB) for details
  var plan2 = plans.find(function(p) { return p.name === '2GB'; });
  var cap2GB = plan2 ? plan2.capacityGB : 2;
  var overageMonths2GB = [];
  var cost2GBAlways = costAlways['2GB'] || (cap2GB * monthsPerYear);
  for (var i = 0; i < recentData.length; i++) {
    if (recentData[i].usedGB > cap2GB) {
      var overageGB = recentData[i].usedGB - cap2GB;
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
  costAlways['2GB'] = cost2GBAlways; // update annual cost for 2GB including observed overage

  // Strategy: Smart monthly switching (choose the cheapest option per month)
  var smartMonthlyCostSum = 0;
  for (var m = 0; m < recentData.length; m++) {
    var used = recentData[m].usedGB;
    var bestMonthly = Infinity;
    for (var q = 0; q < plans.length; q++) {
      var p = plans[q];
      var monthlyCost;
      if (used <= p.capacityGB) {
        // covered by plan
        monthlyCost = p.price;
      } else {
        // pay overage on this plan (for non-infinite capacity)
        var overageGB2 = (p.capacityGB === Infinity) ? 0 : (used - p.capacityGB);
        var overageCost2 = overageGB2 * 1024 * overage_rate;
        monthlyCost = p.price + overageCost2;
      }
      if (monthlyCost < bestMonthly) {
        bestMonthly = monthlyCost;
      }
    }
    smartMonthlyCostSum += bestMonthly;
  }

  // Annualize smartMonthly cost based on months analyzed
  var smartMonthlyAnnualCost = monthsAnalyzed > 0 ? (smartMonthlyCostSum * (monthsPerYear / monthsAnalyzed)) : 0;

  // Determine best always-on plan (lowest annual cost)
  var bestAlwaysPlan = null;
  var bestAlwaysCost = Infinity;
  for (var key in costAlways) {
    if (costAlways[key] < bestAlwaysCost) {
      bestAlwaysCost = costAlways[key];
      bestAlwaysPlan = key;
    }
  }

  // Determine recommended strategy (smart monthly vs best always-on)
  var recommendedStrategy;
  var recommendedPlan;
  var annualSavings;
  if (smartMonthlyAnnualCost < bestAlwaysCost) {
    recommendedStrategy = 'Smart monthly selection (choose cheapest plan or pay overage each month)';
    recommendedPlan = 'Smart monthly';
    annualSavings = bestAlwaysCost - smartMonthlyAnnualCost;
  } else {
    recommendedStrategy = 'Always-on plan';
    recommendedPlan = bestAlwaysPlan;
    annualSavings = smartMonthlyAnnualCost - bestAlwaysCost; // positive => smart is more expensive
  }

  // Build readable plan costs
  var planCosts = {};
  plans.forEach(function(p) {
    planCosts[p.name] = costAlways[p.name] || p.price * monthsPerYear;
  });

  return {
    monthsAnalyzed: monthsAnalyzed,
    avgUsage: avgUsage,
    minUsage: minUsage,
    maxUsage: maxUsage,
    exceeds: exceeds, // counts per plan name
    costAlways: planCosts,
    smartMonthlyAnnualCost: smartMonthlyAnnualCost,
    bestAlwaysPlan: bestAlwaysPlan,
    bestAlwaysCost: bestAlwaysCost,
    recommendedStrategy: recommendedStrategy,
    recommendedPlan: recommendedPlan,
    annualSavings: annualSavings,
    overageMonths2GB: overageMonths2GB,
    plans: plans
  };
}

function createRecommendationsSheet(spreadsheet, analysis) {
  // Create or clear recommendations sheet using config name
  var recSheet = spreadsheet.getSheetByName(GGA_CONFIG.SHEETS.RECOMMENDATIONS);
  if (recSheet) {
    recSheet.clear();
  } else {
    recSheet = spreadsheet.insertSheet(GGA_CONFIG.SHEETS.RECOMMENDATIONS);
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

  // Show months exceeding each plan threshold (finite plans)
  var finitePlanNames = analysis.plans.filter(function(p) { return p.capacityGB < Infinity; }).map(function(p) { return p.name; });
  for (var pi = 0; pi < finitePlanNames.length; pi++) {
    var planName = finitePlanNames[pi];
    recSheet.getRange(row, 1).setValue('Months exceeding ' + planName + ':');
    recSheet.getRange(row, 2).setValue((analysis.exceeds[planName] || 0) + ' times');
    row++;
  }
  row += 1;

  // Recommendation
  recSheet.getRange(row, 1).setValue('💡 RECOMMENDATION');
  recSheet.getRange(row, 1).setFontWeight('bold').setBackground('#d4edda');
  row++;
  recSheet.getRange(row, 1, 1, 4).merge();
  var recMessage = 'Recommended strategy: ' + analysis.recommendedStrategy + ' — ' + analysis.recommendedPlan;
  recSheet.getRange(row, 1).setValue(recMessage).setWrap(true);
  recSheet.getRange(row, 1).setFontSize(12);
  row += 2;

  if (analysis.annualSavings > 0) {
    recSheet.getRange(row, 1).setValue('Potential annual savings:');
    recSheet.getRange(row, 1).setFontWeight('bold');
    recSheet.getRange(row, 2).setValue('£' + analysis.annualSavings.toFixed(2));
    recSheet.getRange(row, 2).setFontWeight('bold').setFontColor('#00aa00');
  }
  row += 2;

  // Cost Comparison Table - list every plan and their annual costs
  recSheet.getRange(row, 1).setValue('💰 ANNUAL COST COMPARISON (Always-on plans)');
  recSheet.getRange(row, 1).setFontWeight('bold').setBackground('#fff3cd');
  row++;
  recSheet.getRange(row, 1).setValue('Plan');
  recSheet.getRange(row, 2).setValue('Annual Cost');
  recSheet.getRange(row, 3).setValue('vs Best Always Plan (' + analysis.bestAlwaysPlan + ')');
  recSheet.getRange(row, 1, 1, 3).setFontWeight('bold').setBackground('#f0f0f0');
  row++;

  // Write the rows for each plan
  var planKeys = Object.keys(analysis.costAlways);
  for (var k = 0; k < planKeys.length; k++) {
    var pName = planKeys[k];
    var cost = analysis.costAlways[pName];
    recSheet.getRange(row, 1).setValue(pName);
    recSheet.getRange(row, 2).setValue('£' + cost.toFixed(2));
    recSheet.getRange(row, 3).setValue('£' + (cost - analysis.bestAlwaysCost).toFixed(2));
    row++;
  }

  // Add smart monthly strategy row
  row++;
  recSheet.getRange(row, 1).setValue('Smart monthly selection (ideal month-by-month)');
  recSheet.getRange(row, 2).setValue('£' + analysis.smartMonthlyAnnualCost.toFixed(2));
  recSheet.getRange(row, 3).setValue('£' + (analysis.smartMonthlyAnnualCost - analysis.bestAlwaysCost).toFixed(2));
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
      recSheet.getRange(row, 1).setValue(Utilities.formatDate(month.date, Session.getScriptTimeZone(), GGA_CONFIG.DATE_FORMAT));
      recSheet.getRange(row, 2).setValue(month.usage.toFixed(2));
      recSheet.getRange(row, 3).setValue(month.overage.toFixed(2));
      recSheet.getRange(row, 4).setValue('£' + month.cost.toFixed(2));
      row++;
    }

    row++;
    recSheet.getRange(row, 1).setValue('💡 TIP: For these months you exceeded the 2GB plan. Consider upgrading to a higher plan those months or use Smart monthly switching as needed.');
    recSheet.getRange(row, 1).setFontWeight('bold');
  }

  // Format columns
  recSheet.setColumnWidth(1, 300);
  recSheet.setColumnWidth(2, 150);
  recSheet.setColumnWidth(3, 200);
  recSheet.setColumnWidth(4, 150);

  // Move Recommendations sheet to front
  spreadsheet.setActiveSheet(recSheet);
  spreadsheet.moveActiveSheet(1);
}
