import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Badge, Modal, Button } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext';
import { FaChevronLeft, FaChevronRight, FaCircle } from 'react-icons/fa';

const FinancialCalendar = ({ meals, purchases, incomes }) => {
  const { isDarkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Merge data for the month
  const dailyData = useMemo(() => {
    const data = {};
    const prefix = currentDate.toISOString().slice(0, 7); // YYYY-MM

    const process = (items, type) => {
        items.forEach(item => {
            const dateStr = item.date || item.createdAt?.toDate().toISOString().split('T')[0];
            if (dateStr && dateStr.startsWith(prefix)) {
                const day = parseInt(dateStr.split('-')[2], 10);
                if (!data[day]) data[day] = { expense: 0, income: 0, items: [] };
                
                if (type === 'income') {
                    data[day].income += Number(item.amount);
                } else {
                    data[day].expense += Number(item.amount);
                }
                data[day].items.push({ ...item, type });
            }
        });
    };

    process(meals, 'meal');
    process(purchases, 'purchase');
    process(incomes, 'income');
    return data;
  }, [currentDate, meals, purchases, incomes]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatCurrency = (val) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(val);

  const renderDays = () => {
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayData = dailyData[d];
      const hasData = dayData && (dayData.expense > 0 || dayData.income > 0);
      const isHighSpend = dayData && dayData.expense > 2000; // Threshold example

      days.push(
        <div 
            key={d} 
            className={`calendar-day p-1 position-relative border ${isDarkMode ? 'border-secondary' : 'border-light'}`} 
            style={{ 
                minHeight: '80px', 
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                cursor: dayData ? 'pointer' : 'default'
            }}
            onClick={() => dayData && setSelectedDay({ day: d, ...dayData })}
        >
          <div className="d-flex justify-content-between align-items-center">
             <span className={`small fw-bold ${new Date().getDate() === d && new Date().getMonth() === month ? 'bg-primary text-white rounded-circle px-2' : 'text-muted'}`}>{d}</span>
             {isHighSpend && <FaCircle size={6} className="text-danger" />}
          </div>
          
          {dayData && (
             <div className="mt-1 d-flex flex-column gap-1">
                {dayData.expense > 0 && (
                    <Badge bg="danger" className="text-truncate w-100 fw-normal p-1" style={{ fontSize: '0.6rem' }}>
                        -{formatCurrency(dayData.expense)}
                    </Badge>
                )}
                {dayData.income > 0 && (
                    <Badge bg="success" className="text-truncate w-100 fw-normal p-1" style={{ fontSize: '0.6rem' }}>
                        +{formatCurrency(dayData.income)}
                    </Badge>
                )}
             </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <>
        <Card className="custom-card border-0 shadow-sm mb-4">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Financial Calendar</h5>
                    <div className="d-flex align-items-center gap-3">
                        <Button variant="light" size="sm" className="rounded-circle" onClick={handlePrevMonth}><FaChevronLeft /></Button>
                        <span className="fw-bold">{monthName} {year}</span>
                        <Button variant="light" size="sm" className="rounded-circle" onClick={handleNextMonth}><FaChevronRight /></Button>
                    </div>
                </div>

                <div className="calendar-grid d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center small fw-bold text-muted py-2">{day}</div>
                    ))}
                    {renderDays()}
                </div>
            </Card.Body>
        </Card>

        {/* Day Detail Modal */}
        <Modal show={!!selectedDay} onHide={() => setSelectedDay(null)} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">
                    {selectedDay && `${monthName} ${selectedDay.day}, ${year}`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {selectedDay && (
                    <div className="p-3">
                        <div className="d-flex justify-content-between mb-3 px-2">
                             <div>
                                <small className="text-muted d-block">TOTAL SPENT</small>
                                <span className="fw-bold text-danger fs-5">-{formatCurrency(selectedDay.expense)}</span>
                             </div>
                             <div className="text-end">
                                <small className="text-muted d-block">TOTAL INCOME</small>
                                <span className="fw-bold text-success fs-5">+{formatCurrency(selectedDay.income)}</span>
                             </div>
                        </div>
                        <div className="list-group list-group-flush">
                            {selectedDay.items.map((item, idx) => (
                                <div key={idx} className="list-group-item border-0 d-flex justify-content-between align-items-center px-2 py-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`p-2 rounded-circle ${item.type === 'income' ? 'bg-success' : 'bg-danger'} bg-opacity-10`}>
                                            {item.type === 'income' ? '💰' : item.type === 'meal' ? '🍔' : '🛍️'}
                                        </div>
                                        <div>
                                            <div className="fw-medium">{item.item || item.source}</div>
                                            <div className="small text-muted">{item.category || item.mealType || 'Income'}</div>
                                        </div>
                                    </div>
                                    <span className={`fw-bold ${item.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                        {item.type === 'income' ? '+' : '-'}{item.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    </>
  );
};

export default FinancialCalendar;
