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
    // 1) Vorbereitung: Stimmen laden, ungültige entfernen etc.
    const votes = { ...partyPercentages };

    Object.keys(votes).forEach(partyId => {
        if (parseFloat(votes[partyId]) === 0) {
            delete votes[partyId];
        }
    });

    if (Object.keys(votes).length === 0) {
        return {};
    }

    const totalVotes = Object.values(votes).reduce((sum, vote) => sum + parseFloat(vote), 0);

    // Nur als Beispiel: Anzahl der Direktmandate könnte hier relevant sein, 
    // aber in dieser Implementierung wird numDirectSeats nicht weiter genutzt.
    const numDirectSeats = Math.floor(totalSeats / 2);

    // Alle Parteien im directMandates-Objekt absichern
    Object.keys(votes).forEach(partyId => {
        if (!directMandates[partyId]) {
            directMandates[partyId] = 0;
        }
    });

    // 2) Schritt: Idealansprüche nach Stimmenanteil berechnen
    const idealClaims = {};
    Object.keys(votes).forEach(partyId => {
        const relativeVoteShare = parseFloat(votes[partyId]) / totalVotes;
        idealClaims[partyId] = relativeVoteShare * totalSeats;
    });

    // 3) Abgerundete Idealansprüche
    const roundedDownClaims = {};
    Object.keys(idealClaims).forEach(partyId => {
        roundedDownClaims[partyId] = Math.floor(idealClaims[partyId]);
    });

    // 4) Verteilung der Restsitze nach Verhältnis = Idealanspruch / math.ceil(Idealanspruch)
    let allocatedSeats = Object.values(roundedDownClaims).reduce((sum, seats) => sum + seats, 0);
    let remainingSeats = totalSeats - allocatedSeats;

    const comparisonValues = {};
    Object.keys(idealClaims).forEach(partyId => {
        const ideal = idealClaims[partyId];
        const roundedUp = Math.ceil(ideal);
        const fractionalPart = ideal - Math.floor(ideal);

        // Falls bereits ganzzahlig: -1, damit diese Partei bei Restsitzen nicht bevorzugt wird
        comparisonValues[partyId] = fractionalPart > 0 ? (ideal / roundedUp) : -1;
    });

    // Sortieren, bei Gleichheit Losentscheid via random
    const sortedParties = Object.keys(comparisonValues)
        .map(partyId => ({
            partyId,
            value: comparisonValues[partyId],
            random: Math.random()
        }))
        .sort((a, b) => {
            if (a.value === b.value) {
                return b.random - a.random;
            }
            return b.value - a.value;
        })
        .map(item => item.partyId);

    // Restsitze verteilen
    const proportionalSeats = { ...roundedDownClaims };
    let index = 0;
    while (remainingSeats > 0) {
        const partyId = sortedParties[index % sortedParties.length];
        proportionalSeats[partyId]++;
        remainingSeats--;
        index++;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 5) Überhangmandate (Abs. 3) beachten:
    //    Nur Parteien heranziehen, die in dieser Verteilung (Schritt 4) mind. 1 Sitz haben.
    // ─────────────────────────────────────────────────────────────────────────────

    const partiesWithSeats = Object.keys(proportionalSeats).filter(
        p => proportionalSeats[p] > 0
    );

    let hasOverhangMandate = false;
    let maxOverhangRatio = 0;
    let totalOverhangSeats = 0;

    // Überhang nur für jene Parteien prüfen, die bereits mindestens 1 Sitz haben
    partiesWithSeats.forEach(partyId => {
        if (directMandates[partyId] > proportionalSeats[partyId]) {
            hasOverhangMandate = true;
            totalOverhangSeats += directMandates[partyId] - proportionalSeats[partyId];

            // Verhältnis Direktmandate zu Idealanspruch
            const claim = idealClaims[partyId] || 0;
            if (claim > 0) {
                const ratio = directMandates[partyId] / claim;
                if (ratio > maxOverhangRatio) {
                    maxOverhangRatio = ratio;
                }
            }
        }
    });

    // Wenn Überhangmandate existieren, Ausgleichsmandate berechnen
    if (hasOverhangMandate) {
        // Neue Gesamtzahl nach dem größten Überhangverhältnis:
        let newTotalSeats = Math.floor(maxOverhangRatio * totalSeats);

        // Mindestens so groß wie ursprüngliche Sitze + Überhang
        newTotalSeats = Math.max(newTotalSeats, totalSeats + totalOverhangSeats);

        // Ist die ermittelte Zahl ungerade, auf nächste gerade Zahl aufrunden
        if (newTotalSeats % 2 !== 0) {
            newTotalSeats++;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Nur jene Parteien werden jetzt erneut betrachtet, die mind. einen Sitz hatten
        // (partiesWithSeats). Wir ignorieren alle anderen.
        // ─────────────────────────────────────────────────────────────────────────
        const filteredVotes = {};
        partiesWithSeats.forEach(p => {
            filteredVotes[p] = votes[p]; // nur diese Parteien bleiben
        });

        // Neue Idealansprüche für diese Parteien
        const newIdealClaims = {};
        let sumOfFilteredVotes = 0;
        Object.values(filteredVotes).forEach(v => {
            sumOfFilteredVotes += parseFloat(v);
        });

        Object.keys(filteredVotes).forEach(partyId => {
            const relativeVoteShare = parseFloat(filteredVotes[partyId]) / sumOfFilteredVotes;
            newIdealClaims[partyId] = relativeVoteShare * newTotalSeats;
        });

        const newRoundedDown = {};
        Object.keys(newIdealClaims).forEach(partyId => {
            newRoundedDown[partyId] = Math.floor(newIdealClaims[partyId]);
        });

        // Resteverteilung (könnte analog Schritt 4 sein oder der vereinfachte Ansatz mit prozentualen Resten)
        let allocatedNew = Object.values(newRoundedDown).reduce((sum, seats) => sum + seats, 0);
        let newRemSeats = newTotalSeats - allocatedNew;

        const newRests = {};
        Object.keys(newIdealClaims).forEach(partyId => {
            newRests[partyId] = newIdealClaims[partyId] - newRoundedDown[partyId];
        });

        // Sortieren nach (neuen) prozentualen Resten
        const newSortedParties = Object.keys(newRests).sort(
            (a, b) => newRests[b] - newRests[a]
        );

        const finalSeats = { ...newRoundedDown };
        for (let i = 0; i < newRemSeats; i++) {
            finalSeats[newSortedParties[i % newSortedParties.length]]++;
        }

        // Mindestens so viele Sitze wie Direktmandate
        Object.keys(directMandates).forEach(partyId => {
            if (finalSeats[partyId] < directMandates[partyId]) {
                finalSeats[partyId] = directMandates[partyId];
            }
        });

        // finalSeats sind die Mandate NUR für die qualifizierten Parteien
        // Parteien ohne Sitze aus Schritt 4 bleiben auf 0.
        // Damit die Ausgabe vollständig bleibt:
        // Wir erzeugen ein Endergebnis mit allen Parteien (die es ursprünglich gab),
        // setzen unqualifizierte Parteien explizit auf 0.
        const completeResult = {};
        Object.keys(votes).forEach(p => {
            completeResult[p] = finalSeats[p] || 0;
        });

        return completeResult;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 6) Partei mit >50% der Stimmen, aber <=50% der Sitze bekommt Zusatzmandat
    // ─────────────────────────────────────────────────────────────────────────────
    Object.keys(votes).forEach(partyId => {
        const share = parseFloat(votes[partyId]) / totalVotes;
        if (share > 0.5 && proportionalSeats[partyId] <= totalSeats / 2) {
            // Gib der Partei ein Zusatzmandat
            proportionalSeats[partyId]++;

            // Nimm der Partei mit dem geringsten Vergleichswert einen Sitz weg,
            // sofern diese Partei denselben nicht ohnehin nicht hätte usw.
            // (Vereinfacht: einfach die zuletzt sortierte Partei)
            const lowestRestParty = sortedParties[sortedParties.length - 1];
            if (lowestRestParty !== partyId && proportionalSeats[lowestRestParty] > 0) {
                proportionalSeats[lowestRestParty]--;
            }
        }
    });

    // Stellen sicher, dass jede Partei mind. so viele Sitze hat, wie Direktmandate
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
