/**
 * Blog Post Page
 * Renders a single blog post from markdown using react-markdown.
 * Route: /blog/:slug
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Divider, Chip } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '../utils/blogUtils';
import PublicHeader from '../components/common/PublicHeader';
import NotFound from './NotFound';
import { appleColors } from '../theme/appleDesignSystem';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <NotFound />;
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div data-clarity-unmask="True">
      <Helmet>
        <title>{post.title} | REanalyzr</title>
        <meta name="description" content={post.description} />
        {post.keywords.length > 0 && (
          <meta name="keywords" content={post.keywords.join(', ')} />
        )}
        <link rel="canonical" href={`https://reanalyzr.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://reanalyzr.com/blog/${post.slug}`} />
        {post.featuredImage && <meta property="og:image" content={`https://reanalyzr.com${post.featuredImage}`} />}
        {post.date && <meta property="article:published_time" content={post.date} />}
      </Helmet>

      <PublicHeader />

      <Box sx={{ backgroundColor: '#f5f5f7', minHeight: '100vh', pt: { xs: 5, md: 7 }, pb: 10 }}>
        <Container maxWidth="md">

          {/* Back link */}
          <Button
            onClick={() => navigate('/blog')}
            sx={{
              color: appleColors.primary[500],
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              p: 0,
              mb: 4,
              '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
            }}
          >
            ← All guides
          </Button>

          {/* Article card */}
          <Box
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box sx={{ p: { xs: 3, md: 6 }, pb: { xs: 2, md: 3 } }}>
              {/* Meta */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                {post.date && (
                  <Typography variant="caption" sx={{ color: appleColors.gray[500], fontSize: '0.813rem' }}>
                    {formatDate(post.date)}
                  </Typography>
                )}
                {post.readingTime && (
                  <>
                    <Typography variant="caption" sx={{ color: appleColors.gray[400] }}>·</Typography>
                    <Typography variant="caption" sx={{ color: appleColors.gray[500], fontSize: '0.813rem' }}>
                      {post.readingTime}
                    </Typography>
                  </>
                )}
              </Box>

              {/* Title */}
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontWeight: 700,
                  color: appleColors.gray[900],
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 2,
                }}
              >
                {post.title}
              </Typography>

              {/* Description */}
              {post.description && (
                <Typography
                  sx={{
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    color: appleColors.gray[600],
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  {post.description}
                </Typography>
              )}

              {/* Keywords */}
              {post.keywords.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {post.keywords.slice(0, 4).map((kw) => (
                    <Chip
                      key={kw}
                      label={kw}
                      size="small"
                      sx={{
                        backgroundColor: appleColors.primary[50],
                        color: appleColors.primary[700],
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />

            {/* Featured Image */}
            {post.featuredImage && (
              <Box
                component="img"
                src={post.featuredImage}
                alt={post.title}
                sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 0,
                }}
              />
            )}

            {/* Article body */}
            <Box
              sx={{
                p: { xs: 3, md: 6 },
                '& h2': {
                  fontSize: { xs: '1.375rem', md: '1.625rem' },
                  fontWeight: 700,
                  color: appleColors.gray[900],
                  letterSpacing: '-0.01em',
                  mt: 5,
                  mb: 2,
                  lineHeight: 1.3,
                },
                '& h3': {
                  fontSize: { xs: '1.125rem', md: '1.25rem' },
                  fontWeight: 600,
                  color: appleColors.gray[800],
                  mt: 3.5,
                  mb: 1.5,
                  lineHeight: 1.4,
                },
                '& p': {
                  fontSize: { xs: '0.938rem', md: '1rem' },
                  color: appleColors.gray[700],
                  lineHeight: 1.75,
                  mb: 2,
                },
                '& strong': {
                  color: appleColors.gray[900],
                  fontWeight: 600,
                },
                '& ul, & ol': {
                  pl: 3,
                  mb: 2,
                },
                '& li': {
                  fontSize: { xs: '0.938rem', md: '1rem' },
                  color: appleColors.gray[700],
                  lineHeight: 1.75,
                  mb: 0.5,
                },
                '& blockquote': {
                  borderLeft: `4px solid ${appleColors.primary[500]}`,
                  pl: 3,
                  ml: 0,
                  my: 3,
                  '& p': {
                    color: appleColors.gray[600],
                    fontStyle: 'italic',
                  },
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  my: 3,
                  display: 'block',
                },
                '& em': {
                  color: appleColors.gray[500],
                  fontSize: '0.875rem',
                  display: 'block',
                  mt: -2,
                  mb: 3,
                  textAlign: 'center',
                },
                '& a': {
                  color: appleColors.primary[500],
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
                '& hr': {
                  border: 'none',
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  my: 4,
                },
                '& code': {
                  backgroundColor: appleColors.gray[100],
                  color: appleColors.gray[800],
                  px: 0.75,
                  py: 0.25,
                  borderRadius: '4px',
                  fontSize: '0.875em',
                  fontFamily: 'monospace',
                },
              }}
            >
              <ReactMarkdown
                components={{
                  // Open links in same tab if internal, new tab if external
                  a: ({ href, children, ...props }) => {
                    const isInternal = href?.startsWith('/');
                    return (
                      <a
                        href={href}
                        onClick={isInternal ? (e) => {
                          e.preventDefault();
                          navigate(href!);
                        } : undefined}
                        target={isInternal ? undefined : '_blank'}
                        rel={isInternal ? undefined : 'noopener noreferrer'}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {post.content}
              </ReactMarkdown>
            </Box>

            {/* Inline CTA at bottom of article - universal CTA for rental property calculator */}
            <Box
              sx={{
                mx: { xs: 3, md: 6 },
                mb: { xs: 3, md: 6 },
                p: { xs: 3, md: 4 },
                backgroundColor: appleColors.primary[500],
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '1.125rem', md: '1.25rem' },
                  fontWeight: 600,
                  color: '#ffffff',
                  mb: 1,
                }}
              >
                Ready to analyze your next deal?
              </Typography>
              <Typography
                sx={{ color: 'rgba(255,255,255,0.85)', mb: 2.5, fontSize: '0.938rem' }}
              >
                Use the REanalyzr rental property calculator to evaluate cash flow, cap rate, and investment quality in minutes.
              </Typography>
              <Button
                onClick={() => navigate('/rental-property-calculator')}
                variant="contained"
                sx={{
                  backgroundColor: '#ffffff',
                  color: appleColors.primary[500],
                  fontWeight: 600,
                  fontSize: '0.938rem',
                  textTransform: 'none',
                  borderRadius: '10px',
                  px: 4,
                  py: 1.5,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                }}
              >
                👉 Run your free deal analysis here
              </Button>
            </Box>
          </Box>

          {/* Back link bottom */}
          <Button
            onClick={() => navigate('/blog')}
            sx={{
              color: appleColors.gray[500],
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              p: 0,
              mt: 4,
              '&:hover': { backgroundColor: 'transparent', color: appleColors.primary[500] },
            }}
          >
            ← Back to all guides
          </Button>
        </Container>
      </Box>
    </div>
  );
};

export default BlogPostPage;
