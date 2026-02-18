# SEO Implementation - CoachReflection

## Files Created

### 1. `/app/sitemap.ts`
Dynamic XML sitemap that includes:
- Homepage (/)
- Privacy policy (/privacy)
- Terms of service (/terms)
- Login page (/login)
- Signup page (/signup)

**Note:** Share pages (/share/[id]) are intentionally excluded until proper metadata/social sharing is implemented.

### 2. `/public/robots.txt`
Configured to:
- Allow all search engines
- Block API routes (/api/)
- Block dashboard (/dashboard/)
- Block admin (/admin/)
- Block share pages (/share/) - user-generated content not ready for indexing
- Point to sitemap at https://coachreflection.com/sitemap.xml

### 3. Updated `/app/layout.tsx`

Added comprehensive metadata including:
- Title template for page-specific titles
- Enhanced OpenGraph tags with image dimensions
- Twitter Card metadata
- Robot directives for Google
- PWA metadata (apple-web-app-capable, theme-color)
- Canonical URL support

Added JSON-LD structured data:
- **Organization schema** - Helps Google create Knowledge Panel
- **SoftwareApplication schema** - Rich snippets for search results

Includes:
- Pricing information (Free + Pro tiers)
- Feature list
- Parent organization (360TFT → SVMS Consultancy Limited)
- Social media links
- Contact information

## Deployment Checklist

Before deploying to production:

- [ ] Update domain in sitemap.ts if different from https://coachreflection.com
- [ ] Create `/public/og-image.png` (1200x630px) for social sharing
- [ ] Create `/public/logo.png` for schema.org
- [ ] Add Google Search Console verification code to layout.tsx metadata.verification
- [ ] Submit sitemap to Google Search Console: https://search.google.com/search-console
- [ ] Test robots.txt: https://coachreflection.com/robots.txt
- [ ] Test sitemap: https://coachreflection.com/sitemap.xml
- [ ] Validate structured data: https://search.google.com/test/rich-results

## SEO Best Practices Implemented

Following Ralph PRD 13 patterns:

- Dynamic sitemap generation
- Proper robot directives
- JSON-LD structured data for rich snippets
- OpenGraph tags for social sharing
- Twitter Card metadata
- Mobile PWA support
- Canonical URLs
- Title templates for dynamic pages

## Testing

```bash
# Build to verify no errors
npm run build

# Test sitemap locally (after starting dev server)
curl http://localhost:3000/sitemap.xml

# Test robots.txt
curl http://localhost:3000/robots.txt
```

## Future Enhancements

When implementing share page metadata:
1. Add dynamic OpenGraph images per reflection
2. Update sitemap to include public share URLs
3. Remove /share/ from robots.txt disallow
4. Add proper meta tags to share page component
