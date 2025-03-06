import React, { memo } from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

type PageTitleProps = {
    title: string;
    backgroundColor?: string;
};


const PageTitle: React.FC<PageTitleProps> = ({ title, backgroundColor }) => {
    console.log('PageTitle');
    return (
        <AppBar position="static" sx={{ backgroundColor: backgroundColor || '#1976d2' }}>
            <Toolbar>
                <Typography
                    variant="h6"
                    component="div"
                    align="center"
                    sx={{
                        flexGrow: 1,
                        color: 'black',
                        fontWeight: 'bold',
                    }}
                >
                    {title}
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default memo(PageTitle);