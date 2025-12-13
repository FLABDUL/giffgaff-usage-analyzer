var GGA_CONFIG = {
  // Email search
  SEARCH_QUERY: 'from:giffgaff.com "Check out your monthly usage today"',
  SEARCH_MAX_RESULTS: 500,

  // Spreadsheet & sheet names
  SPREADSHEET_NAME: 'giffgaff Usage History',
  SHEETS: {
    USAGE_DATA: 'Usage Data',
    CHART: 'Usage Chart with Plans',
    RECOMMENDATIONS: 'Recommendations'
  },

  // Date format used to format rows/dates
  DATE_FORMAT: 'yyyy-MM-dd',

  // Overages and pricing info
  OVERAGE_RATE_PER_MB: 0.02, // £0.02 per MB

  // Chart options
  CHART_OPTIONS: {
    WIDTH: 900,
    HEIGHT: 500,
    POSITION_ROW: 2,
    POSITION_COL: 8
  },

  // The plan tiers — update these entries as plans/prices change
  // Use capacityGB = Infinity for unlimited
  PLANS: [
    { name: '2GB', price: 6, capacityGB: 2, color: '#e63946' },
    { name: '5GB', price: 8, capacityGB: 5, color: '#ffb703' },
    { name: '20GB', price: 10, capacityGB: 20, color: '#ffd166' },
    { name: '26GB', price: 12, capacityGB: 26, color: '#06d6a0' },
    { name: '50GB', price: 15, capacityGB: 50, color: '#118ab2' },
    { name: '100GB', price: 20, capacityGB: 100, color: '#5e60ce' },
    { name: '200GB', price: 25, capacityGB: 200, color: '#9b5de5' },
    { name: 'Unlimited', price: 35, capacityGB: Infinity, color: '#6c757d' }
  ]
};
