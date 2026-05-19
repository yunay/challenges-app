export const BRAND = {
  phoenixRed: '#FA4C03',
  sunsetOrange: '#FA9D06',
  crestYellow: '#FDDE31',
  emberDeep: '#5B0807',
  warmCream: '#FAFAF7',
  linen: '#FFF6E5',
  mutedClay: '#8B7E76',
} as const;

export type BrandColor = keyof typeof BRAND;
