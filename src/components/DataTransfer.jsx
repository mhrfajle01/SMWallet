import React, { useRef } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { useProductivity } from '../context/ProductivityContext';
import { useApp } from '../context/AppContext';
import { FaFileDownload, FaFileUpload } from 'react-icons/fa';
import Papa from 'papaparse';

const DataTransfer = () => {
  const { habits, todos, notes } = useProductivity();
  const { wallets, meals, purchases } = useApp();
  const fileInputRef = useRef(null);

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return alert("No data to export");
    const csv = Papa.unparse(data.map(({ id, userId, createdAt, ...rest }) => rest)); // Exclude system fields
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    // Basic import stub - implementing full restore logic requires matching fields, which is complex.
    // For now, let's just parse and console log or alert.
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        complete: (results) => {
            console.log("Imported Data:", results.data);
            alert(`Parsed ${results.data.length} rows. Check console for data. Bulk import logic to Firestore to be implemented.`);
        }
    });
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <h5 className="fw-bold mb-4">Data Management</h5>
        
        <h6 className="text-muted small uppercase fw-bold mb-3">Export Data</h6>
        <Row className="g-3 mb-4">
            <Col xs={6} md={4}>
                <Button variant="outline-primary" className="w-100" onClick={() => downloadCSV(wallets, 'wallets')}>
                    <FaFileDownload className="me-2" /> Wallets
                </Button>
            </Col>
            <Col xs={6} md={4}>
                <Button variant="outline-primary" className="w-100" onClick={() => downloadCSV(meals, 'meals')}>
                    <FaFileDownload className="me-2" /> Meals
                </Button>
            </Col>
            <Col xs={6} md={4}>
                <Button variant="outline-primary" className="w-100" onClick={() => downloadCSV(purchases, 'purchases')}>
                    <FaFileDownload className="me-2" /> Purchases
                </Button>
            </Col>
            <Col xs={6} md={4}>
                <Button variant="outline-info" className="w-100" onClick={() => downloadCSV(habits, 'habits')}>
                    <FaFileDownload className="me-2" /> Habits
                </Button>
            </Col>
            <Col xs={6} md={4}>
                <Button variant="outline-info" className="w-100" onClick={() => downloadCSV(todos, 'todos')}>
                    <FaFileDownload className="me-2" /> Tasks
                </Button>
            </Col>
             <Col xs={6} md={4}>
                <Button variant="outline-info" className="w-100" onClick={() => downloadCSV(notes, 'notes')}>
                    <FaFileDownload className="me-2" /> Notes
                </Button>
            </Col>
        </Row>

        <h6 className="text-muted small uppercase fw-bold mb-3">Import Data</h6>
        <div className="p-4 border border-dashed rounded-3 text-center bg-light">
            <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImport}
            />
            <Button variant="dark" onClick={() => fileInputRef.current.click()}>
                <FaFileUpload className="me-2" /> Upload CSV
            </Button>
            <div className="small text-muted mt-2">Supports CSV files only</div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DataTransfer;
