// Country flag mapping for market names to ISO country codes
export const countryFlags: Record<string, string> = {
  'US': 'US',
  'UK': 'GB',
  'Germany': 'DE',
  'France': 'FR', 
  'Japan': 'JP',
  'Canada': 'CA',
  'Australia': 'AU',
  'Brazil': 'BR',
  'China': 'CN',
  'India': 'IN',
  'Mexico': 'MX',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Sweden': 'SE',
  'Russia': 'RU',
  'South Korea': 'KR',
  'Norway': 'NO',
  'Switzerland': 'CH',
  'Belgium': 'BE',
  'Poland': 'PL',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Austria': 'AT',
  'Ireland': 'IE',
  'Portugal': 'PT',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Greece': 'GR',
  'Turkey': 'TR',
  'Israel': 'IL',
  'UAE': 'AE',
  'Saudi Arabia': 'SA',
  'South Africa': 'ZA',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Thailand': 'TH',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Vietnam': 'VN',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'New Zealand': 'NZ'
};

export function getCountryCode(marketName: string): string {
  return countryFlags[marketName] || 'UN';
}

export function getCountryName(marketName: string): string {
  // Map some common abbreviations to full names
  const nameMapping: Record<string, string> = {
    'US': 'United States',
    'UK': 'United Kingdom',
    'UAE': 'United Arab Emirates'
  };
  
  return nameMapping[marketName] || marketName;
}
