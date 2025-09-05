// src/components/DataPreview.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Button,
    Stack,
    Tooltip,
    InputAdornment,
    Alert,
    IconButton,
    Chip,
    Checkbox
} from '@mui/material';
import { Gauge } from '@mui/x-charts/Gauge';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BalanceIcon from '@mui/icons-material/Balance';
import InfoIcon from '@mui/icons-material/Info';

import { debounce } from 'lodash';

// Memoized TableRow-Komponente für bessere Performance
const DistrictTableRow = React.memo(({
    district,
    parties,
    districtVotes,
    districtTotals,
    handleVoteChange,
    winningParty,
    winningCandidate,
    corporationData,
    independentCandidates,
    handleIndependentChange,
    liveResultsData,
    isLiveResultsActive
}) => {
    const total = districtTotals[district.number] || 0;
    const isOverLimit = total > 100.5;
    const isIndependent = independentCandidates[district.number] || false;
    const winningPartyData = !isIndependent && winningParty ?
        corporationData.parties.find(p => p.identifier === winningParty) : null;

    // Live-Ergebnisse Daten für diesen Wahlkreis
    const districtLiveData = liveResultsData?.find(row => 
        parseInt(row['gebiet-nr']) === district.number
    );
    const anzahlSchnellmeldungen = districtLiveData ? parseInt(districtLiveData['anz-schnellmeldungen'] || '0') : 0;
    const maxSchnellmeldungen = districtLiveData ? parseInt(districtLiveData['max-schnellmeldungen'] || '0') : 0;

    // Debug: Zeige aktuelle Tabelle-Werte für diesen Wahlkreis
    if (isLiveResultsActive && district.number <= 3) { // Nur für die ersten 3 Wahlkreise
        console.log(`Wahlkreis ${district.number} - Aktuelle Tabelle-Werte:`, districtVotes[district.number]);
    }

    return (
        <TableRow
            sx={{
                bgcolor: isOverLimit ? 'error.light' : (district.number % 2 === 0 ? 'grey.50' : 'white'),
                '&:hover': { bgcolor: 'action.hover' }
            }}
        >
            {/* Live-Ergebnisse Gauge-Spalte - ERSTE SPALTE */}
            {isLiveResultsActive && (
                <TableCell align="center" sx={{ width: 80 }}>
                    {maxSchnellmeldungen > 0 ? (
                        <Gauge
                            width={50}
                            height={50}
                            value={anzahlSchnellmeldungen}
                            valueMax={maxSchnellmeldungen}

                            text={({ value, valueMax }) => `${value} / ${valueMax}`}
                            sx={{
                                '& .MuiGauge-valueText': {
                                    fontSize: '0.45rem',
                                    fontWeight: 'normal',
                                    letterSpacing: '-0.1em'
                                }
                            }}
                        />
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Keine Daten
                        </Typography>
                    )}
                </TableCell>
            )}

            <TableCell
                sx={{
                    position: 'relative',
                    bgcolor: winningPartyData ? `${winningPartyData.colorcode}20` : 'inherit'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {isOverLimit && (
                        <Tooltip title="Summe überschreitet 100%" enterTouchDelay={0}>
                            <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                        </Tooltip>
                    )}
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {district.number}. {district.name}
                    </Typography>
                    {!isIndependent && winningCandidate && (
                        <Tooltip title={`${winningCandidate} (${winningPartyData?.short || ''})`} enterTouchDelay={0} arrow placement="right">
                            <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                                <PersonIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </TableCell>

            {/* Rest der Zeile bleibt gleich */}
            {parties.map(party => {
                const isWinner = party.identifier === winningParty && !isIndependent;

                return (
                    <TableCell
                        key={party.identifier}
                        align="center"
                        sx={{
                            bgcolor: isWinner ? `${party.colorcode}20` : 'inherit'
                        }}
                    >
                        <TextField
                            type="number"
                            size="small"
                            disabled={isLiveResultsActive}
                            inputProps={{
                                min: 0,
                                max: 100,
                                step: 0.1,
                                style: {
                                    textAlign: 'right',
                                    padding: '2px 4px',
                                    fontWeight: isWinner ? 'bold' : 'normal',
                                    MozAppearance: 'textfield',
                                }
                            }}
                            sx={{
                                width: 75,
                                '& .MuiInputBase-root': {
                                    height: 28
                                },
                                '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0,
                                },
                                '& input[type=number]': {
                                    MozAppearance: 'textfield',
                                }
                            }}
                            value={districtVotes[district.number]?.[party.identifier] || ''}
                            onChange={(e) => handleVoteChange(district.number, party.identifier, e.target.value)}
                            InputProps={{
                                endAdornment: <InputAdornment position="end" sx={{ mr: -0.5 }}>%</InputAdornment>,
                            }}
                            variant="outlined"
                        />
                    </TableCell>
                );
            })}

            {/* Neue Zelle für Einzelbewerber-Checkbox */}
            <TableCell align="center">
                <Checkbox
                    checked={isIndependent}
                    onChange={(e) => handleIndependentChange(district.number, e.target.checked)}
                    size="small"
                />
            </TableCell>

            <TableCell
                align="center"
                sx={{
                    fontWeight: 'bold',
                    color: isOverLimit ? 'error.main' : 'inherit'
                }}
            >
                {total.toFixed(1)}%
                {isOverLimit && (
                    <Tooltip title="Summe überschreitet 100%" enterTouchDelay={0}>
                        <WarningIcon color="error" fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                    </Tooltip>
                )}
            </TableCell>
        </TableRow>
    );
});


// Hauptkomponente
function DataPreview({ dataPreview, corporationData, onDistrictVotesChange, onDistrictWinnersChange, onIndependentCandidatesChange, liveResultsData, isLiveResultsActive }) {
    const [districtVotes, setDistrictVotes] = useState({});
    const [districtTotals, setDistrictTotals] = useState({});
    const [independentCandidates, setIndependentCandidates] = useState({});
    const originalDistrictVotesRef = useRef({}); // Backup der ursprünglichen Poll-Daten
    const prevCorporationDataRef = useRef(null);
    const initializedRef = useRef(false);
    const isProcessingLiveResultsRef = useRef(false); // Verhindert Endlosschleife

    const handleIndependentChange = useCallback((districtNumber, checked) => {
        const newIndependentCandidates = {
            ...independentCandidates,
            [districtNumber]: checked
        };
        setIndependentCandidates(newIndependentCandidates);
    }, [independentCandidates]);

    // Funktion um Live-Ergebnisse in Prozentwerte umzuwandeln
    const convertLiveResultsToPercentages = useCallback((liveData, partyMapping) => {
        if (!liveData || !partyMapping) {
            console.log('No live data or party mapping available');
            return { liveDistrictVotes: {}, liveDistrictTotals: {} };
        }

        console.log('=== CSV DATA ANALYSIS ===');
        console.log('Raw CSV data length:', liveData.length);
        console.log('First 3 rows of CSV data:', liveData.slice(0, 3));
        console.log('Party mapping:', partyMapping);

        const liveDistrictVotes = {};
        const liveDistrictTotals = {};

        liveData.forEach((row, index) => {
            console.log(`--- Processing CSV row ${index} ---`);
            console.log('Raw row data:', row);
            
            const districtNumber = parseInt(row['gebiet-nr']);
            const gueltigeStimmen = parseInt(row['D'] || '0');
            const gebietName = row['gebiet-name'] || 'Unknown';
            
            console.log(`District: ${districtNumber} (${gebietName})`);
            console.log(`Gültige Stimmen: ${gueltigeStimmen}`);
            
            if (districtNumber && gueltigeStimmen > 0) {
                liveDistrictVotes[districtNumber] = {};
                let totalPercentage = 0;

                console.log('Processing parties for this district:');
                
                // Für jede Partei im Mapping
                Object.entries(partyMapping).forEach(([csvColumn, partyId]) => {
                    const stimmen = parseInt(row[csvColumn] || '0');
                    const percentage = gueltigeStimmen > 0 ? (stimmen / gueltigeStimmen) * 100 : 0;
                    
                    liveDistrictVotes[districtNumber][partyId] = percentage.toFixed(2);
                    totalPercentage += percentage;
                    
                    console.log(`  ${partyId} (${csvColumn}): ${stimmen} Stimmen = ${percentage.toFixed(1)}%`);
                });

                liveDistrictTotals[districtNumber] = totalPercentage;
                console.log(`Total percentage for district ${districtNumber}: ${totalPercentage.toFixed(1)}%`);
            } else {
                console.log(`Skipping district ${districtNumber} - no valid data`);
            }
        });

        console.log('=== FINAL CONVERSION RESULT ===');
        console.log('Live district votes object:', liveDistrictVotes);
        console.log('Live district totals object:', liveDistrictTotals);
        
        // Detaillierte Ausgabe der Ergebnisse
        console.log('=== DETAILED LIVE RESULTS ===');
        Object.keys(liveDistrictVotes).forEach(districtNumber => {
            console.log(`Wahlkreis ${districtNumber}:`);
            Object.entries(liveDistrictVotes[districtNumber]).forEach(([partyId, percentage]) => {
                console.log(`  ${partyId}: ${percentage}%`);
            });
            console.log(`  Gesamt: ${liveDistrictTotals[districtNumber].toFixed(1)}%`);
            console.log('---');
        });
        console.log('=== END DETAILED RESULTS ===');
        
        return { liveDistrictVotes, liveDistrictTotals };
    }, []);

    // Debounced Funktion für Stimmänderungen
    const debouncedHandleVoteChange = useCallback(
        debounce((districtNumber, partyId, value, currentDistrictVotes, currentDistrictTotals) => {
            const newValue = value === '' ? '0' : value;

            // Aktualisiere die Stimmen für diese Partei in diesem Wahlkreis
            const newDistrictVotes = {
                ...currentDistrictVotes,
                [districtNumber]: {
                    ...currentDistrictVotes[districtNumber],
                    [partyId]: newValue
                }
            };

            // Berechne die neue Gesamtsumme für diesen Wahlkreis
            const newTotal = Object.values(newDistrictVotes[districtNumber]).reduce(
                (sum, vote) => sum + parseFloat(vote || 0), 0
            );

            const newDistrictTotals = {
                ...currentDistrictTotals,
                [districtNumber]: newTotal
            };

            // Batch-Update für beide States
            setDistrictVotes(newDistrictVotes);
            setDistrictTotals(newDistrictTotals);

            // Benachrichtige die übergeordnete Komponente über die Änderung
            if (onDistrictVotesChange) {
                onDistrictVotesChange(newDistrictVotes);
            }
        }, 100),
        [onDistrictVotesChange]
    );

    // Cleanup für debounced Funktion
    useEffect(() => {
        return () => {
            debouncedHandleVoteChange.cancel();
        };
    }, [debouncedHandleVoteChange]);

    // Handler für Stimmänderungen
    const handleVoteChange = useCallback((districtNumber, partyId, value) => {
        debouncedHandleVoteChange(districtNumber, partyId, value, districtVotes, districtTotals);
    }, [debouncedHandleVoteChange, districtVotes, districtTotals]);

    // Memoized Funktion zur Ermittlung der Gewinnerpartei
    const getWinningParty = useCallback((districtNumber) => {
        // Wenn der Wahlkreis von einem Einzelbewerber gewonnen wurde, gibt es keinen Partei-Gewinner
        if (independentCandidates[districtNumber]) return null;

        if (!districtVotes[districtNumber]) return null;

        let maxVotes = 0;
        let winner = null;

        Object.keys(districtVotes[districtNumber]).forEach(partyId => {
            const votes = parseFloat(districtVotes[districtNumber][partyId] || 0);
            if (votes > maxVotes) {
                maxVotes = votes;
                winner = partyId;
            }
        });

        return winner;
    }, [districtVotes, independentCandidates]);


    // Memoized Funktion zur Ermittlung des Kandidaten
    const getWinningCandidate = useCallback((districtNumber, winningPartyId) => {
        if (!winningPartyId || !corporationData || !corporationData.parties) return null;

        // Finde die Gewinnerpartei
        const winningParty = corporationData.parties.find(party => party.identifier === winningPartyId);
        if (!winningParty) return null;

        // Prüfe, ob die Partei Wahlkreiskandidaten hat
        if (!winningParty['districts-candidates']) return null;

        // Finde den Kandidaten für diesen Wahlkreis
        const candidate = winningParty['districts-candidates'].find(
            candidate => candidate['district-number'] === parseInt(districtNumber, 10)
        );

        return candidate ? candidate['candidate-name'] : null;
    }, [corporationData]);

    // Memoized Berechnung der Wahlkreissieger
    const districtWinners = useMemo(() => {
        if (!corporationData || !corporationData.districts || Object.keys(districtVotes).length === 0) {
            return {};
        }

        const winners = {};

        corporationData.districts.forEach(district => {
            const districtNumber = district.number.toString();
            // Nur wenn kein Einzelbewerber den Wahlkreis gewonnen hat
            if (!independentCandidates[districtNumber]) {
                const winner = getWinningParty(districtNumber);
                if (winner) {
                    winners[districtNumber] = winner;
                }
            }
        });

        return winners;
    }, [corporationData, districtVotes, getWinningParty, independentCandidates]);


    // Memoized Berechnung der Wahlkreiskandidaten
    const districtCandidates = useMemo(() => {
        if (!corporationData || !corporationData.districts || Object.keys(districtWinners).length === 0) {
            return {};
        }

        const candidates = {};

        Object.entries(districtWinners).forEach(([districtNumber, partyId]) => {
            candidates[districtNumber] = getWinningCandidate(districtNumber, partyId);
        });

        return candidates;
    }, [corporationData, districtWinners, getWinningCandidate]);

    // Benachrichtige die übergeordnete Komponente über Änderungen an den Wahlkreissiegern
    useEffect(() => {
        if (onDistrictWinnersChange && Object.keys(districtWinners).length > 0) {
            onDistrictWinnersChange(districtWinners);
        }
    }, [districtWinners, onDistrictWinnersChange]);

    useEffect(() => {
        if (onIndependentCandidatesChange) {
            onIndependentCandidatesChange(independentCandidates);
        }
    }, [independentCandidates, onIndependentCandidatesChange]);

    // Initialisiere die Wahlkreis-Stimmen, wenn sich corporationData ändert
    useEffect(() => {
        // Vermeide wiederholte Initialisierungen mit demselben corporationData
        if (prevCorporationDataRef.current === corporationData || initializedRef.current) {
            return;
        }

        prevCorporationDataRef.current = corporationData;

        if (corporationData && corporationData.districts && corporationData.parties) {
            const initialVotes = {};
            const initialTotals = {};

            // Prüfe, ob alle benötigten Daten vorhanden sind
            const hasPollResults = corporationData['poll-results'];
            const hasPastResults = corporationData['past-results'];
            const hasPastDistrictResults = corporationData['past-district-results'];

            if (hasPollResults && hasPastResults && hasPastDistrictResults) {
                // Berechne die relativen Veränderungsfaktoren für jede Partei
                const changeFactors = {};

                corporationData.parties.forEach(party => {
                    const partyId = party.identifier;

                    // Prüfe, ob die Partei in beiden Datensätzen vorhanden ist
                    if (hasPollResults[partyId] && hasPastResults[partyId]) {
                        // Berechne den Veränderungsfaktor (aktuell / vergangen)
                        changeFactors[partyId] = hasPollResults[partyId] / hasPastResults[partyId].Prozent;
                    } else {
                        // Wenn keine Daten vorhanden, setze Faktor auf 1 (keine Veränderung)
                        changeFactors[partyId] = 1;
                    }
                });

                // Für jeden Wahlkreis
                corporationData.districts.forEach(district => {
                    const districtNumber = district.number.toString();
                    initialVotes[districtNumber] = {};

                    // Prüfe, ob Daten für diesen Wahlkreis vorhanden sind
                    if (hasPastDistrictResults[districtNumber]) {
                        const pastDistrictResult = hasPastDistrictResults[districtNumber];

                        // Für jede Partei
                        corporationData.parties.forEach(party => {
                            const partyId = party.identifier;

                            // Prüfe, ob die Partei im vergangenen Wahlkreisergebnis vorhanden ist
                            if (pastDistrictResult[partyId]) {
                                // Berechne den neuen Prozentwert basierend auf dem Veränderungsfaktor
                                const newValue = pastDistrictResult[partyId] * (changeFactors[partyId] || 1);
                                initialVotes[districtNumber][partyId] = newValue.toFixed(1);
                            } else if (partyId === "others") {
                                // Für "others" direkt übernehmen, wenn vorhanden
                                initialVotes[districtNumber][partyId] = pastDistrictResult[partyId] || "0";
                            } else {
                                // Wenn keine Daten für diese Partei im Wahlkreis vorhanden sind,
                                // verwende den allgemeinen Umfragewert oder 0
                                initialVotes[districtNumber][partyId] = (hasPollResults[partyId] || 0).toString();
                            }
                        });
                    } else {
                        // Wenn keine Daten für diesen Wahlkreis vorhanden sind, verwende die allgemeinen Umfragewerte
                        corporationData.parties.forEach(party => {
                            initialVotes[districtNumber][party.identifier] = (hasPollResults[party.identifier] || 0).toString();
                        });
                    }

                    // Berechne die Gesamtsumme für den Wahlkreis
                    initialTotals[districtNumber] = Object.values(initialVotes[districtNumber]).reduce(
                        (sum, vote) => sum + parseFloat(vote || 0), 0
                    );

                    // Normalisiere die Werte, falls die Summe nicht 100% ergibt
                    if (initialTotals[districtNumber] !== 100 && initialTotals[districtNumber] > 0) {
                        const factor = 100 / initialTotals[districtNumber];

                        Object.keys(initialVotes[districtNumber]).forEach(partyId => {
                            const normalizedValue = parseFloat(initialVotes[districtNumber][partyId]) * factor;
                            initialVotes[districtNumber][partyId] = normalizedValue.toFixed(1);
                        });

                        initialTotals[districtNumber] = 100;
                    }
                });
            } else {
                // Fallback: Initialisiere mit 0%
                corporationData.districts.forEach(district => {
                    initialVotes[district.number] = {};

                    corporationData.parties.forEach(party => {
                        initialVotes[district.number][party.identifier] = "0";
                    });

                    initialTotals[district.number] = 0;
                });
            }

            setDistrictVotes(initialVotes);
            setDistrictTotals(initialTotals);
            initializedRef.current = true;

            // Speichere die ursprünglichen Poll-Daten als Backup
            originalDistrictVotesRef.current = { ...initialVotes };

            // Benachrichtige die übergeordnete Komponente über die initialen Werte
            if (onDistrictVotesChange) {
                onDistrictVotesChange(initialVotes);
            }
        } else {
            setDistrictVotes({});
            setDistrictTotals({});
            initializedRef.current = false;
        }
    }, [corporationData, onDistrictVotesChange]);

    // Wenn sich corporationData ändert, setze initializedRef zurück
    useEffect(() => {
        if (corporationData !== prevCorporationDataRef.current) {
            initializedRef.current = false;
        }
    }, [corporationData]);

    // Debug: Reagiere auf isLiveResultsActive Änderungen
    useEffect(() => {
        console.log('🔥 isLiveResultsActive changed to:', isLiveResultsActive);
    }, [isLiveResultsActive]);

    // Separater useEffect nur für Live-Ergebnisse
    useEffect(() => {
        if (!corporationData || !corporationData.districts || !corporationData.parties) {
            return;
        }

        if (!isLiveResultsActive || !liveResultsData || !corporationData?.['live-results']?.['party-mapping'] || isProcessingLiveResultsRef.current) {
            return;
        }

        console.log('🔥 PROCESSING LIVE RESULTS NOW!');
        console.log('🔥 Live data:', liveResultsData);
        console.log('🔥 Party mapping:', corporationData['live-results']['party-mapping']);
        
        // Verhindere Endlosschleife
        isProcessingLiveResultsRef.current = true;
        
        // Erstelle Backup der ursprünglichen Daten beim ersten Aktivieren
        if (Object.keys(originalDistrictVotesRef.current).length === 0 && Object.keys(districtVotes).length > 0) {
            originalDistrictVotesRef.current = { ...districtVotes };
            console.log('Backed up original district votes:', districtVotes);
        }

        // Konvertiere Live-Ergebnisse zu Prozentwerten
        console.log('🔥 CALLING convertLiveResultsToPercentages NOW!');
        const result = convertLiveResultsToPercentages(
            liveResultsData, 
            corporationData['live-results']['party-mapping']
        );

        console.log('🔥 Conversion result:', result);

        if (Object.keys(result.liveDistrictVotes).length > 0) {
            console.log('🔥 APPLYING LIVE RESULTS TO TABLE!');
            console.log('🔥 Setting districtVotes state to:', result.liveDistrictVotes);
            console.log('🔥 Setting districtTotals state to:', result.liveDistrictTotals);
            
            setDistrictVotes(result.liveDistrictVotes);
            setDistrictTotals(result.liveDistrictTotals);
            
            // Benachrichtige die übergeordnete Komponente
            if (onDistrictVotesChange) {
                console.log('Notifying parent component of vote changes');
                onDistrictVotesChange(result.liveDistrictVotes);
            }
        } else {
            console.log('🔥 NO LIVE DISTRICT VOTES TO APPLY!');
        }
        
        // Reset nach Verarbeitung
        isProcessingLiveResultsRef.current = false;
    }, [isLiveResultsActive, liveResultsData, corporationData]);

    // Separater useEffect für das Zurücksetzen auf Poll-Daten
    useEffect(() => {
        if (!isLiveResultsActive && Object.keys(originalDistrictVotesRef.current).length > 0) {
            console.log('Restoring original poll data:', originalDistrictVotesRef.current);
            setDistrictVotes(originalDistrictVotesRef.current);
            
            // Berechne Totals neu
            const restoredTotals = {};
            Object.keys(originalDistrictVotesRef.current).forEach(districtNumber => {
                const total = Object.values(originalDistrictVotesRef.current[districtNumber]).reduce(
                    (sum, vote) => sum + parseFloat(vote || 0), 0
                );
                restoredTotals[districtNumber] = total;
            });
            setDistrictTotals(restoredTotals);
            
            // Benachrichtige die übergeordnete Komponente
            if (onDistrictVotesChange) {
                onDistrictVotesChange(originalDistrictVotesRef.current);
            }
        }
    }, [isLiveResultsActive, onDistrictVotesChange]);

    // Wenn keine Körperschaftsdaten vorhanden sind, zeige die normale Datenvorschau
    if (!corporationData || !corporationData.districts || !corporationData.parties) {
        return (
            <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                    Wahlkreis-Stimmenverteilung
                </Typography>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        bgcolor: 'grey.100',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {dataPreview}
                </Paper>
            </Box>
        );
    }

    // Memoized Buttons für gleichmäßige Verteilung und Zurücksetzen
    const ActionButtons = React.memo(() => (
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
                variant="contained"
                color="primary"
                startIcon={<BalanceIcon />}
                onClick={() => {
                    // Gleichmäßige Verteilung der Stimmen auf alle Parteien
                    const newDistrictVotes = { ...districtVotes };
                    const newDistrictTotals = { ...districtTotals };

                    corporationData.districts.forEach(district => {
                        const equalShare = (100 / corporationData.parties.length).toFixed(1);

                        corporationData.parties.forEach(party => {
                            newDistrictVotes[district.number][party.identifier] = equalShare;
                        });

                        newDistrictTotals[district.number] = 100;
                    });

                    setDistrictVotes(newDistrictVotes);
                    setDistrictTotals(newDistrictTotals);

                    if (onDistrictVotesChange) {
                        onDistrictVotesChange(newDistrictVotes);
                    }
                }}
            >
                Gleichmäßig verteilen
            </Button>

            <Button
                variant="outlined"
                color="secondary"
                startIcon={<RestartAltIcon />}
                onClick={() => {
                    // Zurücksetzen aller Werte auf 0
                    const newDistrictVotes = { ...districtVotes };
                    const newDistrictTotals = { ...districtTotals };

                    corporationData.districts.forEach(district => {
                        corporationData.parties.forEach(party => {
                            newDistrictVotes[district.number][party.identifier] = "0";
                        });

                        newDistrictTotals[district.number] = 0;
                    });

                    setDistrictVotes(newDistrictVotes);
                    setDistrictTotals(newDistrictTotals);

                    if (onDistrictVotesChange) {
                        onDistrictVotesChange(newDistrictVotes);
                    }
                }}
            >
                Zurücksetzen
            </Button>
        </Stack>
    ));

    // Memoized TableHeader für bessere Performance
const TableHeader = React.memo(({ isLiveResultsActive }) => (
    <TableHead>
        <TableRow>
            {isLiveResultsActive && (
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: 80 }}>
                    <Tooltip 
                        title="Eingegangene Schnellmeldungen pro Wahlkreis" 
                        placement="top"
                        arrow
                        enterTouchDelay={0}
                    >
                        <IconButton size="small" sx={{ p: 0.5 }}>
                            <InfoIcon fontSize="small" color="action" />
                        </IconButton>
                    </Tooltip>
                </TableCell>
            )}
            <TableCell sx={{ fontWeight: 'bold' }}>Wahlkreis</TableCell>
            {corporationData.parties.map(party => (
                    <TableCell
                        key={party.identifier}
                        align="center"
                        sx={{
                            fontWeight: 'medium',
                            bgcolor: `${party.colorcode}20`
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: party.colorcode,
                                    mr: 0.5
                                }}
                            />
                            {party.short}
                        </Box>
                    </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Einzel. Bew.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Gesamt</TableCell>
            </TableRow>
        </TableHead>
    ));

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">
                    Wahlkreis-Stimmenverteilung
                </Typography>
                <Tooltip
                    title="Wirkt sich nur auf die Wahlkreisgewinner aus."
                    placement="right"
                    arrow
                    enterTouchDelay={0}
                >
                    <IconButton size="small" sx={{ ml: 1, p: 0.5 }}>
                        <InfoIcon fontSize="small" color="action" />
                    </IconButton>
                </Tooltip>
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
                    <TableHeader isLiveResultsActive={isLiveResultsActive} />
                    <TableBody>
                        {corporationData.districts.map((district) => (
                            <DistrictTableRow
                                key={district.number}
                                district={district}
                                parties={corporationData.parties}
                                districtVotes={districtVotes}
                                districtTotals={districtTotals}
                                handleVoteChange={handleVoteChange}
                                winningParty={districtWinners[district.number]}
                                winningCandidate={districtCandidates[district.number]}
                                corporationData={corporationData}
                                independentCandidates={independentCandidates}
                                handleIndependentChange={handleIndependentChange}
                                liveResultsData={liveResultsData}
                                isLiveResultsActive={isLiveResultsActive}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ActionButtons />
        </Box>
    );
}

export default DataPreview;

