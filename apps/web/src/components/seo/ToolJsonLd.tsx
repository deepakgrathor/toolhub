import type { ToolSeoData } from '@/data/tool-seo'

interface Props {
  seoData: ToolSeoData
}

export function ToolJsonLd({ seoData }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `https://setulix.com/tools/${seoData.slug}#app`,
        name: seoData.h1,
        description: seoData.metaDescription,
        url: `https://setulix.com/tools/${seoData.slug}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          description: 'Free to start with welcome credits on signup',
        },
        provider: {
          '@type': 'Organization',
          name: 'SetuLabsAI',
          url: 'https://setulix.com',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: seoData.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://setulix.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tools',
            item: 'https://setulix.com/tools',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: seoData.kitName,
            item: `https://setulix.com/kits/${seoData.kitSlug}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: seoData.h1,
            item: `https://setulix.com/tools/${seoData.slug}`,
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: `How to use ${seoData.h1}`,
        description: seoData.metaDescription,
        step: seoData.howItWorks.map((s) => ({
          '@type': 'HowToStep',
          position: s.step,
          name: s.title,
          text: s.description,
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
