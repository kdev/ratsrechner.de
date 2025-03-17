/**
 * Implementierung verschiedener Sitzverteilungsverfahren
 */

/**
 * Berechnet die Sitzverteilung nach dem Sainte-Laguë-Verfahren
 * @param {Object} partyPercentages - Objekt mit Partei-IDs als Schlüssel und Prozenten als Werte
 * @param {number} totalSeats - Gesamtzahl der zu verteilenden Sitze
 * @returns {Object} - Objekt mit Partei-IDs als Schlüssel und zugeteilten Sitzen als Werte
 */
export const sainteLague = (partyPercentages, totalSeats) => {
    // Konvertiere Prozentwerte in Stimmen (wir nehmen einfach die Prozente als Stimmen)
    const votes = { ...partyPercentages };

    // Entferne Parteien mit 0 Prozent
    Object.keys(votes).forEach(partyId => {
        if (parseFloat(votes[partyId]) === 0) {
            delete votes[partyId];
        }
    });

    // Initialisiere Sitze für jede Partei mit 0
    const seats = {};
    Object.keys(votes).forEach(partyId => {
        seats[partyId] = 0;
    });

    // Verteile die Sitze nach dem Sainte-Laguë-Verfahren
    for (let i = 0; i < totalSeats; i++) {
        let maxQuotient = 0;
        let maxParty = null;

        Object.keys(votes).forEach(partyId => {
            // Sainte-Laguë-Divisor: 2 * erhaltene Sitze + 1
            const divisor = 2 * seats[partyId] + 1;
            const quotient = parseFloat(votes[partyId]) / divisor;

            if (quotient > maxQuotient) {
                maxQuotient = quotient;
                maxParty = partyId;
            }
        });

        if (maxParty) {
            seats[maxParty]++;
        }
    }

    return seats;
};

/**
 * Berechnet die Wahlkreissieger basierend auf den Wahlkreis-Stimmen
 * @param {Object} districtVotes - Objekt mit Wahlkreis-Nummern als Schlüssel und Partei-Stimmen als Werte
 * @returns {Object} - Objekt mit Partei-IDs als Schlüssel und Anzahl gewonnener Wahlkreise als Werte
 */
export const calculateDistrictWinners = (districtVotes) => {
    const directMandates = {
        counts: {}, // Anzahl der gewonnenen Wahlkreise pro Partei
        districts: {} // Welche Partei hat welchen Wahlkreis gewonnen
    };

    // Für jeden Wahlkreis
    Object.keys(districtVotes).forEach(districtNumber => {
        const partyVotes = districtVotes[districtNumber];
        let maxVotes = 0;
        let winner = null;

        // Finde die Partei mit den meisten Stimmen in diesem Wahlkreis
        Object.keys(partyVotes).forEach(partyId => {
            const votes = parseFloat(partyVotes[partyId] || 0);
            if (votes > maxVotes) {
                maxVotes = votes;
                winner = partyId;
            }
        });

        // Speichere den Wahlkreissieger
        if (winner) {
            // Zähle den Wahlkreissieg für die Gewinnerpartei
            directMandates.counts[winner] = (directMandates.counts[winner] || 0) + 1;

            // Speichere, welche Partei diesen Wahlkreis gewonnen hat
            directMandates.districts[districtNumber] = winner;
        }
    });

    return directMandates;
};


/**
 * Berechnet die Sitzverteilung nach dem Rock-Verfahren
 * @param {Object} partyPercentages - Objekt mit Partei-IDs als Schlüssel und Prozenten als Werte
 * @param {number} totalSeats - Gesamtzahl der zu verteilenden Sitze
 * @param {Object} directMandates - Objekt mit Partei-IDs als Schlüssel und Anzahl gewonnener Wahlkreise als Werte
 * @returns {Object} - Objekt mit Partei-IDs als Schlüssel und zugeteilten Sitzen als Werte
 */
