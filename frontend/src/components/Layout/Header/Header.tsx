import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import animations from '../../../styles/animations';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <AppBar position="fixed" sx={{ zIndex: 1200, top: 0, left: 0, right: 0, background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.2)' }}>
      <Toolbar sx={{ py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {/* Logo Gauche */}
        <Box
          component="img"
          src="/logoM.jpeg"
          alt="MIEZAKA Logo"
          sx={{
            height: { xs: 48, md: 60 },
            width: { xs: 48, md: 60 },
            mr: 3,
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            animation: `${animations.fadeInLeft} 700ms ease both`,
          }}
        />

        {/* Titre Centré */}
        <Box sx={{ flex: 1, textAlign: 'center', animation: `${animations.fadeInUp} 800ms ease both` }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: 1.5,
              fontSize: { xs: '1.3rem', md: '1.6rem' },
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              mb: 0.5,
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SOCIETE MIEZAKA
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              letterSpacing: 0.8,
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              fontStyle: 'italic',
            }}
          >
            LOT 111 MA/3608 SAHALAVA-FIANARANTSOA 301
          </Typography>
        </Box>

        {/* Logo Droit */}
        <Box
          component="img"
          src="/logoM.jpeg"
          alt="MIEZAKA Logo"
          sx={{
            height: { xs: 48, md: 60 },
            width: { xs: 48, md: 60 },
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            animation: `${animations.fadeInRight} 700ms ease both`,
          }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
