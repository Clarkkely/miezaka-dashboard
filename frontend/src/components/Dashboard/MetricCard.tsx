import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = '#1a73e8',
}) => {
  return (
    <Card
      sx={{
        background: 'white',
        borderRadius: 2,
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon && <Box sx={{ mr: 1, color }}>{icon}</Box>}
          <Typography variant="body2" color="textSecondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;