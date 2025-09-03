import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ogImageFor } from '../utils/og';

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://autodevelop.ai';
const DEFAULT_TITLE = 'AutoDevelop.ai — AI tools for faster development';
const DEFAULT_DESCRIPTION = 'AutoDevelop.ai helps you build and ship software faster using AI assistants, templates and integrations.';

export function composeTitle(title) {
  if (!title) return DEFAULT_TITLE;
  return `${title} · AutoDevelop.ai`;
}

export default function SEO({ title, description, url, image, jsonLd, pathname }) {
  const finalTitle = composeTitle(title);
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const canonical = url || (SITE_URL + (pathname || '/'));
  const ogImage = image || ogImageFor(pathname || '/');

  const organization = jsonLd || {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AutoDevelop.ai',
    url: SITE_URL,
    logo: `${SITE_URL.replace(/\/$/, '')}/logo.png`
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AutoDevelop.ai',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL.replace(/\/$/, '')}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: finalTitle.replace(/\s*·\s*AutoDevelop.ai$/, ''),
        item: canonical
      }
    ]
  };

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />

  <script type="application/ld+json">{JSON.stringify(organization)}</script>
  <script type="application/ld+json">{JSON.stringify(websiteLd)}</script>
  <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </Helmet>
  );
}
