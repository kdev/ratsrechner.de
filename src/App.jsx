// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  Box,
  Container,
  Grid,
  Paper,
  ThemeProvider,
  createTheme
} from '@mui/material';
import Sidebar from './components/Sidebar';
import DataPreview from './components/DataPreview';
import SeatDistributionChart from './components/SeatDistributionChart';


import '@fontsource-variable/ibm-plex-sans';

const theme = createTheme({
  typography: {
    fontFamily: [
      'IBM Plex Sans Variable',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  palette: {
    background: {
      default: '#f5f7fa', // Leichter Hintergrund (hellgrau mit leichtem Blaustich)
    },
    // Optional: Anpassen der Paper-Komponente für besseren Kontrast
    paper: {
      default: '#ffffff', // Weißer Hintergrund für Paper-Komponenten
      elevation: 2, // Leichte Schatten für bessere Abhebung
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)', // Subtiler Schatten
        },
      },
    },
  },
});


function App() {
  const [elections, setElections] = useState({});
  const [selectedElection, setSelectedElection] = useState('');
  const [corporations, setCorporations] = useState({});
  const [selectedCorporation, setSelectedCorporation] = useState('');
  const [corporationData, setCorporationData] = useState(null);
  const [dataPreview, setDataPreview] = useState('');
  const [districtVotes, setDistrictVotes] = useState({});
  const [districtWinners, setDistrictWinners] = useState({});
  const [independentCandidates, setIndependentCandidates] = useState({});

  // Lade alle Wahlen aus /data/elections.json
  useEffect(() => {
    fetch('/data/elections.json')
      .then(response => response.json())
      .then(data => setElections(data))
      .catch(error => console.error('Fehler beim Laden der Wahlen:', error));
  }, []);

  // Lade Körperschaften, wenn eine Wahl ausgewählt wurde
  useEffect(() => {
    if (selectedElection) {
      const electionInfo = elections[selectedElection];
      if (electionInfo && electionInfo['data-source']) {
        fetch(electionInfo['data-source'])
          .then(response => response.json())
          .then(data => setCorporations(data))
          .catch(error => console.error('Fehler beim Laden der Körperschaften:', error));
      }
    }
  }, [selectedElection, elections]);

  // Lade die Daten der ausgewählten Körperschaft
  const handleCorporationChange = (corpKey) => {
    setSelectedCorporation(corpKey);
    setCorporationData(null);
    setDataPreview('');
    setDistrictVotes({});

    if (corporations[corpKey] && corporations[corpKey]['data-source']) {
      fetch(corporations[corpKey]['data-source'])
        .then(response => {
          if (!response.ok) {
            throw new Error('Datei nicht gefunden');
          }
          return response.json();
        })
        .then(json => {
          setCorporationData(json);
          // Extrahiere die ersten 5 Zeilen als Vorschau
          const preview = JSON.stringify(json, null, 2)
            .split('\n')
            .slice(0, 5)
            .join('\n');
          setDataPreview(preview);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Körperschaftsdaten:', error);
          setDataPreview("Es stehen noch keine Daten zur Verfügung");
        });
    }
  };

  // Handler für Änderungen an den Wahlkreis-Stimmen
  const handleDistrictVotesChange = (newDistrictVotes) => {
    setDistrictVotes(newDistrictVotes);
  };

  // Handler für Änderungen an den Wahlkreissiegern
  const handleDistrictWinnersChange = (winners) => {
    setDistrictWinners(winners);
  };


  const handleIndependentCandidatesChange = (newIndependentCandidates) => {
    setIndependentCandidates(newIndependentCandidates);
  };
  return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="false" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Sidebar */}
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Sidebar
                            elections={elections}
                            selectedElection={selectedElection}
                            setSelectedElection={(value) => {
                                setSelectedElection(value);
                                setSelectedCorporation('');
                                setCorporationData(null);
                                setDataPreview('');
                            }}
                            corporations={corporations}
                            selectedCorporation={selectedCorporation}
                            onCorporationChange={handleCorporationChange}
                            corporationData={corporationData}
                            districtVotes={districtVotes}
                            districtWinners={districtWinners}
                            independentCandidates={independentCandidates}
                        />
                    </Paper>
                </Grid>
                {/* Data Preview */}
                <Grid item xs={12} md={9}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <DataPreview
                            dataPreview={dataPreview}
                            corporationData={corporationData}
                            onDistrictVotesChange={handleDistrictVotesChange}
                            onDistrictWinnersChange={handleDistrictWinnersChange}
                            onIndependentCandidatesChange={handleIndependentCandidatesChange}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    </ThemeProvider>
);
}

export default App;
