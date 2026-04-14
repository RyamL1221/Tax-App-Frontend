/**
 * CloudFront base URL for static assets.
 * Reads from NEXT_PUBLIC_CLOUDFRONT_BASE_URL env var, defaults to empty string.
 */
export const CLOUDFRONT_BASE_URL: string =
  process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL ?? '';

/**
 * Asset paths organized by form type.
 */
export const ASSET_PATHS = {
  '1099-DIV': {
    simpleCsvTemplate: '/csv/1099-DIV/simple-template.csv',
    fullCsvTemplate: '/csv/1099-DIV/full-template.csv',
    blankForm: '/irs/1099-DIV.pdf',
  },
} as const;

/**
 * Combines the CloudFront base URL with an asset path.
 * Returns empty string if the path is falsy or the base URL is empty.
 */
export function buildAssetUrl(assetPath: string | undefined | null): string {
  if (!assetPath || !CLOUDFRONT_BASE_URL) {
    return '';
  }
  return `${CLOUDFRONT_BASE_URL}${assetPath}`;
}

/**
 * Pre-built URLs for 1099-DIV assets.
 */
export const FORM_1099_DIV_URLS = {
  simpleCsvTemplate: buildAssetUrl(ASSET_PATHS['1099-DIV'].simpleCsvTemplate),
  fullCsvTemplate: buildAssetUrl(ASSET_PATHS['1099-DIV'].fullCsvTemplate),
  blankForm: buildAssetUrl(ASSET_PATHS['1099-DIV'].blankForm),
};