export const rock = (partyPercentages, totalSeats, directMandates = {}) => {
    // Konvertiere Prozentwerte in Stimmen (wir nehmen einfach die Prozente als Stimmen)
    const votes = { ...partyPercentages };

    // Entferne Parteien mit 0 Prozent
    Object.keys(votes).forEach(partyId => {
        if (parseFloat(votes[partyId]) === 0) {
            delete votes[partyId];
        }
    });

    // Wenn keine Parteien übrig bleiben, gib leeres Objekt zurück
    if (Object.keys(votes).length === 0) {
        return {};
    }

    // Berechne die Gesamtstimmen
    const totalVotes = Object.values(votes).reduce((sum, vote) => sum + parseFloat(vote), 0);

    // Anzahl der Wahlkreise ist die Hälfte der regulären Sitze
    const numDirectSeats = Math.floor(totalSeats / 2);

    // Stelle sicher, dass alle Parteien in directMandates enthalten sind
    Object.keys(votes).forEach(partyId => {
        if (!directMandates[partyId]) {
            directMandates[partyId] = 0;
        }
    });

    // Schritt 1: Berechne den Idealanspruch jeder Partei
    const idealClaims = {};
    Object.keys(votes).forEach(partyId => {
        const relativeVoteShare = parseFloat(votes[partyId]) / totalVotes;
        idealClaims[partyId] = relativeVoteShare * totalSeats;
    });

    // Schritt 2: Berechne die abgerundeten Idealansprüche
    const roundedDownClaims = {};
    Object.keys(idealClaims).forEach(partyId => {
        roundedDownClaims[partyId] = Math.floor(idealClaims[partyId]);
    });

    // Schritt 3: Berechne die prozentualen Reste
    const percentualRests = {};
    Object.keys(idealClaims).forEach(partyId => {
        percentualRests[partyId] = idealClaims[partyId] - roundedDownClaims[partyId];
    });

    // Schritt 4: Verteile die restlichen Sitze nach den höchsten prozentualen Resten
    let remainingSeats = totalSeats - Object.values(roundedDownClaims).reduce((sum, seats) => sum + seats, 0);

    // Sortiere die Parteien nach ihren prozentualen Resten (absteigend)
    const sortedParties = Object.keys(percentualRests).sort((a, b) => percentualRests[b] - percentualRests[a]);

    // Verteile die restlichen Sitze
    const proportionalSeats = { ...roundedDownClaims };
    for (let i = 0; i < remainingSeats; i++) {
        if (i < sortedParties.length) {
            proportionalSeats[sortedParties[i]]++;
        }
    }

    // Schritt 5: Prüfe auf Überhangmandate
    let hasOverhangMandates = false;
    let maxOverhangRatio = 0;
    let totalOverhangSeats = 0;

    Object.keys(directMandates).forEach(partyId => {
        if (directMandates[partyId] > proportionalSeats[partyId]) {
            hasOverhangMandates = true;
            totalOverhangSeats += directMandates[partyId] - proportionalSeats[partyId];

            // Berechne das Verhältnis zwischen Direktmandaten und Idealanspruch
            if (idealClaims[partyId] > 0) {
                const ratio = directMandates[partyId] / idealClaims[partyId];
                if (ratio > maxOverhangRatio) {
                    maxOverhangRatio = ratio;
                }
            }
        }
    });

    // Wenn es Überhangmandate gibt, berechne Ausgleichsmandate
    if (hasOverhangMandates) {
        // Berechne die neue Gesamtzahl der Sitze basierend auf dem maximalen Überhangverhältnis
        let newTotalSeats = Math.ceil(maxOverhangRatio * totalSeats);

        // Stelle sicher, dass die neue Gesamtzahl mindestens so groß ist wie die ursprüngliche plus Überhangmandate
        newTotalSeats = Math.max(newTotalSeats, totalSeats + totalOverhangSeats);

        // Runde auf die nächste gerade Zahl auf, wenn ungerade
        if (newTotalSeats % 2 !== 0) {
            newTotalSeats++;
        }

        // Berechne die neue Sitzverteilung mit der erhöhten Gesamtzahl
        const newIdealClaims = {};
        Object.keys(votes).forEach(partyId => {
            const relativeVoteShare = parseFloat(votes[partyId]) / totalVotes;
            newIdealClaims[partyId] = relativeVoteShare * newTotalSeats;
        });

        // Berechne die abgerundeten neuen Idealansprüche
        const newRoundedDownClaims = {};
        Object.keys(newIdealClaims).forEach(partyId => {
            newRoundedDownClaims[partyId] = Math.floor(newIdealClaims[partyId]);
        });

        // Berechne die neuen prozentualen Reste
        const newPercentualRests = {};
        Object.keys(newIdealClaims).forEach(partyId => {
            newPercentualRests[partyId] = newIdealClaims[partyId] - newRoundedDownClaims[partyId];
        });

        // Verteile die restlichen Sitze nach den höchsten prozentualen Resten
        let newRemainingSeats = newTotalSeats - Object.values(newRoundedDownClaims).reduce((sum, seats) => sum + seats, 0);

        // Sortiere die Parteien nach ihren prozentualen Resten (absteigend)
        const newSortedParties = Object.keys(newPercentualRests).sort((a, b) => newPercentualRests[b] - newPercentualRests[a]);

        // Verteile die restlichen Sitze
        const finalSeats = { ...newRoundedDownClaims };
        for (let i = 0; i < newRemainingSeats; i++) {
            if (i < newSortedParties.length) {
                finalSeats[newSortedParties[i]]++;
            }
        }

        // Stelle sicher, dass jede Partei mindestens so viele Sitze hat wie Direktmandate
        Object.keys(directMandates).forEach(partyId => {
            if (finalSeats[partyId] < directMandates[partyId]) {
                finalSeats[partyId] = directMandates[partyId];
            }
        });

        return finalSeats;
    }

    // Schritt 6: Prüfe, ob eine Partei mit mehr als 50% der Stimmen auch mehr als 50% der Sitze hat
    Object.keys(votes).forEach(partyId => {
        const voteShare = parseFloat(votes[partyId]) / totalVotes;
        if (voteShare > 0.5 && proportionalSeats[partyId] <= totalSeats / 2) {
            // Gib der Partei ein Zusatzmandat
            proportionalSeats[partyId]++;

            // Nimm der Partei mit dem geringsten prozentualen Rest einen Sitz weg
            const partyWithLowestRest = sortedParties[sortedParties.length - 1];
            if (partyWithLowestRest !== partyId && proportionalSeats[partyWithLowestRest] > 0) {
                proportionalSeats[partyWithLowestRest]--;
            }
        }
    });

    // Stelle sicher, dass jede Partei mindestens so viele Sitze hat wie Direktmandate
    Object.keys(directMandates).forEach(partyId => {
        if (proportionalSeats[partyId] < directMandates[partyId]) {
            proportionalSeats[partyId] = directMandates[partyId];
        }
    });

    return proportionalSeats;
};

/**
 * Wählt das richtige Sitzverteilungsverfahren basierend auf dem Schlüssel
 * @param {string} method - Schlüssel des Sitzverteilungsverfahrens
 * @param {Object} partyPercentages - Objekt mit Partei-IDs als Schlüssel und Prozenten als Werte
 * @param {number} totalSeats - Gesamtzahl der zu verteilenden Sitze
 * @param {Object} directMandates - Objekt mit Partei-IDs als Schlüssel und Anzahl gewonnener Wahlkreise als Werte
 * @returns {Object} - Objekt mit Partei-IDs als Schlüssel und zugeteilten Sitzen als Werte
 */
export const calculateSeats = (method, partyPercentages, totalSeats, directMandates = {}) => {
    switch (method) {
        case 'sainte-lague':
            return sainteLague(partyPercentages, totalSeats);
        case 'rock':
            return rock(partyPercentages, totalSeats, directMandates);
        // Hier können weitere Verfahren hinzugefügt werden
        default:
            console.warn(`Unbekanntes Sitzverteilungsverfahren: ${method}`);
            return {};
    }
};
