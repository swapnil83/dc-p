import React from 'react';
import { Box, CircularProgress } from '@mui/material';

type SpinnerProps = {}

const Spinner: React.FC<SpinnerProps> = () => {
    console.log('Spinner');
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 9999,
            }}
        >
            <CircularProgress sx={{ color: '#ffcc00' }} />
        </Box>
    );
}

export default Spinner;