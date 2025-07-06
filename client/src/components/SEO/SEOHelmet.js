import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEOHelmet = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  children,
  product = null,
  breadcrumbs = [],
  author = 'Mumalieff',
  publishedTime = null,
  modifiedTime = null
}) => {
  const location = useLocation();
  const currentUrl = `https://mumalieff.com${location.pathname}`;
  
  const defaultTitle = 'Mumalieff | Premium T-shirts & Custom Prints Nigeria';
  const defaultDescription = 'Shop premium quality t-shirts and create custom designs at Mumalieff. Express your faith with our meaningful collections. Fast delivery across Nigeria.';
  const defaultImage = 'https://mumalieff.com/images/og-image.jpg';
  const defaultKeywords = 't-shirts Nigeria, custom t-shirts, premium clothing, faith-based apparel, custom prints, Nigerian fashion, online clothing store';

  const pageTitle = title || defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageImage = image || defaultImage;
  const pageKeywords = keywords || defaultKeywords;

  const generateStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type === 'product' ? 'Product' : 'WebPage',
      "name": pageTitle,
      "description": pageDescription,
      "url": currentUrl,
      "image": pageImage
    };

    if (product && type === 'product') {
      return {
        ...baseData,
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.images?.map(img => img.url) || [pageImage],
        "brand": {
          "@type": "Brand",
          "name": "Mumalieff"
        },
        "offers": {
          "@type": "Offer",
          "price": product.isSale ? product.salePrice : product.price,
          "priceCurrency": "NGN",
          "availability": product.countInStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": "Mumalieff"
          }
        },
        "aggregateRating": product.numReviews > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": product.rating,
          "reviewCount": product.numReviews,
          "bestRating": 5,
          "worstRating": 1
        } : undefined,
        "sku": product._id,
        "category": product.category
      };
    }

    if (breadcrumbs.length > 0) {
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": `https://mumalieff.com${crumb.url}`
        }))
      };
      
      return [baseData, breadcrumbData];
    }

    return baseData;
  };

  const structuredData = generateStructuredData();

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={currentUrl} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Mumalieff" />
      <meta property="og:locale" content="en_NG" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:site" content="@mumalieff" />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {Array.isArray(structuredData) ? 
        structuredData.map((data, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(data)}
          </script>
        )) : 
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      }

      {children}
    </Helmet>
  );
};

export const ProductSEO = ({ product }) => {
  if (!product) return null;

  const title = `${product.name} | Premium T-shirt | Mumalieff`;
  const description = `${product.description} Premium quality t-shirt available at Mumalieff. Price: ₦${product.isSale ? product.salePrice : product.price}. Fast delivery across Nigeria.`;
  const keywords = `${product.name}, ${product.category}, t-shirt Nigeria, premium clothing, ${product.tags?.join(', ') || ''}`;
  
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category, url: `/products/category/${product.category}` },
    { name: product.name, url: `/product/${product._id}` }
  ];

  return (
    <SEOHelmet
      title={title}
      description={description}
      keywords={keywords}
      image={product.images?.[0]?.url}
      type="product"
      product={product}
      breadcrumbs={breadcrumbs}
    />
  );
};

export const CategorySEO = ({ category, products = [] }) => {
  const title = `${category} T-shirts | Premium Collection | Mumalieff`;
  const description = `Shop our ${category} collection of premium t-shirts. ${products.length} unique designs available. Express your style with Mumalieff's quality clothing.`;
  const keywords = `${category}, t-shirts Nigeria, premium clothing, custom prints, Nigerian fashion`;
  
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: category, url: `/products/category/${category}` }
  ];

  return (
    <SEOHelmet
      title={title}
      description={description}
      keywords={keywords}
      breadcrumbs={breadcrumbs}
    />
  );
};

export const SearchSEO = ({ query, resultCount }) => {
  const title = `Search Results for "${query}" | Mumalieff`;
  const description = `Found ${resultCount} t-shirts matching "${query}". Shop premium quality clothing at Mumalieff with fast delivery across Nigeria.`;
  const keywords = `${query}, search results, t-shirts Nigeria, premium clothing`;

  return (
    <SEOHelmet
      title={title}
      description={description}
      keywords={keywords}
    />
  );
};

export const ArticleSEO = ({ article }) => {
  if (!article) return null;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: article.title, url: `/blog/${article.slug}` }
  ];

  return (
    <SEOHelmet
      title={`${article.title} | Mumalieff Blog`}
      description={article.excerpt}
      keywords={article.tags?.join(', ')}
      image={article.featuredImage}
      type="article"
      breadcrumbs={breadcrumbs}
      publishedTime={article.publishedAt}
      modifiedTime={article.updatedAt}
    />
  );
};

export const OrganizationSchema = () => {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Mumalieff",
    "description": "Premium T-shirts and Custom Prints in Nigeria",
    "url": "https://mumalieff.com",
    "logo": "https://mumalieff.com/images/logo/logo192.png",
    "image": "https://mumalieff.com/images/og-image.jpg",
    "telephone": "+234- 809 388 0315",
    "email": "support@mumalieff.com",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "NG",
      "addressRegion": "Lagos"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "6.5244",
      "longitude": "3.3792"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "paymentAccepted": "Credit Card, Debit Card, Bank Transfer",
    "currenciesAccepted": "NGN",
    "priceRange": "₦₦",
    "sameAs": [
      "https://facebook.com/mumalieff",
      "https://instagram.com/mumalieff",
      "https://twitter.com/mumalieff"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
    </Helmet>
  );
};

export const WebsiteSchema = () => {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Mumalieff",
    "url": "https://mumalieff.com",
    "description": "Premium T-shirts and Custom Prints - Express your faith and create unique designs",
    "publisher": {
      "@type": "Organization",
      "name": "Mumalieff"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mumalieff.com/products/search/{search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(websiteData)}
      </script>
    </Helmet>
  );
};

export const generateSitemap = (pages) => {
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>https://mumalieff.com${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || '0.5'}</priority>
  </url>`).join('')}
</urlset>`;

  return sitemapXml;
};

export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: https://mumalieff.com/sitemap.xml

Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /checkout/
Disallow: /profile/`;
};

export default SEOHelmet;