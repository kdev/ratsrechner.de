// src/utils/electionHelpers.js
/**
 * Ermittelt die gewählten Kandidaten einer Partei
 * @param {string} partyId - Die ID der Partei
 * @param {object} seatDistribution - Die Sitzverteilung
 * @param {object} directMandates - Die Anzahl der Direktmandate pro Partei
 * @param {object} corporationData - Die Daten der Körperschaft
 * @param {object} districtWinners - Die Wahlkreissieger (Wahlkreis-ID -> Partei-ID)
 * @returns {object} - Die gewählten Kandidaten (Wahlkreise und Liste)
 */
export const getElectedCandidates = (partyId, seatDistribution, directMandates, corporationData, districtWinners) => {
  if (!partyId || !seatDistribution || !corporationData || !districtWinners) {
    return { districtCandidates: [], listCandidates: [] };
  }

  // Finde die Partei in den Daten
  const party = corporationData.parties.find(p => p.identifier === partyId);
  if (!party) {
    return { districtCandidates: [], listCandidates: [] };
  }

  // 1. Ermittle die in Wahlkreisen gewählten Kandidaten
  const districtCandidates = [];

  // Durchlaufe alle Wahlkreise und prüfe, ob diese Partei gewonnen hat
  Object.keys(districtWinners).forEach(districtNumber => {
    if (districtWinners[districtNumber] === partyId) {
      // Finde den Kandidaten für diesen Wahlkreis
      const districtCandidate = party['districts-candidates']?.find(
        c => c['district-number'] === parseInt(districtNumber, 10)
      );

      if (districtCandidate) {
        // Finde den Wahlkreisnamen
        const district = corporationData.districts.find(d => d.number === parseInt(districtNumber, 10));
        const districtName = district ? district.name : '';

        districtCandidates.push({
          name: districtCandidate['candidate-name'],
          district: {
            number: districtNumber,
            name: districtName
          }
        });
      }
    }
  });

  // 2. Ermittle die über die Liste gewählten Kandidaten
  const listCandidates = [];

  // Anzahl der Sitze, die der Partei insgesamt zustehen
  const totalSeats = seatDistribution[partyId] || 0;

  // Anzahl der Sitze, die bereits über Direktmandate besetzt sind
  const directSeats = districtCandidates.length;

  // Anzahl der Sitze, die über die Liste zu besetzen sind
  const listSeats = Math.max(0, totalSeats - directSeats);

  if (listSeats > 0 && party['list-candidates']) {
    // Namen der Direktkandidaten für den Vergleich
    const directCandidateNames = districtCandidates.map(c => c.name);

    // Durchlaufe die Listenkandidaten
    let seatsAssigned = 0;
    let position = 1;

    while (seatsAssigned < listSeats && position <= party['list-candidates'].length) {
      const listCandidate = party['list-candidates'].find(c => c.position === position);

      if (listCandidate) {
        // Prüfe, ob der Kandidat bereits ein Direktmandat hat
        if (!directCandidateNames.includes(listCandidate.name)) {
          listCandidates.push({
            name: listCandidate.name,
            position: position
          });
          seatsAssigned++;
        }
      }

      position++;
    }
  }

  return {
    districtCandidates,
    listCandidates
  };
};
