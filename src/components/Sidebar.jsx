// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { calculateSeats, calculateDistrictWinners } from '../utils/seatAllocation';
import SeatDistributionChart from './SeatDistributionChart';
import { getElectedCandidates } from '../utils/electionHelpers';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Tooltip,
    IconButton,
    Badge,
    Popover,
    Card,
    CardContent,
    Alert,
    InputAdornment,
    Autocomplete
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { debounce } from 'lodash';

// Memoized Party-Listenelement für bessere Performance
const PartyListItem = React.memo(({
    party,
    partyPercentage,
    handlePercentageChange,
    seatAllocation,
    directMandates,
    seatDistribution,
    handleOpenPopover,
    totalPercentage
}) => {
    return (
        <ListItem
            disablePadding
            sx={{ mb: 1.5 }}
        >
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: party.colorcode,
                            mr: 1
                        }}
                    />
                    <Typography variant="body2">
                        {party.short}
                    </Typography>

                    {/* Zeige Anzahl der gewonnenen Wahlkreise an */}
                    {seatAllocation && seatAllocation.key === 'rock' && directMandates[party.identifier] > 0 && (
                        <Chip
                            label={`${directMandates[party.identifier]} WK`}
                            size="small"
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        type="number"
                        size="small"
                        inputProps={{
                            min: 0,
                            max: 100,
                            step: 0.1,
                            style: { textAlign: 'right', padding: '4px 8px' }
                        }}
                        sx={{
                            width: 95,
                            '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            }
                        }}
                        value={partyPercentage || ''}
                        onChange={(e) => handlePercentageChange(party.identifier, e.target.value)}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                    />

                    {/* Sitzanzeige mit Popover für Kandidaten */}
                    {totalPercentage <= 100 && seatDistribution[party.identifier] !== undefined && (
                        <Box sx={{ ml: 2 }}>
                            <Chip
                                label={`${seatDistribution[party.identifier]} Sitze`}
                                onClick={(e) => handleOpenPopover(e, party.identifier)}
                                sx={{
                                    bgcolor: 'grey.100',
                                    '&:hover': { bgcolor: 'grey.200' }
                                }}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </ListItem>
    );
});

// Memoized Kandidaten-Popover-Inhalt
const CandidatesPopoverContent = React.memo(({
    party,
    candidates
}) => {
    return (
        <>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                {party.short} - Gewählte Kandidat*innen:
            </Typography>

            {candidates.districtCandidates.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                        Wahlkreise:
                    </Typography>
                    <List dense sx={{ mt: 0.5 }}>
                        {candidates.districtCandidates.map((candidate, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            👤 {candidate.name} ({candidate.district.number} {candidate.district.name})
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {candidates.listCandidates.length > 0 && (
                <Box>
                    <Typography variant="body2" fontWeight="medium">
                        Liste:
                    </Typography>
                    <List dense sx={{ mt: 0.5 }}>
                        {candidates.listCandidates.map((candidate, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            👤 {candidate.position}. {candidate.name}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </>
    );
});

// Ausgelagerte Popover-Komponente
const CandidatesPopover = React.memo(({
    open,
    anchorEl,
    handleClosePopover,
    selectedPartyForPopover,
    corporationData,
    seatDistribution,
    directMandates,
    districtWinners
}) => {
    const popoverId = open ? 'candidates-popover' : undefined;

    // Memoized Berechnung der gewählten Kandidaten
    const electedCandidates = useMemo(() => {
        if (!selectedPartyForPopover || !corporationData || !seatDistribution) {
            return { districtCandidates: [], listCandidates: [] };
        }

        return getElectedCandidates(
            selectedPartyForPopover,
            seatDistribution,
            directMandates,
            corporationData,
            districtWinners
        );
    }, [selectedPartyForPopover, seatDistribution, directMandates, corporationData, districtWinners]);

    const selectedParty = corporationData?.parties?.find(p => p.identifier === selectedPartyForPopover);

    return (
        <Popover
            id={popoverId}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            PaperProps={{
                sx: { maxHeight: '80vh' } // Begrenzt die maximale Höhe auf 80% der Bildschirmhöhe
            }}
        >
            {selectedParty && (
                <Card sx={{ width: 500, maxWidth: '90vw' }}>
                    <CardContent sx={{ p: 3 }}>
                        <CandidatesPopoverContent
                            party={selectedParty}
                            candidates={electedCandidates}
                        />
                    </CardContent>
                </Card>
            )}
        </Popover>
    );
});

// Memoized Komponenten für bessere Performance
const ElectionSelect = React.memo(({ selectedElection, setSelectedElection, elections }) => (
    <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="election-select-label">Wahl auswählen</InputLabel>
        <Select
            labelId="election-select-label"
            id="election-select"
            value={selectedElection}
            label="Wahl auswählen"
            onChange={(e) => setSelectedElection(e.target.value)}
        >
            <MenuItem value="">
                <em>-- Bitte wählen --</em>
            </MenuItem>
            {Object.keys(elections).map(key => (
                <MenuItem key={key} value={key}>
                    {elections[key]['election-name']}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
));

const CorporationSelect = React.memo(({ selectedCorporation, onCorporationChange, corporations }) => (
    <FormControl fullWidth margin="normal" size="small">
        <Autocomplete
            id="corporation-select"
            value={selectedCorporation ? { key: selectedCorporation, name: corporations[selectedCorporation]?.name } : null}
            onChange={(event, newValue) => {
                onCorporationChange(newValue ? newValue.key : "");
            }}
            options={Object.keys(corporations).map(key => ({
                key: key,
                name: corporations[key].name
            }))}
            getOptionLabel={(option) => option.name || ""}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Körperschaft auswählen"
                    size="small"
                />
            )}
            renderOption={(props, option) => {
                // Extrahiere key aus props und speichere den Rest in restProps
                const { key, ...restProps } = props;
                return (
                    <MenuItem key={option.key} {...restProps} value={option.key}>
                        {option.name}
                    </MenuItem>
                );
            }}
            noOptionsText="Keine Körperschaften gefunden"
        />
    </FormControl>
));



const SeatAllocationInfo = React.memo(({ selectedElection, seatAllocation }) => (
    selectedElection && seatAllocation && (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
                Sitzzuteilungsverfahren:
            </Typography>
            <Typography variant="body2">
                {seatAllocation.name}
            </Typography>
        </Box>
    )
));

const CorporationInfo = React.memo(({
    corporationData,
    totalAllocatedSeats,
    totalPercentage,
    seatDistribution,
    seatAllocation,
    numDirectSeats,
    totalDirectMandates,
    successfulIndependents = 0 
}) => (
    corporationData && (
        <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium">
                Anzahl der Ratssitze:
            </Typography>
            <Typography variant="body1">
                {totalAllocatedSeats + successfulIndependents}
            </Typography>

            {/* Chart für die Sitzverteilung */}
            {totalPercentage <= 100 && Object.keys(seatDistribution).length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <SeatDistributionChart
                        seatDistribution={seatDistribution}
                        parties={corporationData.parties}
                        independentSeats={successfulIndependents}
                    />
                </Box>
            )}

            {/* Zeige Anzahl der Wahlkreise an, wenn Rock-Verfahren verwendet wird */}
            {seatAllocation && seatAllocation.key === 'rock' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Wahlkreise: {numDirectSeats}
                    {totalDirectMandates > 0 && ` (${totalDirectMandates} vergeben)`}
                </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gesetzliche Sitzzahl: {corporationData['cuncil-seats']}
            </Typography>
        </Box>
    )
));

const SeatSummary = React.memo(({
    totalPercentage,
    totalAllocatedSeats,
    corporationData,
    seatAllocation,
    successfulIndependents = 0
}) => (
    totalPercentage <= 100 && totalAllocatedSeats > 0 && (
        <Paper
            variant="outlined"
            sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}
        >
            <Typography variant="subtitle1" fontWeight="medium">
                Sitzverteilung ({seatAllocation.name}):
            </Typography>
            <Typography variant="body2">
                Insgesamt verteilt: {totalAllocatedSeats + successfulIndependents} von {corporationData['cuncil-seats']} Sitzen
                {successfulIndependents > 0 && ` (davon ${successfulIndependents} Einzelbewerber)`}
            </Typography>

            {/* Zeige Hinweis zu Überhangmandaten, wenn Rock-Verfahren verwendet wird */}
            {seatAllocation && seatAllocation.key === 'rock' && totalAllocatedSeats + successfulIndependents > corporationData['cuncil-seats'] && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Inkl. {totalAllocatedSeats + successfulIndependents - corporationData['cuncil-seats']} Ausgleichsmandate
                </Typography>
            )}
        </Paper>
    )
));

function Sidebar({
    elections,
    selectedElection,
    setSelectedElection,
    corporations,
    selectedCorporation,
    onCorporationChange,
    corporationData,
    districtVotes,
    districtWinners,
    independentCandidates
}) {
    // Erhalte das Sitzzuteilungsverfahren aus der ausgewählten Wahl
    const seatAllocation = selectedElection && elections[selectedElection] && elections[selectedElection]['seat-allocation'];

    // State für die Prozentwerte der Parteien
    const [partyPercentages, setPartyPercentages] = useState({});
    // State für die Summe der Prozentwerte
    const [totalPercentage, setTotalPercentage] = useState(0);
    // State für die berechnete Sitzverteilung
    const [seatDistribution, setSeatDistribution] = useState({});
    // State für die Wahlkreissieger
    const [directMandates, setDirectMandates] = useState({});
    // State für die Partei, über deren Sitze gehovert wird
    const [hoveredParty, setHoveredParty] = useState('');
    // State für das Popover
    const [anchorEl, setAnchorEl] = useState(null);
    // State für die aktuell ausgewählte Partei im Popover
    const [selectedPartyForPopover, setSelectedPartyForPopover] = useState('');

    const prevDirectMandatesRef = useRef({});
    const prevSeatsRef = useRef({});

    // Debounced Funktion für Prozentänderungen
    const debouncedHandlePercentageChange = useCallback(
        debounce((partyId, value, currentPercentages) => {
            const newValue = value === '' ? '0' : value;
            const newPercentages = { ...currentPercentages, [partyId]: newValue };

            setPartyPercentages(newPercentages);
            // Berechne die neue Gesamtsumme
            const sum = Object.values(newPercentages).reduce((acc, val) => acc + parseFloat(val || 0), 0);
            setTotalPercentage(sum);
        }, 100),
        []
    );

    // Cleanup für debounced Funktion
    useEffect(() => {
        return () => {
            debouncedHandlePercentageChange.cancel();
        };
    }, [debouncedHandlePercentageChange]);

    // Handler für Prozentänderungen
    const handlePercentageChange = useCallback((partyId, value) => {
        debouncedHandlePercentageChange(partyId, value, partyPercentages);
    }, [debouncedHandlePercentageChange, partyPercentages]);

    // Initialisiere die Prozentwerte, wenn corporationData sich ändert
    useEffect(() => {
        if (corporationData && corporationData.parties) {
            let initialPercentages = {};

            // Prüfe, ob poll-results vorhanden sind
            if (corporationData['poll-results']) {
                // Verwende die Umfrageergebnisse als initiale Werte
                const pollResults = corporationData['poll-results'];

                // Initialisiere alle Parteien mit 0
                corporationData.parties.forEach(party => {
                    initialPercentages[party.identifier] = 0;
                });

                // Setze die Werte aus den Umfrageergebnissen
                Object.keys(pollResults).forEach(partyId => {
                    if (initialPercentages.hasOwnProperty(partyId)) {
                        initialPercentages[partyId] = pollResults[partyId].toString();
                    }
                });
            } else {
                // Fallback: Gleichmäßige Verteilung
                const initialPercentage = (100 / corporationData.parties.length).toFixed(1);
                corporationData.parties.forEach(party => {
                    initialPercentages[party.identifier] = initialPercentage;
                });
            }

            setPartyPercentages(initialPercentages);

            // Berechne die Gesamtsumme
            const sum = Object.values(initialPercentages).reduce(
                (acc, val) => acc + parseFloat(val || 0), 0
            );
            setTotalPercentage(sum);
        } else {
            setPartyPercentages({});
            setTotalPercentage(0);
            setSeatDistribution({});
            setDirectMandates({});
            setHoveredParty('');
        }
    }, [corporationData]);

    // Memoized Berechnung der Wahlkreissieger
    const memoizedDirectMandates = useMemo(() => {
        if (Object.keys(districtWinners).length === 0) {
            return {};
        }

        const counts = {};

        // Zähle die Anzahl der gewonnenen Wahlkreise pro Partei
        Object.values(districtWinners).forEach(partyId => {
            if (partyId) { // Nur gültige Partei-IDs zählen
                counts[partyId] = (counts[partyId] || 0) + 1;
            }
        });

        return counts;
    }, [districtWinners]);

    // Aktualisiere directMandates, wenn sich memoizedDirectMandates ändert
    useEffect(() => {
        if (JSON.stringify(memoizedDirectMandates) !== JSON.stringify(directMandates)) {
            setDirectMandates(memoizedDirectMandates);
        }
    }, [memoizedDirectMandates, directMandates]);

    const successfulIndependents = useMemo(() => {
        if (!independentCandidates) return 0;
        return Object.values(independentCandidates).filter(Boolean).length;
    }, [independentCandidates]);

    // Memoized Berechnung der Sitzverteilung
    const memoizedSeatDistribution = useMemo(() => {
        if (!corporationData || !seatAllocation || totalPercentage > 100) {
            return {};
        }

        const totalSeats = corporationData['cuncil-seats'];
        const method = seatAllocation.key;

        // Berechne die Anzahl der erfolgreichen Einzelbewerber
        const independentSeats = Object.values(independentCandidates || {}).filter(Boolean).length;

        let seats;
        if (method === 'rock' && Object.keys(directMandates).length > 0) {
            seats = calculateSeats(method, partyPercentages, totalSeats, directMandates, independentSeats);
        } else {
            seats = calculateSeats(method, partyPercentages, totalSeats, {}, independentSeats);
        }

        return seats;
    }, [corporationData, seatAllocation, totalPercentage, directMandates, partyPercentages, independentCandidates]);


    // Aktualisiere seatDistribution, wenn sich memoizedSeatDistribution ändert
    useEffect(() => {
        if (JSON.stringify(memoizedSeatDistribution) !== JSON.stringify(seatDistribution)) {
            setSeatDistribution(memoizedSeatDistribution);
        }
    }, [memoizedSeatDistribution, seatDistribution]);

    // Berechne die Gesamtzahl der verteilten Sitze
    const totalAllocatedSeats = useMemo(() => {
        return Object.values(seatDistribution).reduce((sum, seats) => sum + seats, 0);
    }, [seatDistribution]);

    // Berechne die Anzahl der Wahlkreise (Direktmandate) - die Hälfte der regulären Ratssitze
    const numDirectSeats = corporationData ? Math.floor(corporationData['cuncil-seats'] / 2) : 0;

    // Berechne die Gesamtzahl der gewonnenen Wahlkreise
    const totalDirectMandates = useMemo(() => {
        return Object.values(directMandates).reduce((sum, count) => sum + count, 0);
    }, [directMandates]);

    // Öffne das Popover für die Kandidatenliste
    const handleOpenPopover = useCallback((event, partyId) => {
        setAnchorEl(event.currentTarget);
        setSelectedPartyForPopover(partyId);
    }, []);

    // Schließe das Popover
    const handleClosePopover = useCallback(() => {
        setAnchorEl(null);
        setSelectedPartyForPopover('');
    }, []);

    // Prüfe, ob das Popover geöffnet ist
    const open = Boolean(anchorEl);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Kommunalwahl Rechner
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="p" gutterBottom >
                    Mit Ratsrechner.de können Sie die Sitzverteilung in Ihrem Stadtrat oder Kreistag berechnen.
                </Typography>
            </Box>

            <ElectionSelect
                selectedElection={selectedElection}
                setSelectedElection={setSelectedElection}
                elections={elections}
            />

            <CorporationSelect
                selectedCorporation={selectedCorporation}
                onCorporationChange={onCorporationChange}
                corporations={corporations}
            />

            <CorporationInfo
                corporationData={corporationData}
                totalAllocatedSeats={totalAllocatedSeats}
                totalPercentage={totalPercentage}
                seatDistribution={seatDistribution}
                seatAllocation={seatAllocation}
                numDirectSeats={numDirectSeats}
                totalDirectMandates={totalDirectMandates}
                successfulIndependents={successfulIndependents}
            />

            {/* Anzeige der erfolgreichen Einzelbewerber */}
            {successfulIndependents > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="normal">
                        Erfolgreiche Einzelbew.: {successfulIndependents}
                    </Typography>
                </Box>
            )}

            {/* Parteien mit Prozentfeldern und Sitzverteilung */}
            {corporationData && corporationData.parties && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                                Parteien:
                            </Typography>
                            {/* <Chip
                                label={`${totalPercentage.toFixed(1)}%`}
                                size="small"
                                color={totalPercentage > 100 ? "error" : "default"}
                                sx={{ ml: 1 }}
                            /> */}
                        </Box>
                        {totalPercentage > 100 && (
                            <Alert severity="error" sx={{ py: 0, px: 1 }}>
                                Max. 100%! (Aktuell: {totalPercentage.toFixed(1)}%)
                            </Alert>
                        )}
                    </Box>

                    <List disablePadding>
                        {corporationData.parties.map((party) => (
                            <PartyListItem
                                key={party.identifier}
                                party={party}
                                partyPercentage={partyPercentages[party.identifier]}
                                handlePercentageChange={handlePercentageChange}
                                seatAllocation={seatAllocation}
                                directMandates={directMandates}
                                seatDistribution={seatDistribution}
                                handleOpenPopover={handleOpenPopover}
                                totalPercentage={totalPercentage}
                            />
                        ))}
                        <ListItem
                            disablePadding
                            sx={{ mb: 1.5 }}
                        >
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: 'grey.500',
                                            mr: 1
                                        }}
                                    />
                                    <Typography variant="body2">
                                        Sonstige
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                        type="number"
                                        size="small"
                                        disabled
                                        inputProps={{
                                            min: 0,
                                            max: 100,
                                            step: 0.1,
                                            style: { textAlign: 'right', padding: '4px 8px' }
                                        }}
                                        sx={{
                                            width: 95,
                                            '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                                                WebkitAppearance: 'none',
                                                margin: 0,
                                            },
                                            '& input[type=number]': {
                                                MozAppearance: 'textfield',
                                            }
                                        }}
                                        value={(100 - totalPercentage).toFixed(1)}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                    />
                                </Box>
                            </Box>
                        </ListItem>

                    </List>


                    {/* Ausgelagerte Popover-Komponente */}
                    <CandidatesPopover
                        open={open}
                        anchorEl={anchorEl}
                        handleClosePopover={handleClosePopover}
                        selectedPartyForPopover={selectedPartyForPopover}
                        corporationData={corporationData}
                        seatDistribution={seatDistribution}
                        directMandates={directMandates}
                        districtWinners={districtWinners}
                    />

                    {/* Zusammenfassung der Sitzverteilung */}
                    <SeatSummary
                        totalPercentage={totalPercentage}
                        totalAllocatedSeats={totalAllocatedSeats}
                        corporationData={corporationData}
                        seatAllocation={seatAllocation}
                        successfulIndependents={successfulIndependents}
                    />
                </Box>
            )}
            {/* Footer mit Links zum Impressum und GitHub */}
            <Box
                sx={{
                    mt: 4,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    fontSize: '0.875rem',
                    color: 'text.secondary'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <a
                        href="/impressum.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        Impressum & Datenschutz
                    </a>
                    <a
                        href="https://github.com/Tools-for-Democracy/ratsrechner.de"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        GitHub
                        <Tooltip
                            title="Über Github Issues können Sie uns Feedback geben oder Fehler melden. Sie können auch selbst Änderungen vornehmen und Pull Requests einreichen. Zum Beispiel um neue Städte hinzufügen."
                            placement="right"
                            arrow
                            enterTouchDelay={0}
                        >
                            <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
                                <InfoIcon fontSize="small" color="action" />
                            </IconButton>
                        </Tooltip>
                    </a>

                </Box>
                <Typography variant="caption" color="text.secondary">
                    © {new Date().getFullYear()} Tools for Democracy
                </Typography>
            </Box>
        </Box>
    );
}

export default Sidebar;

