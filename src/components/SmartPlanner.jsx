import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Badge, ProgressBar, Modal, Nav, Dropdown, ButtonGroup } from 'react-bootstrap';
import { useProductivity } from '../context/ProductivityContext';
import { useApp } from '../context/AppContext';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaPlus, FaTrash, FaCheck, FaExclamationTriangle, 
    FaShoppingBasket, FaLightbulb, FaReceipt, FaPlane, 
    FaSuitcase, FaMapMarkerAlt, FaShareAlt, FaCar, FaClock,
    FaUsers, FaRoute, FaArrowRight, FaTicketAlt, FaEllipsisV,
    FaCalendarCheck, FaCreditCard, FaRegClock, FaHistory
} from 'react-icons/fa';
import ConfirmModal from './ConfirmModal';
import '../Productivity.css';

const SmartPlanner = () => {
  const { shoppingList, trips, addTrip, updateTrip, deleteTrip, addShoppingItem, updateShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCompletedShopping } = useProductivity();
  const { categories, budgets, meals, purchases, globalStats } = useApp();
  const { openTransactionModal } = useUI();
  
  const [activeMode, setActiveType] = useState('daily'); 
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [newTrip, setNewTrip] = useState({ name: '', location: '', startDate: '', passengers: 1 });
  const [newItem, setNewItem] = useState({ 
    name: '', price: '', category: 'Travel', type: 'buy', 
    isRoute: false, from: '', to: '', transport: 'Bus', 
    bookingStatus: 'planned', targetDate: '' 
  });

  const TRANSPORT_PRESETS = [
    { name: 'Rickshaw', price: 30, category: 'Travel', icon: <FaCar /> },
    { name: 'CNG', price: 200, category: 'Travel', icon: <FaCar /> },
    { name: 'Uber/Pathao', price: 500, category: 'Travel', icon: <FaCar /> },
    { name: 'Bus', price: 150, category: 'Travel', icon: <FaSuitcase /> },
  ];

  // Logic: Dynamic Route Presets (Suggestion: Build from history)
  const routePresets = useMemo(() => {
    const routes = shoppingList.filter(i => i.isRoute && i.from && i.to);
    const uniqueRoutes = [];
    const seen = new Set();

    routes.forEach(r => {
        const key = `${r.from}-${r.to}`.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            uniqueRoutes.push({
                from: r.from,
                to: r.to,
                transport: r.transport,
                price: r.estimatedPrice,
                category: r.categoryId
            });
        }
    });
    return uniqueRoutes.slice(0, 4); // Top 4 historical routes
  }, [shoppingList]);

  useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
        setSelectedTripId(trips[0].id);
        setActiveType('trip');
    } else if (trips.length === 0) {
        setSelectedTripId(null);
        setActiveType('daily');
    }
  }, [trips]);

  const currentTrip = useMemo(() => trips.find(t => t.id === selectedTripId), [trips, selectedTripId]);

  const currentList = useMemo(() => {
    return shoppingList.filter(item => 
        activeMode === 'daily' ? !item.tripId : item.tripId === selectedTripId
    ).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  }, [shoppingList, activeMode, selectedTripId]);

  const totalEstimated = useMemo(() => {
    return currentList.reduce((acc, curr) => acc + (Number(curr.estimatedPrice) || 0), 0);
  }, [currentList]);

  const costPerPerson = useMemo(() => {
    const passengers = Number(currentTrip?.passengers || 1);
    return totalEstimated / passengers;
  }, [totalEstimated, currentTrip]);

  const isSafeToSpend = globalStats.totalRealBalance >= totalEstimated;

  const handleShare = () => {
    let text = `*SMWallet Planner: ${activeMode === 'daily' ? 'Shopping List' : currentTrip?.name}*\n\n`;
    currentList.forEach(item => {
        const itemLine = item.isRoute ? `${item.from} ➔ ${item.to} (${item.transport})` : item.name;
        text += `${item.completed ? '✅' : '⬜'} ${itemLine}: ${item.estimatedPrice} BDT\n`;
    });
    text += `\n*Total Estimated:* ${totalEstimated} BDT`;
    if (activeMode === 'trip' && currentTrip?.passengers > 1) {
        text += `\n*Per Person (${currentTrip.passengers}):* ${Math.round(costPerPerson)} BDT`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    await addTrip(newTrip);
    setNewTrip({ name: '', location: '', startDate: '', passengers: 1 });
    setShowAddTrip(false);
  };

  const handleDeleteTrip = async () => {
    if (selectedTripId) {
        await deleteTrip(selectedTripId);
        setSelectedTripId(null);
        setShowConfirmDelete(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const finalName = newItem.isRoute ? `${newItem.from} to ${newItem.to}` : newItem.name;
    await addShoppingItem({
        ...newItem,
        name: finalName,
        tripId: activeMode === 'trip' ? selectedTripId : null,
        estimatedPrice: newItem.type === 'pack' ? 0 : newItem.price
    });
    setNewItem({ name: '', price: '', category: 'Travel', type: 'buy', isRoute: false, from: '', to: '', transport: 'Bus', bookingStatus: 'planned', targetDate: '' });
    setShowAddItem(false);
  };

  const addRoutePreset = async (route) => {
    await addShoppingItem({
        ...route,
        name: `${route.from} to ${route.to}`,
        isRoute: true,
        type: 'buy',
        tripId: selectedTripId,
        bookingStatus: 'planned'
    });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  return (
    <div className="prod-container pb-5 px-2 px-md-3">
      {/* Header & Mode Switcher */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 mt-2">
        <div>
            <h2 className="prod-title mb-1 fs-3">Smart Planner</h2>
            <p className="prod-subtitle mb-0 small text-wrap">Route mapping & budget estimation.</p>
        </div>
        <Nav variant="pills" className="bg-light p-1 rounded-pill shadow-sm w-100 w-md-auto justify-content-center" activeKey={activeMode} onSelect={setActiveType}>
            <Nav.Item className="flex-grow-1 flex-md-grow-0"><Nav.Link eventKey="daily" className="rounded-pill px-3 px-md-4 d-flex align-items-center justify-content-center gap-2 small"><FaShoppingBasket /> Daily</Nav.Link></Nav.Item>
            <Nav.Item className="flex-grow-1 flex-md-grow-0"><Nav.Link eventKey="trip" className="rounded-pill px-3 px-md-4 d-flex align-items-center justify-content-center gap-2 small"><FaPlane /> Trips</Nav.Link></Nav.Item>
        </Nav>
      </div>

      <Row className="g-3 g-md-4">
        <Col lg={8}>
          {activeMode === 'trip' && (
              <div className="mb-3 d-flex gap-2 overflow-auto pb-2 scrollbar-hidden align-items-center no-wrap">
                  {trips.map(trip => (
                      <Badge 
                        key={trip.id} bg={selectedTripId === trip.id ? 'primary' : 'white'} 
                        text={selectedTripId === trip.id ? 'white' : 'dark'}
                        className="p-2 px-3 border rounded-pill shadow-sm cursor-pointer d-flex align-items-center gap-2 flex-shrink-0"
                        onClick={() => setSelectedTripId(trip.id)}
                      >
                          <FaMapMarkerAlt size={10} /> {trip.name}
                      </Badge>
                  ))}
                  <Badge bg="white" text="primary" className="p-2 px-3 border border-primary border-dashed rounded-pill cursor-pointer flex-shrink-0" onClick={() => setShowAddTrip(true)}><FaPlus size={10} /> New Trip</Badge>
              </div>
          )}

          <Card className="prod-card border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 p-3 p-md-4 d-flex justify-content-between align-items-start">
              <div className="flex-grow-1 pe-2">
                  <h5 className="mb-0 fw-bold prod-title fs-6 fs-md-5 text-wrap">
                      {activeMode === 'daily' ? 'Shopping List' : currentTrip?.name || 'Select a Trip'}
                  </h5>
                  {activeMode === 'trip' && currentTrip && (
                      <div className="text-muted d-flex flex-wrap gap-2 mt-1" style={{ fontSize: '0.75rem' }}>
                          <span className="d-flex align-items-center gap-1"><FaUsers /> {currentTrip.passengers} pax</span>
                          <span className="d-flex align-items-center gap-1"><FaMapMarkerAlt /> {currentTrip.location || 'N/A'}</span>
                      </div>
                  )}
              </div>
              <div className="d-flex gap-1 align-items-center flex-shrink-0">
                  <Button variant="light" size="sm" className="rounded-circle p-2 border-0 shadow-none" onClick={handleShare}><FaShareAlt size={14}/></Button>
                  
                  {activeMode === 'trip' && currentTrip && (
                      <Dropdown align="end">
                          <Dropdown.Toggle variant="light" className="rounded-circle p-2 border-0 shadow-none no-caret"><FaEllipsisV size={14}/></Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-lg border-0 rounded-4 p-2">
                              <Dropdown.Item className="text-danger small" onClick={() => setShowConfirmDelete(true)}><FaTrash className="me-2" /> Delete Trip</Dropdown.Item>
                          </Dropdown.Menu>
                      </Dropdown>
                  )}

                  <Button variant="primary" size="sm" className="rounded-pill px-2 px-md-3 shadow-sm small" onClick={() => setShowAddItem(true)}><FaPlus size={12} className="me-1"/> Add</Button>
              </div>
            </Card.Header>

            <div className="pb-2">
              {currentList.length > 0 ? (
                currentList.map((item) => (
                    <div key={item.id} className="prod-list-item d-flex flex-column py-3 px-3">
                      <div className="d-flex align-items-start justify-content-between w-100">
                        <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <div 
                                className={`prod-checkbox mt-1 ${item.completed ? 'active' : ''}`} 
                                onClick={() => toggleShoppingItem(item.id, item.completed)}
                                style={{ width: '22px', height: '22px', minWidth: '22px' }}
                            >
                            {item.completed && <FaCheck size={10} />}
                            </div>
                            <div className={item.completed ? 'text-decoration-line-through opacity-50 flex-grow-1' : 'flex-grow-1'}>
                            <div className="fw-bold prod-title d-flex flex-wrap align-items-center gap-1" style={{ fontSize: '0.95rem' }}>
                                {item.isRoute ? (
                                    <span className="d-flex align-items-center gap-2 text-wrap">
                                        {item.from} <FaArrowRight size={10} className="text-primary" /> {item.to}
                                        <Badge bg="light" text="dark" className="border fw-normal p-1" style={{ fontSize: '0.65rem' }}>{item.transport}</Badge>
                                    </span>
                                ) : <span className="text-wrap">{item.name}</span>}
                                {item.itemType === 'pack' && <Badge bg="info" className="prod-badge bg-opacity-10 text-info p-1" style={{ fontSize: '0.6rem' }}>PACK</Badge>}
                            </div>
                            <div className="prod-subtitle d-flex flex-wrap align-items-center gap-2 mt-1" style={{ fontSize: '0.8rem' }}>
                                {item.targetDate && <span className="d-flex align-items-center gap-1"><FaClock size={10} /> {new Date(item.targetDate).toLocaleDateString()}</span>}
                                {activeMode === 'daily' && <span>{categories.find(c => c.id === item.categoryId)?.label}</span>}
                            </div>
                            </div>
                        </div>
                        <div className="text-end ps-2">
                            <div className={`fw-bold prod-title ${item.completed ? 'opacity-50' : ''}`} style={{ fontSize: '0.9rem' }}>
                                {item.itemType === 'buy' ? formatCurrency(item.estimatedPrice) : '---'}
                            </div>
                            <Button variant="link" size="sm" className="text-danger p-0 border-0 mt-1 opacity-25 hover-opacity-100" onClick={() => deleteShoppingItem(item.id)}>
                                <FaTrash size={12}/>
                            </Button>
                        </div>
                      </div>

                      {/* Professional Booking & Log Toolbar */}
                      <div className="mt-3 d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-light">
                          <div className="d-flex gap-1 overflow-auto scrollbar-hidden">
                              {['planned', 'booked', 'paid'].map((status) => (
                                  <Badge 
                                    key={status}
                                    bg={item.bookingStatus === status ? (status === 'paid' ? 'success' : status === 'booked' ? 'warning' : 'secondary') : 'light'}
                                    text={item.bookingStatus === status ? 'white' : 'dark'}
                                    className={`cursor-pointer rounded-pill py-1 px-2 border d-flex align-items-center gap-1 x-small shadow-xs`}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s', opacity: item.completed ? 0.5 : 1 }}
                                    onClick={() => !item.completed && updateShoppingItem(item.id, { bookingStatus: status })}
                                  >
                                      {status === 'paid' ? <FaCheck size={8}/> : status === 'booked' ? <FaTicketAlt size={8}/> : <FaRegClock size={8}/>}
                                      {status.toUpperCase()}
                                  </Badge>
                              ))}
                          </div>

                          <AnimatePresence>
                              {item.completed && item.itemType === 'buy' && (
                                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                      <Button 
                                        variant="success" size="sm" 
                                        className="rounded-pill px-3 py-1 shadow-sm d-flex align-items-center gap-2 fw-bold"
                                        style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                        onClick={() => openTransactionModal({ item: item.name, amount: item.estimatedPrice, category: item.categoryId })}
                                      >
                                          <FaReceipt size={12}/> Log Real Spend
                                      </Button>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                    </div>
                ))
              ) : (
                <div className="text-center py-5">
                    {activeMode === 'daily' ? <FaShoppingBasket size={40} className="text-muted opacity-25 mb-3" /> : <FaSuitcase size={40} className="text-muted opacity-25 mb-3" />}
                    <p className="prod-subtitle small">Your list is empty.</p>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col lg={4}>
          <div className="row g-3">
              {/* Intelligent Route Presets (Suggestion) */}
              {activeMode === 'trip' && routePresets.length > 0 && (
                  <div className="col-12">
                      <Card className="prod-card p-3 border-0 shadow-sm" style={{ background: 'rgba(99, 102, 241, 0.03)' }}>
                          <h6 className="fw-bold prod-title mb-3 d-flex align-items-center gap-2 small"><FaHistory className="text-primary" /> Frequent Routes</h6>
                          <div className="d-flex flex-column gap-2">
                              {routePresets.map((r, i) => (
                                  <Button 
                                    key={i} variant="white" className="text-start border shadow-xs rounded-3 py-2 px-3 bg-white"
                                    onClick={() => addRoutePreset(r)}
                                  >
                                      <div className="d-flex justify-content-between align-items-center w-100">
                                          <div className="small fw-bold">{r.from} ➔ {r.to}</div>
                                          <Badge bg="primary" className="bg-opacity-10 text-primary x-small">{r.price}</Badge>
                                      </div>
                                      <div className="x-small text-muted">{r.transport}</div>
                                  </Button>
                              ))}
                          </div>
                      </Card>
                  </div>
              )}

              {activeMode === 'trip' && currentTrip && (
                  <div className="col-12">
                      <Card className="prod-card p-3 border-0 shadow-sm">
                          <h6 className="fw-bold prod-title mb-3 d-flex align-items-center gap-2 small"><FaUsers className="text-primary" /> Group Settings</h6>
                          <div className="d-flex align-items-center gap-3">
                              <Form.Label className="small text-muted mb-0 flex-shrink-0">Passengers:</Form.Label>
                              <Form.Control 
                                type="number" min="1" size="sm" className="prod-input rounded-pill text-center" 
                                style={{ width: '70px' }}
                                value={currentTrip.passengers || 1} 
                                onChange={(e) => updateTrip(selectedTripId, { passengers: Number(e.target.value) })}
                              />
                          </div>
                      </Card>
                  </div>
              )}

              <div className="col-12">
                  <Card className={`prod-card p-3 border-0 shadow-sm ${isSafeToSpend ? 'border-start border-4 border-success' : 'border-start border-4 border-danger'}`}>
                      <h6 className="fw-bold prod-title mb-3 small">Budget Summary</h6>
                      <div className="d-flex justify-content-between mb-2 x-small">
                          <span className="prod-subtitle">Total:</span>
                          <span className="fw-bold prod-title">{formatCurrency(totalEstimated)}</span>
                      </div>
                      {activeMode === 'trip' && (currentTrip?.passengers || 1) > 1 && (
                          <div className="d-flex justify-content-between mb-2 x-small p-2 bg-primary bg-opacity-10 rounded-3">
                              <span className="text-primary fw-bold">Per Head:</span>
                              <span className="text-primary fw-bold">{formatCurrency(costPerPerson)}</span>
                          </div>
                      )}
                      <div className="d-flex justify-content-between mb-2 x-small">
                          <span className="prod-subtitle">Balance:</span>
                          <span className="fw-bold text-success">{formatCurrency(globalStats.totalRealBalance)}</span>
                      </div>
                      <ProgressBar now={Math.min(100, (totalEstimated / globalStats.totalRealBalance) * 100)} variant={isSafeToSpend ? 'success' : 'danger'} style={{ height: '4px' }} className="rounded-pill mb-2" />
                      <p className="x-small mb-0 opacity-75">{isSafeToSpend ? '✓ Within balance' : '⚠ Over balance'}</p>
                  </Card>
              </div>

              {activeMode === 'trip' && (
                  <div className="col-12">
                      <Card className="prod-card p-3 shadow-sm">
                          <h6 className="fw-bold prod-title mb-3 d-flex align-items-center gap-2 small"><FaCar className="text-primary" /> Quick Fares</h6>
                          <div className="d-flex flex-row flex-lg-column gap-2 overflow-auto scrollbar-hidden">
                              {TRANSPORT_PRESETS.map((p, i) => (
                                  <Button 
                                    key={i} variant="light" className="text-start d-flex justify-content-between align-items-center rounded-3 py-2 px-3 border-0 bg-light flex-shrink-0 flex-lg-shrink-1"
                                    style={{ minWidth: '140px' }}
                                    onClick={() => addShoppingItem({ name: p.name, estimatedPrice: p.price, categoryId: 'Travel', tripId: selectedTripId, isRoute: false })}
                                  >
                                      <span className="x-small fw-bold d-flex align-items-center gap-2">{p.icon} {p.name}</span>
                                      <Badge bg="primary" className="bg-opacity-10 text-primary x-small">{p.price}</Badge>
                                  </Button>
                              ))}
                          </div>
                      </Card>
                  </div>
              )}
          </div>
        </Col>
      </Row>

      <Modal show={showAddTrip} onHide={() => setShowAddTrip(false)} centered contentClassName="prod-card border-0 mx-2">
          <Form onSubmit={handleAddTrip}>
              <Modal.Header closeButton className="border-0 p-4 pb-0"><Modal.Title className="prod-title fw-bold fs-5">New Trip Folder</Modal.Title></Modal.Header>
              <Modal.Body className="p-4">
                  <Form.Group className="mb-3">
                      <Form.Label className="prod-subtitle small fw-bold">Trip Name</Form.Label>
                      <Form.Control placeholder="e.g. Winter Tour" className="prod-input" onChange={e => setNewTrip({...newTrip, name: e.target.value})} required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                      <Form.Label className="prod-subtitle small fw-bold">Destination</Form.Label>
                      <Form.Control placeholder="Where to?" className="prod-input" onChange={e => setNewTrip({...newTrip, location: e.target.value})} />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="w-100 rounded-pill py-2 shadow-lg fw-bold">Create Folder</Button>
              </Modal.Body>
          </Form>
      </Modal>

      <Modal show={showAddItem} onHide={() => setShowAddItem(false)} centered size="lg" contentClassName="prod-card border-0 mx-2">
          <Form onSubmit={handleAddItem}>
              <Modal.Header closeButton className="border-0 p-4 pb-0">
                  <Modal.Title className="prod-title fw-bold fs-5">Add to {activeMode === 'daily' ? 'Shopping' : 'Trip'}</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                  <div className="bg-light p-1 rounded-pill d-flex mb-4 shadow-inner" style={{ width: 'fit-content' }}>
                      <Button variant={!newItem.isRoute ? 'primary' : 'transparent'} size="sm" className="rounded-pill px-3 py-1 x-small" onClick={() => setNewItem({...newItem, isRoute: false})}>Simple Item</Button>
                      <Button variant={newItem.isRoute ? 'primary' : 'transparent'} size="sm" className="rounded-pill px-3 py-1 x-small" onClick={() => setNewItem({...newItem, isRoute: true})}>Route Segment</Button>
                  </div>

                  {newItem.isRoute ? (
                      <Row className="g-3 mb-3">
                          <Col xs={6}>
                              <Form.Label className="prod-subtitle x-small fw-bold">From</Form.Label>
                              <Form.Control placeholder="Origin" className="prod-input" value={newItem.from} onChange={e => setNewItem({...newItem, from: e.target.value})} required />
                          </Col>
                          <Col xs={6}>
                              <Form.Label className="prod-subtitle x-small fw-bold">To</Form.Label>
                              <Form.Control placeholder="Destination" className="prod-input" value={newItem.to} onChange={e => setNewItem({...newItem, to: e.target.value})} required />
                          </Col>
                          <Col xs={12}>
                              <Form.Label className="prod-subtitle x-small fw-bold">Transport</Form.Label>
                              <Form.Select className="prod-input" value={newItem.transport} onChange={e => setNewItem({...newItem, transport: e.target.value})}>
                                  <option>Bus</option><option>Train</option><option>Plane</option><option>Launch</option><option>Uber/CNG</option><option>Other</option>
                              </Form.Select>
                          </Col>
                      </Row>
                  ) : (
                      <Form.Group className="mb-3">
                          <Form.Label className="prod-subtitle x-small fw-bold">Item/Activity Name</Form.Label>
                          <Form.Control placeholder="e.g. Dinner, Ticket" className="prod-input" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required={!newItem.isRoute} />
                      </Form.Group>
                  )}
                  
                  <Row className="mb-3">
                      <Col xs={6}>
                        <Form.Label className="prod-subtitle x-small fw-bold">Mode</Form.Label>
                        <Form.Select className="prod-input" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                            <option value="buy">Financial</option>
                            <option value="pack">Packing</option>
                        </Form.Select>
                      </Col>
                      <Col xs={6}>
                        {newItem.type === 'buy' && (
                            <>
                                <Form.Label className="prod-subtitle x-small fw-bold">Estimated Cost</Form.Label>
                                <Form.Control type="number" className="prod-input" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                            </>
                        )}
                      </Col>
                  </Row>

                  <Row className="mb-4 g-3">
                      <Col xs={6}>
                          <Form.Label className="prod-subtitle x-small fw-bold">Date</Form.Label>
                          <Form.Control type="date" className="prod-input" onChange={e => setNewItem({...newItem, targetDate: e.target.value})} />
                      </Col>
                      <Col xs={6}>
                          <Form.Label className="prod-subtitle x-small fw-bold">Category</Form.Label>
                          <Form.Select className="prod-input" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </Form.Select>
                      </Col>
                  </Row>

                  <Button type="submit" variant="primary" className="w-100 rounded-pill py-2 shadow-lg fw-bold">Save Plan</Button>
              </Modal.Body>
          </Form>
      </Modal>

      <ConfirmModal 
        show={showConfirmDelete}
        onHide={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteTrip}
        title="Delete Trip?"
        message={`Are you sure you want to delete "${currentTrip?.name}" and all its planned items? This cannot be undone.`}
      />

      <style>{`
        .no-caret::after { display: none !important; }
        .border-dashed { border-style: dashed !important; }
        .x-small { font-size: 0.7rem; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .hover-opacity-100:hover { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default SmartPlanner;
