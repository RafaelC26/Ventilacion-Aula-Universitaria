import './App.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState, useEffect } from 'react';

function evaluateFormula(p, q, r, s) {
  return !((!p && q && r) || !s);
}

function generateCurrentRow(sensors) {
  const { p, q, r, s } = sensors;
  const f = evaluateFormula(p, q, r, s);
  return [
    ['p', 'q', 'r', 's', 'f'],
    [
      p ? 'V' : 'F',
      q ? 'V' : 'F',
      r ? 'V' : 'F',
      s ? 'V' : 'F',
      f ? 'V' : 'F',
    ],
  ];
}

function App() {
  const [sensors, setSensors] = useState({
    p: true,
    q: true,
    r: true,
    s: true,
  });
  const [status, setStatus] = useState({
    label: 'VENTILACIÓN: ÓPTIMA',
    msg: 'Mensaje: El flujo de aire es adecuado.',
    color: 'green-glow',
  });
  const [truthTable, setTruthTable] = useState(generateCurrentRow({
    p: true, q: true, r: true, s: true,
  }));

  const sendToHost = (data) => {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage(data);
    }
  };

  useEffect(() => {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'updateSensors') {
          setSensors(msg.sensors);
        } else if (msg.type === 'updateStatus') {
          setStatus(msg.status);
        } else if (msg.type === 'updateTruthTable') {
          setTruthTable(msg.table);
        }
      });
    }
  }, []);

  useEffect(() => {
    const currentRow = generateCurrentRow(sensors);
    setTruthTable(currentRow);
    const fValue = currentRow[1][4];
    if (fValue === 'F') {
      setStatus({
        label: 'VENTILACIÓN: INADECUADA',
        msg: 'Mensaje: El flujo de aire NO es adecuado.',
        color: 'red-glow',
      });
    } else {
      setStatus({
        label: 'VENTILACIÓN: ÓPTIMA',
        msg: 'Mensaje: El flujo de aire es adecuado.',
        color: 'green-glow',
      });
    }
  }, [sensors]);

  const handleExportPDF = async () => {
    const input = document.querySelector('.main-container');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('ventilacion_aula.pdf');
  };

  const handleSensorChange = (varName, checked) => {
    const newSensors = { ...sensors, [varName]: checked };
    setSensors(newSensors);
    sendToHost({ type: 'sensorChange', sensors: newSensors });
  };

  return (
    <div className="main-container">
      <header className="header">
        <span className="title">Ventilación Aula Universitaria</span>
        <span className="authors">- CRISTANCHO, LOZANO, MUNEVAR, GUEVARA</span>
      </header>
      <div className="content">
        <section className="panel panel-sensors">
          <h3>Sensores de Entrada</h3>
          <div className="sensor-list">
            <SensorSwitch label="Temperatura Alta" varName="p" checked={sensors.p} onChange={handleSensorChange} />
            <SensorSwitch label="Nivel CO₂ Alto" varName="q" checked={sensors.q} onChange={handleSensorChange} />
            <SensorSwitch label="Ocupación Detectada" varName="r" checked={sensors.r} onChange={handleSensorChange} highlight />
            <SensorSwitch label="Ventanas Abiertas" varName="s" checked={sensors.s} onChange={handleSensorChange} />
          </div>
        </section>
        <section className="panel panel-status">
          <div className={`status-circle ${status.color}`}>
            <span className="status-icon" />
          </div>
          <div className="status-label">{status.label}</div>
          <div className="status-msg">{status.msg}</div>
        </section>
        <section className="panel panel-logic">
          <div className="logic-formula">
            <span>Lógica del Sistema</span>
            <div className="formula">&not;((&not;p &and; q &and; r) &or; &not;s)</div>
            <button className="truth-table-btn" onClick={handleExportPDF}>
              Exportar a PDF
            </button>
          </div>
          <div className="truth-table-container">
            <TruthTable table={truthTable} />
          </div>
        </section>
      </div>
    </div>
  );
}

function SensorSwitch({ label, varName, highlight, checked, onChange }) {
  return (
    <div className={`sensor-switch${highlight ? ' highlight' : ''}`}>
      <span className="sensor-var">{varName}:</span>
      <span className="sensor-label">{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(varName, e.target.checked)}
        />
        <span className="slider" />
      </label>
    </div>
  );
}

function TruthTable({ table }) {
  if (!table || table.length === 0) return null;
  return (
    <table className="truth-table">
      <thead>
        <tr>{table[0].map((h, i) => <th key={i}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {table.slice(1).map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  background:
                    cell === 'V'
                      ? '#4caf50'
                      : cell === 'F'
                      ? '#bdbdbd'
                      : undefined,
                  color: cell === 'F' ? '#333' : '#fff',
                  fontWeight: 'bold',
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default App;
