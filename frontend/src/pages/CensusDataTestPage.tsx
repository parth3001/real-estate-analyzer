import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';
import CensusDataDisplay from '../components/CensusDataDisplay';

/**
 * Sample locations with real ZIP codes for testing
 */
const sampleLocations = [
  {
    name: 'Mountain View, CA',
    zip: '94043',
    state: 'CA',
    county: '085',
    address: '1600 Amphitheatre Parkway, Mountain View, CA 94043'
  },
  {
    name: 'Manhattan, NY',
    zip: '10001',
    state: 'NY',
    county: '061',
    address: '350 5th Ave, New York, NY 10001'
  },
  {
    name: 'Austin, TX',
    zip: '78701',
    state: 'TX',
    county: '453',
    address: '1100 Congress Ave, Austin, TX 78701'
  },
  {
    name: 'Miami, FL',
    zip: '33131',
    state: 'FL',
    county: '086',
    address: '601 Biscayne Blvd, Miami, FL 33131'
  },
  {
    name: 'Seattle, WA',
    zip: '98101',
    state: 'WA',
    county: '033',
    address: '400 Broad St, Seattle, WA 98101'
  }
];

/**
 * Test page for Census Data integration
 */
const CensusDataTestPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState(sampleLocations[0]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Census Data Integration Test
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" paragraph>
            This page demonstrates the Census Data integration. Select a location from the examples below or enter a custom ZIP code in the form to fetch and display Census data.
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Sample Locations
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {sampleLocations.map((location) => (
              <Grid item xs={12} sm={6} md={4} key={location.zip}>
                <Card 
                  variant={selectedLocation.zip === location.zip ? "outlined" : "elevation"} 
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: selectedLocation.zip === location.zip ? 'primary.light' : 'background.paper',
                    color: selectedLocation.zip === location.zip ? 'primary.contrastText' : 'text.primary',
                  }}
                  onClick={() => setSelectedLocation(location)}
                >
                  <CardHeader title={location.name} />
                  <CardContent>
                    <Typography variant="body2">ZIP: {location.zip}</Typography>
                    <Typography variant="body2">State: {location.state}</Typography>
                    <Typography variant="body2">County: {location.county}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        
        <CensusDataDisplay 
          zip={selectedLocation.zip}
          state={selectedLocation.state}
          county={selectedLocation.county}
          propertyAddress={selectedLocation.address}
        />
      </Box>
    </Container>
  );
};

export default CensusDataTestPage;
