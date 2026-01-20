import React, { useState, useMemo, useEffect } from 'react';
import { Table, Button, OverlayTrigger, Popover, Form, Badge, InputGroup } from 'react-bootstrap';
import { FaFilter, FaSortAlphaDown, FaSortAlphaUpAlt, FaSortNumericDown, FaSortNumericUp, FaSearch, FaTimes } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const SmartTable = ({ data, columns, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [activeFilters, setActiveFilters] = useState({}); 
  const [columnSearch, setColumnSearch] = useState({});

  // Extract unique values
  const uniqueValues = useMemo(() => {
    const values = {};
    columns.forEach(col => {
      if (col.filterable) {
        const set = new Set();
        data.forEach(item => {
          const val = col.accessor ? col.accessor(item) : item[col.key];
          set.add(String(val || ''));
        });
        values[col.key] = Array.from(set).sort();
      }
    });
    return values;
  }, [data, columns]);

  // Handle Sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle Filter Change
  const toggleFilter = (key, value) => {
    setActiveFilters(prev => {
      const currentSet = new Set(prev[key] || []);
      if (currentSet.has(value)) {
        currentSet.delete(value);
      } else {
        currentSet.add(value);
      }
      
      const newFilters = { ...prev };
      if (currentSet.size === 0) {
        delete newFilters[key];
      } else {
        newFilters[key] = currentSet;
      }
      return newFilters;
    });
  };

  const clearColumnFilter = (key) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setColumnSearch(prev => ({ ...prev, [key]: '' }));
  };

  // Process Data
  const processedData = useMemo(() => {
    let result = [...data];

    Object.keys(activeFilters).forEach(key => {
      const selectedValues = activeFilters[key];
      if (selectedValues && selectedValues.size > 0) {
        result = result.filter(item => {
          const col = columns.find(c => c.key === key);
          const val = String(col.accessor ? col.accessor(item) : item[key] || '');
          return selectedValues.has(val);
        });
      }
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const col = columns.find(c => c.key === sortConfig.key);
        let valA = col.accessor ? col.accessor(a) : a[sortConfig.key];
        let valB = col.accessor ? col.accessor(b) : b[sortConfig.key];

        if (col.type === 'number') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
        } else {
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, activeFilters, sortConfig, columns]);

  // Render Filter Popover
  const renderFilterPopover = (column) => (
    <Popover id={`popover-${column.key}`} className={`shadow-lg border-0 ${isDarkMode ? 'bg-dark text-white' : ''}`}>
      <Popover.Header as="h3" className={`border-bottom d-flex justify-content-between align-items-center ${isDarkMode ? 'bg-dark text-white border-secondary' : 'bg-white'}`}>
        <span>Filter {column.label}</span>
        {activeFilters[column.key] && (
            <Button variant="link" size="sm" className="p-0 text-danger text-decoration-none" onClick={() => clearColumnFilter(column.key)}>
                Clear
            </Button>
        )}
      </Popover.Header>
      <Popover.Body className="p-0">
        <div className={`p-2 border-bottom ${isDarkMode ? 'bg-black bg-opacity-25 border-secondary' : 'bg-light'}`}>
            <Button 
                variant={isDarkMode ? 'dark' : 'light'}
                size="sm" 
                className="w-100 text-start mb-1 d-flex align-items-center gap-2"
                onClick={() => setSortConfig({ key: column.key, direction: 'asc' })}
            >
                {column.type === 'number' ? <FaSortNumericDown /> : <FaSortAlphaDown />} Sort Ascending
            </Button>
            <Button 
                variant={isDarkMode ? 'dark' : 'light'} 
                size="sm" 
                className="w-100 text-start d-flex align-items-center gap-2"
                onClick={() => setSortConfig({ key: column.key, direction: 'desc' })}
            >
                {column.type === 'number' ? <FaSortNumericUp /> : <FaSortAlphaUpAlt />} Sort Descending
            </Button>
        </div>
        <div className="p-2">
            <InputGroup size="sm" className="mb-2">
                <InputGroup.Text className={`${isDarkMode ? 'bg-secondary text-white border-secondary' : 'bg-white border-end-0'}`}><FaSearch size={10} /></InputGroup.Text>
                <Form.Control 
                    placeholder="Search values..." 
                    className={`${isDarkMode ? 'bg-dark text-white border-secondary border-start-0' : 'border-start-0'}`}
                    value={columnSearch[column.key] || ''}
                    onChange={(e) => setColumnSearch({ ...columnSearch, [column.key]: e.target.value })}
                />
            </InputGroup>
            <div className="overflow-auto custom-scrollbar" style={{ maxHeight: '200px' }}>
                {uniqueValues[column.key]
                    ?.filter(val => val.toLowerCase().includes((columnSearch[column.key] || '').toLowerCase()))
                    .map(val => (
                    <Form.Check 
                        key={val}
                        type="checkbox"
                        id={`filter-${column.key}-${val}`}
                        label={<span className={`small text-truncate d-inline-block align-middle ${isDarkMode ? 'text-light' : ''}`} style={{ maxWidth: '180px' }}>{val}</span>}
                        checked={activeFilters[column.key]?.has(val) || false}
                        onChange={() => toggleFilter(column.key, val)}
                        className="mb-1"
                    />
                ))}
                {uniqueValues[column.key]?.length === 0 && <div className="text-center small text-muted">No values found</div>}
            </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className={`table-responsive rounded-3 border shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : 'bg-white'}`}>
      <Table hover className={`mb-0 align-middle ${isDarkMode ? 'table-dark' : ''}`}>
        <thead className={isDarkMode ? 'bg-black bg-opacity-25' : 'bg-light'}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="py-3 px-3 border-bottom-0" style={{ minWidth: col.width || 'auto', whiteSpace: 'nowrap' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <span 
                    className={`fw-bold small text-uppercase cursor-pointer user-select-none ${isDarkMode ? 'text-light opacity-75' : 'text-secondary'}`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortConfig.key === col.key && (
                        <span className="ms-1 text-primary">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                    )}
                  </span>
                  
                  {col.filterable && (
                    <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={renderFilterPopover(col)}>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className={`p-0 ms-2 ${activeFilters[col.key] ? 'text-primary' : 'text-muted opacity-25 hover-opacity-100'}`}
                      >
                        <FaFilter size={12} />
                      </Button>
                    </OverlayTrigger>
                  )}
                </div>
              </th>
            ))}
            <th className="py-3 px-3 border-bottom-0 text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {processedData.length > 0 ? (
            processedData.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map((col) => (
                  <td key={col.key} className="px-3">
                    {col.render ? col.render(row) : (
                        col.accessor ? col.accessor(row) : row[col.key]
                    )}
                  </td>
                ))}
                <td className="text-end px-3">
                    <div className="d-flex justify-content-end gap-2">
                        {onEdit && (
                            <Button variant={isDarkMode ? 'outline-light' : 'light'} size="sm" className="p-1 text-primary border-0" onClick={() => onEdit(row)}>Edit</Button>
                        )}
                        {onDelete && (
                            <Button variant={isDarkMode ? 'outline-light' : 'light'} size="sm" className="p-1 text-danger border-0" onClick={() => onDelete(row)}>Del</Button>
                        )}
                    </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
                <td colSpan={columns.length + 1} className="text-center py-5 text-muted">
                    No matching records found
                </td>
            </tr>
          )}
        </tbody>
      </Table>
      <div className={`p-2 border-top text-end small ${isDarkMode ? 'border-secondary text-light opacity-50' : 'bg-light text-muted'}`}>
        Showing {processedData.length} records
      </div>
    </div>
  );
};

export default SmartTable;