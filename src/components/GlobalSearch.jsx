import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Form, InputGroup, ListGroup, Badge, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaTimes, FaWallet, FaTasks, FaStickyNote, 
  FaPlane, FaPiggyBank, FaHistory, FaPlus, FaKeyboard,
  FaArrowRight, FaLightbulb, FaClock, FaChevronLeft, FaFilter
} from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalSearch = ({ isMobile = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isFullMobile, setIsFullMobile] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { openTransactionModal } = useUI();

  const { meals, purchases, incomes, transfers, goals } = useApp();
  const { habits, todos, notes, shoppingList, trips } = useProductivity();

  // Categories for Filter Pills
  const filterPills = ['All', 'Finance', 'Tasks', 'Notes', 'Trips'];

  useEffect(() => {
    const saved = localStorage.getItem('smwallet_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveSearch = (term) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('smwallet_recent_searches', JSON.stringify(newRecent));
  };

  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
          <b key={i} className="text-primary">{part}</b> : part
        )}
      </span>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isFullMobile && searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFullMobile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isMobile) setIsFullMobile(true);
        inputRef.current?.focus();
      }
      if (showResults || isFullMobile) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, flattenedResults.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          handleNavigate(flattenedResults[selectedIndex]);
        } else if (e.key === 'Escape') {
          closeSearch();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, isFullMobile, selectedIndex]);

  const results = useMemo(() => {
    if (!searchTerm.trim() && !isFullMobile) return [];
    const term = searchTerm.toLowerCase();
    const matches = (str) => str?.toLowerCase().includes(term);

    const categories = [
      {
        title: 'Actions',
        icon: <FaPlus />,
        type: 'Actions',
        items: [
            { name: 'New Transaction', action: 'add_tx', type: 'Action' },
            { name: 'Add Trip Plan', action: 'add_trip', path: '/planner', type: 'Action' },
            { name: 'Create Goal', action: 'add_goal', path: '/goals', type: 'Action' },
            { name: 'View Trash', path: '/trash', type: 'Action' }
        ].filter(a => matches(a.name))
      },
      {
        title: 'Transactions',
        icon: <FaHistory />,
        type: 'Finance',
        items: [
          ...meals.map(m => ({ ...m, type: 'Meal', path: '/history' })),
          ...purchases.map(p => ({ ...p, type: 'Purchase', path: '/history' })),
          ...incomes.map(i => ({ ...i, type: 'Income', path: '/history' })),
          ...transfers.map(t => ({ ...t, type: 'Transfer', path: '/history' }))
        ].filter(item => matches(item.item || item.label || item.name || item.sourceName)).slice(0, 5)
      },
      {
        title: 'Productivity',
        icon: <FaTasks />,
        type: 'Tasks',
        items: [
          ...todos.map(t => ({ ...t, type: 'Task', path: '/productivity/todos' })),
          ...notes.map(n => ({ ...n, type: 'Note', path: '/productivity/notes' })),
          ...habits.map(h => ({ ...h, type: 'Habit', path: '/productivity/habits' }))
        ].filter(item => matches(item.title || item.content || item.name)).slice(0, 5)
      },
      {
        title: 'Planner & Goals',
        icon: <FaPlane />,
        type: 'Trips',
        items: [
          ...trips.map(t => ({ ...t, type: 'Trip', path: '/planner' })),
          ...goals.map(g => ({ ...g, type: 'Goal', path: '/goals' })),
          ...shoppingList.map(s => ({ ...s, type: 'Plan Item', path: '/planner' }))
        ].filter(item => matches(item.name || item.title || item.location)).slice(0, 5)
      }
    ];

    // Apply Filter Pills
    let filtered = categories;
    if (activeFilter !== 'All') {
        filtered = categories.filter(c => c.type === activeFilter || c.title === 'Actions');
    }

    return filtered.filter(c => c.items.length > 0);
  }, [searchTerm, activeFilter, isFullMobile, meals, purchases, incomes, transfers, goals, habits, todos, notes, shoppingList, trips]);

  const flattenedResults = useMemo(() => {
    return results.reduce((acc, cat) => [...acc, ...cat.items], []);
  }, [results]);

  const handleNavigate = (item) => {
    saveSearch(searchTerm);
    closeSearch();
    if (item.action === 'add_tx') {
        openTransactionModal();
    } else if (item.path) {
        navigate(item.path);
    }
  };

  const closeSearch = () => {
    setSearchTerm('');
    setShowResults(false);
    setIsFullMobile(false);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    if (isMobile) {
        setIsFullMobile(true);
    } else {
        setShowResults(true);
    }
  };

  const renderResults = () => (
    <>
        {/* Recent Searches */}
        {!searchTerm && recentSearches.length > 0 && (
            <div className="p-3">
                <div className="px-1 py-1 x-small fw-bold text-muted text-uppercase d-flex align-items-center gap-2 mb-2">
                    <FaClock size={10} /> Recent Searches
                </div>
                <div className="d-flex flex-wrap gap-2">
                    {recentSearches.map((s, i) => (
                        <Badge 
                            key={i} bg="light" text="dark" 
                            className="rounded-pill border fw-normal cursor-pointer py-2 px-3 transition-all shadow-sm"
                            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            onClick={() => setSearchTerm(s)}
                        >
                            {s}
                        </Badge>
                    ))}
                </div>
            </div>
        )}

        {/* Empty State Tips */}
        {!searchTerm && recentSearches.length === 0 && (
            <div className="p-5 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3" style={{ backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)' }}>
                    <FaLightbulb className="text-primary" size={32} />
                </div>
                <div className="fw-bold fs-5 mb-1" style={{ color: 'var(--text-primary)' }}>Quick Search</div>
                <p className="text-muted mb-0 small">Find transactions, notes, tasks and trips instantly.</p>
            </div>
        )}

        {/* No Results */}
        {searchTerm && results.length === 0 && (
            <div className="p-5 text-center text-muted">
                <div className="mb-3 opacity-25"><FaSearch size={48} /></div>
                <div className="fw-bold fs-5" style={{ color: 'var(--text-primary)' }}>No matches found</div>
                <div className="small">Try searching for something else.</div>
            </div>
        )}

        {results.map((category) => (
            <div key={category.title} className="mb-2">
            <div className="px-4 py-2 small fw-bold text-muted text-uppercase d-flex align-items-center gap-2" style={{ background: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
                {category.icon} {category.title}
            </div>
            <ListGroup variant="flush">
                {category.items.map((item, itemIdx) => {
                const globalIdx = flattenedResults.indexOf(item);
                return (
                    <ListGroup.Item
                    key={itemIdx}
                    action
                    active={selectedIndex === globalIdx}
                    onClick={() => handleNavigate(item)}
                    className="d-flex justify-content-between align-items-center border-0 px-4 py-3"
                    style={{ background: selectedIndex === globalIdx ? 'var(--primary-color)' : 'transparent', color: 'var(--text-primary)' }}
                    >
                    <div className="d-flex align-items-center gap-3">
                        <div className={`p-2 rounded-3`} style={{ 
                            width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: item.type === 'Action' ? 'var(--primary-color)' : 'var(--bg-color)',
                            color: item.type === 'Action' ? 'white' : 'var(--text-secondary)',
                            opacity: item.type === 'Action' ? 1 : 0.8
                        }}>
                            {item.type === 'Meal' && <FaHistory size={16} />}
                            {item.type === 'Note' && <FaStickyNote size={16} />}
                            {item.type === 'Task' && <FaTasks size={16} />}
                            {item.type === 'Trip' && <FaPlane size={16} />}
                            {item.type === 'Goal' && <FaPiggyBank size={16} />}
                            {item.type === 'Action' && <FaPlus size={16} />}
                            {item.type === 'Purchase' && <FaHistory size={16} />}
                            {item.type === 'Income' && <FaHistory size={16} />}
                            {item.type === 'Transfer' && <FaHistory size={16} />}
                            {item.type === 'Plan Item' && <FaPlane size={16} />}
                        </div>
                        <div>
                            <div className="fw-bold text-truncate" style={{ maxWidth: isMobile ? '160px' : '200px', color: selectedIndex === globalIdx ? 'white' : 'var(--text-primary)' }}>
                                <HighlightText text={item.item || item.label || item.name || item.title || item.sourceName || ''} highlight={searchTerm} />
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {item.amount && <small className="fw-bold" style={{ color: selectedIndex === globalIdx ? 'rgba(255,255,255,0.9)' : 'var(--success-color)' }}>{item.amount} BDT</small>}
                                {item.date && <small className="x-small opacity-75" style={{ color: selectedIndex === globalIdx ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>{item.date}</small>}
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Badge bg="light" text="dark" className="border fw-normal px-2 py-1 x-small text-uppercase" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                            {item.type}
                        </Badge>
                        <FaArrowRight size={10} className="text-muted opacity-25" />
                    </div>
                    </ListGroup.Item>
                );
                })}
            </ListGroup>
            </div>
        ))}
    </>
  );

  return (
    <div className={`global-search-container position-relative ${isMobile ? 'w-100' : ''}`} ref={searchRef}>
      {/* Search Input Bar */}
      <InputGroup className="search-bar shadow-sm rounded-pill overflow-hidden transition-all border-0" style={{ background: 'var(--input-bg)' }}>
        <InputGroup.Text className="bg-transparent border-0 ps-3 text-muted">
          <FaSearch size={14} className={searchTerm ? 'text-primary' : ''} />
        </InputGroup.Text>
        <Form.Control
          ref={inputRef}
          placeholder={isMobile ? "Tap to search anything..." : "Search commands (Ctrl + K)"}
          className="bg-transparent border-0 shadow-none py-2"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
            setSelectedIndex(-1);
          }}
          onFocus={handleFocus}
          style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}
        />
        {searchTerm && (
          <InputGroup.Text className="bg-transparent border-0 pe-3 text-muted cursor-pointer hover-text-danger" onClick={() => setSearchTerm('')}>
            <FaTimes size={12} />
          </InputGroup.Text>
        )}
      </InputGroup>

      {/* Desktop Results Dropdown */}
      {!isMobile && (
        <AnimatePresence>
            {showResults && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="search-results-overlay shadow-lg rounded-4 border overflow-hidden"
                style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                zIndex: 1100,
                marginTop: '8px',
                background: 'var(--nav-bg)',
                maxHeight: '450px',
                overflowY: 'auto',
                borderColor: 'var(--border-color)'
                }}
            >
                {renderResults()}
                {searchTerm && results.length > 0 && (
                    <div className="p-2 border-top bg-light text-center x-small text-muted d-flex align-items-center justify-content-center gap-2" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                        <FaKeyboard /> <span className="opacity-75">Use arrows to navigate, Enter to select</span>
                    </div>
                )}
            </motion.div>
            )}
        </AnimatePresence>
      )}

      {/* Full Screen Mobile Overlay */}
      <AnimatePresence>
        {isFullMobile && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="mobile-search-overlay position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 2000, background: 'var(--bg-color)' }}
          >
            <div className="d-flex flex-column h-100">
                {/* Mobile Search Header */}
                <div className="p-3 border-bottom shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1 position-relative">
                            <InputGroup className="rounded-pill border-0" style={{ background: 'var(--bg-color)' }}>
                                <InputGroup.Text className="bg-transparent border-0 ps-3"><FaSearch size={14} className="text-primary" /></InputGroup.Text>
                                <Form.Control 
                                    autoFocus
                                    placeholder="Search..."
                                    className="bg-transparent border-0 shadow-none py-2"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ color: 'var(--text-primary)', background: 'transparent' }}
                                />
                                {searchTerm && (
                                    <InputGroup.Text className="bg-transparent border-0" onClick={() => setSearchTerm('')}>
                                        <FaTimes size={14} className="text-muted" />
                                    </InputGroup.Text>
                                )}
                            </InputGroup>
                        </div>
                        <Button variant="link" className="text-decoration-none text-primary fw-bold p-0" onClick={closeSearch}>Cancel</Button>
                    </div>

                    {/* Filter Pills */}
                    <div className="d-flex gap-2 overflow-auto scrollbar-hidden mt-3 pb-1">
                        {filterPills.map(pill => (
                            <Badge 
                                key={pill}
                                bg={activeFilter === pill ? 'primary' : 'light'}
                                text={activeFilter === pill ? 'white' : 'dark'}
                                className={`rounded-pill px-3 py-2 border fw-normal cursor-pointer shadow-sm`}
                                style={{ 
                                    backgroundColor: activeFilter === pill ? 'var(--primary-color)' : 'var(--card-bg)',
                                    color: activeFilter === pill ? 'white' : 'var(--text-primary)',
                                    borderColor: 'var(--border-color)'
                                }}
                                onClick={() => setActiveFilter(pill)}
                            >
                                {pill}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Mobile Results Scroll Area */}
                <div className="flex-grow-1 overflow-auto">
                    <Container className="p-0">
                        {renderResults()}
                    </Container>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .search-results-overlay::-webkit-scrollbar { width: 4px; }
        .search-results-overlay::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .x-small { font-size: 0.7rem; }
        .transition-all { transition: all 0.2s ease-in-out; }
        .hover-text-danger:hover { color: #dc3545 !important; }
        .hover-bg-primary:hover { background-color: var(--bs-primary) !important; color: white !important; }
        .mobile-search-overlay { overscroll-behavior: contain; }
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
        .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default GlobalSearch;