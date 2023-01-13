import * as React from 'react';
import Grid from '@mui/material/Grid';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export default function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Grid
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      item
      xs
      {...other}
    >
      {value === index && (
          children
      )}
    </Grid>
  );
}