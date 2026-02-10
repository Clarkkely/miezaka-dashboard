import React from 'react';
import { Box } from '@mui/material';

const WaveShape = () => {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: { xs: '250px', md: '320px' },
                zIndex: 0,
                overflow: 'hidden',
            }}
        >
            <svg
                viewBox="0 0 1440 320"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', display: 'block' }}
            >
                <path
                    fill="#0099ff"
                    fillOpacity="1"
                    d="M0,160L80,165.3C160,171,320,181,480,181.3C640,181,800,171,960,154.7C1120,139,1280,117,1360,106.7L1440,96L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
                />
            </svg>
        </Box>
    );
};

export default WaveShape;
