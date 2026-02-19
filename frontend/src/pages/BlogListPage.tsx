/**
 * Blog List Page
 * Public page listing all blog posts.
 * Route: /blog
 */

import React from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAllPosts } from '../utils/blogUtils';
import PublicHeader from '../components/common/PublicHeader';
import { appleColors } from '../theme/appleDesignSystem';

const BlogListPage: React.FC = () => {
  const navigate = useNavigate();
  const posts = getAllPosts();

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
    <>
      <Helmet>
        <title>Real Estate Investing Blog | REanalyzr</title>
        <meta
          name="description"
          content="In-depth guides on BRRRR strategy, rental property analysis, cap rates, cash flow, and real estate investing math. Free institutional-grade analysis education."
        />
      </Helmet>

      <PublicHeader />

      <Box sx={{ backgroundColor: '#f5f5f7', minHeight: '100vh', pt: { xs: 6, md: 8 }, pb: 10 }}>
        <Container maxWidth="md">
          {/* Page Header */}
          <Box sx={{ mb: { xs: 5, md: 7 }, textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 700,
                color: appleColors.gray[900],
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              Real Estate Investing Guides
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                color: appleColors.gray[600],
                maxWidth: '540px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              The math behind BRRRR, rental property cash flow, cap rates, and more —
              explained with real numbers, not theory.
            </Typography>
          </Box>

          {/* Post List */}
          {posts.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: appleColors.gray[500] }}>
              No posts yet. Check back soon.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {posts.map((post) => (
                <Card
                  key={post.slug}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  sx={{
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    },
                    backgroundColor: '#ffffff',
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    {/* Meta row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                      {post.date && (
                        <Typography
                          variant="caption"
                          sx={{ color: appleColors.gray[500], fontSize: '0.813rem' }}
                        >
                          {formatDate(post.date)}
                        </Typography>
                      )}
                      {post.readingTime && (
                        <>
                          <Typography variant="caption" sx={{ color: appleColors.gray[400] }}>·</Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: appleColors.gray[500], fontSize: '0.813rem' }}
                          >
                            {post.readingTime}
                          </Typography>
                        </>
                      )}
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                        fontWeight: 600,
                        color: appleColors.gray[900],
                        letterSpacing: '-0.01em',
                        mb: 1.5,
                        lineHeight: 1.3,
                      }}
                    >
                      {post.title}
                    </Typography>

                    {/* Description */}
                    {post.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: appleColors.gray[600],
                          fontSize: '0.938rem',
                          lineHeight: 1.6,
                          mb: 2.5,
                        }}
                      >
                        {post.description}
                      </Typography>
                    )}

                    {/* Keywords */}
                    {post.keywords && post.keywords.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                        {post.keywords.slice(0, 3).map((kw) => (
                          <Chip
                            key={kw}
                            label={kw}
                            size="small"
                            sx={{
                              backgroundColor: appleColors.primary[50],
                              color: appleColors.primary[700],
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              border: 'none',
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {/* Read More */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/blog/${post.slug}`);
                      }}
                      sx={{
                        color: appleColors.primary[500],
                        fontSize: '0.938rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        p: 0,
                        '&:hover': {
                          backgroundColor: 'transparent',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Read guide →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Bottom CTA */}
          <Box
            sx={{
              mt: 8,
              p: { xs: 3, md: 4 },
              backgroundColor: appleColors.primary[500],
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: 1.5,
              }}
            >
              Ready to run the numbers on your deal?
            </Typography>
            <Typography
              sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, fontSize: '0.938rem' }}
            >
              Free BRRRR calculator — 28 metrics, no login required.
            </Typography>
            <Button
              onClick={() => navigate('/brrrr-calculator')}
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
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              Try the BRRRR Calculator
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default BlogListPage;
