// JSON-LD Structured Data generators for SEO

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://coachreflection.com'
const SITE_NAME = 'Coach Reflection'
const ORGANIZATION_NAME = '360TFT'
const PARENT_ORGANIZATION = 'SVMS Consultancy Limited'

export interface BreadcrumbItem {
  name?: string
  label?: string
  href: string
}

/**
 * Generate WebSite schema for the homepage
 * Includes SearchAction for potential sitelinks search box
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'Coach Reflection',
    url: SITE_URL,
    description: 'AI-powered reflection and journaling tool for football coaches. Track sessions, identify patterns, and grow as a coach with guided post-session reflections.',
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      url: 'https://360tft.com'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/help?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

/**
 * Generate Organization schema for brand knowledge panel
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'AI-powered reflection and journaling tool for football coaches.',
    foundingDate: '2025',
    founder: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME
    },
    parentOrganization: {
      '@type': 'Organization',
      name: PARENT_ORGANIZATION
    },
    sameAs: [
      'https://twitter.com/360_tft',
      'https://www.skool.com/coachingacademy'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'admin@360tft.com'
    }
  }
}

/**
 * Generate SoftwareApplication schema for app store rich snippets
 */
export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: '2 messages per day, guided prompts, mood tracking, 7 days of history'
      },
      {
        '@type': 'Offer',
        name: 'Pro Monthly',
        price: '7.99',
        priceCurrency: 'USD',
        description: 'Unlimited messages, voice notes, AI insights, session plan upload, full analytics history'
      },
      {
        '@type': 'Offer',
        name: 'Pro Annual',
        price: '76.99',
        priceCurrency: 'USD',
        description: 'Everything in Pro, billed annually (save 20%)'
      }
    ],
    description: 'AI-powered reflection and journaling tool for football coaches. Track sessions, identify patterns, and grow as a coach with guided post-session reflections.',
    screenshot: `${SITE_URL}/og-image.png`,
    featureList: [
      'Guided post-session reflections',
      'AI-powered pattern recognition',
      'Player progress tracking',
      'Session analytics and insights',
      'Coaching development journey',
      'Export and share reflections',
      'Session plan upload with AI analysis'
    ]
  }
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name || item.label,
      item: `${SITE_URL}${item.href}`
    }))
  }
}

/**
 * Generate FAQPage schema for FAQ sections
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Generate HowTo schema for guide pages
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text
    }))
  }
}

/**
 * Generate BlogPosting schema for blog posts
 */
export function generateBlogPostSchema(
  title: string,
  description: string,
  path: string,
  datePublished: string,
  dateModified?: string,
  image?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${SITE_URL}${path}`,
    image: image ? `${SITE_URL}${image}` : `${SITE_URL}/og-image.png`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      url: 'https://360tft.com'
    },
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${path}`
    },
    isPartOf: {
      '@type': 'Blog',
      name: 'Coach Reflection Blog',
      url: `${SITE_URL}/blog`
    }
  }
}

/**
 * Generate Article schema for content pages
 */
export function generateArticleSchema(
  title: string,
  description: string,
  path: string,
  datePublished: string,
  dateModified?: string,
  image?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${SITE_URL}${path}`,
    image: image ? `${SITE_URL}${image}` : `${SITE_URL}/og-image.png`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      url: 'https://360tft.com'
    },
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${path}`
    }
  }
}

/**
 * Generate WebPage schema for generic pages
 */
export function generateWebPageSchema(
  name: string,
  description: string,
  path: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL
    }
  }
}

/**
 * Combined schemas for the homepage
 * Returns an array of schema objects to be rendered as separate script tags
 */
export function getHomepageSchemas() {
  return [
    generateWebsiteSchema(),
    generateOrganizationSchema(),
    generateSoftwareApplicationSchema()
  ]
}
