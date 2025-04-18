import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registriere die benötigten Chart.js-Komponenten
ChartJS.register(ArcElement, Tooltip, Legend);

function SeatDistributionChart({ seatDistribution, parties, independentSeats = 0 }) {
  // Wenn keine Daten vorhanden sind, zeige nichts an
  if (!seatDistribution || !parties || Object.keys(seatDistribution).length === 0) {
    return null;
  }

  // Erstelle ein Mapping von Partei-IDs zu Partei-Objekten für einfacheren Zugriff
  const partyMap = parties.reduce((map, party) => {
    map[party.identifier] = party;
    return map;
  }, {});

  // Bereite die Daten für das Chart vor
  const chartData = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  };

  // Füge nur Parteien mit Sitzen hinzu
  Object.entries(seatDistribution).forEach(([partyId, seats]) => {
    if (seats > 0 && partyMap[partyId]) {
      chartData.labels.push(`${partyMap[partyId].short} (${seats})`);
      chartData.datasets[0].data.push(seats);
      chartData.datasets[0].backgroundColor.push(partyMap[partyId].colorcode);
      chartData.datasets[0].borderColor.push('#ffffff');
    }
  });

  // Füge Einzelbewerber hinzu, wenn vorhanden
  if (independentSeats > 0) {
    chartData.labels.push(`Einzelbew. (${independentSeats})`);
    chartData.datasets[0].data.push(independentSeats);
    chartData.datasets[0].backgroundColor.push('#808080'); // Grau für Einzelbewerber
    chartData.datasets[0].borderColor.push('#ffffff');
  }

  // Chart-Optionen
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Legende ausblenden
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}% (${value} Sitze)`;
          }
        }
      }
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export default SeatDistributionChart;
