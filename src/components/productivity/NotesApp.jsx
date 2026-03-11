import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { useProductivity } from '../../context/ProductivityContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaStickyNote, FaSearch, FaThumbtack } from 'react-icons/fa';
import '../../Productivity.css';

const NotesApp = () => {
  const { notes, addNote, updateNote, deleteNote } = useProductivity();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#ffffff' });

  const colors = [
    { name: 'Default', value: 'var(--prod-card-bg)' },
    { name: 'Blue', value: 'rgba(59, 130, 246, 0.1)' },
    { name: 'Red', value: 'rgba(239, 68, 68, 0.1)' },
    { name: 'Green', value: 'rgba(16, 185, 129, 0.1)' },
    { name: 'Purple', value: 'rgba(139, 92, 246, 0.1)' },
    { name: 'Yellow', value: 'rgba(245, 158, 11, 0.1)' },
  ];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    addNote(newNote.title, newNote.content, newNote.color);
    setNewNote({ title: '', content: '', color: '#ffffff' });
    setShowAdd(false);
  };

  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const NoteCard = ({ note }) => (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="prod-card h-100 border-0" style={{ background: note.color }}>
            <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold prod-title mb-0 line-clamp-2">{note.title || 'Untitled'}</h5>
                    <div className="d-flex gap-2">
                        <Button 
                            variant="link" 
                            className={`p-0 border-0 shadow-none ${note.pinned ? 'text-primary' : 'text-muted opacity-25'}`}
                            onClick={() => updateNote(note.id, { pinned: !note.pinned })}
                        >
                            <FaThumbtack />
                        </Button>
                    </div>
                </div>
                <p className="prod-subtitle flex-grow-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {note.content}
                </p>
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-dark border-opacity-10">
                    <small className="prod-subtitle opacity-50" style={{ fontSize: '0.7rem' }}>
                        {note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </small>
                    <FaTrash 
                        className="text-danger opacity-25 cursor-pointer" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => deleteNote(note.id)}
                    />
                </div>
            </Card.Body>
        </Card>
    </motion.div>
  );

  return (
    <div className="prod-container pb-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
            <h2 className="prod-title mb-1">Notes</h2>
            <p className="prod-subtitle mb-0">Capture ideas, never forget.</p>
        </div>
        
        <div className="d-flex gap-2 w-100 w-md-auto">
            <div className="position-relative flex-grow-1" style={{ minWidth: '200px' }}>
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted opacity-50" />
                <Form.Control 
                    placeholder="Search notes..." 
                    className="prod-input ps-5"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button variant="primary" className="rounded-pill px-4 shadow-sm flex-shrink-0" onClick={() => setShowAdd(true)}>
                <FaPlus className="me-2" /> New Note
            </Button>
        </div>
      </div>

      {pinnedNotes.length > 0 && (
          <div className="mb-5">
              <small className="prod-subtitle fw-bold text-uppercase d-block mb-3 letter-spacing-1">Pinned</small>
              <Row className="g-4">
                  {pinnedNotes.map(note => (
                      <Col key={note.id} xs={12} md={6} lg={4} xl={3}>
                          <NoteCard note={note} />
                      </Col>
                  ))}
              </Row>
          </div>
      )}

      {otherNotes.length > 0 && (
          <div>
              {pinnedNotes.length > 0 && <small className="prod-subtitle fw-bold text-uppercase d-block mb-3 letter-spacing-1">Others</small>}
              <Row className="g-4">
                  {otherNotes.map(note => (
                      <Col key={note.id} xs={12} md={6} lg={4} xl={3}>
                          <NoteCard note={note} />
                      </Col>
                  ))}
              </Row>
          </div>
      )}

      {filteredNotes.length === 0 && (
          <div className="text-center py-5">
              <FaStickyNote size={48} className="text-muted opacity-25 mb-3" />
              <h5 className="prod-title opacity-50">No notes found</h5>
              <p className="prod-subtitle">{search ? 'Try a different search term' : 'Start your first note today!'}</p>
          </div>
      )}

      {/* Add Note Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
          <Form onSubmit={handleAdd}>
              <Modal.Body className="p-4" style={{ background: newNote.color }}>
                  <Form.Control 
                    placeholder="Title" 
                    className="prod-input fs-4 fw-bold border-0 bg-transparent mb-2 shadow-none px-0"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    autoFocus
                  />
                  <Form.Control 
                    as="textarea"
                    rows={8}
                    placeholder="Take a note..." 
                    className="prod-input border-0 bg-transparent shadow-none px-0 fs-5"
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    required
                  />
                  
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-4 pt-3 border-top border-dark border-opacity-10">
                      <div className="d-flex gap-2">
                          {colors.map(c => (
                              <div 
                                key={c.name}
                                className={`rounded-circle cursor-pointer border ${newNote.color === c.value ? 'border-primary border-2' : 'border-dark border-opacity-10'}`}
                                style={{ width: '24px', height: '24px', background: c.value, cursor: 'pointer' }}
                                onClick={() => setNewNote({...newNote, color: c.value})}
                                title={c.name}
                              />
                          ))}
                      </div>
                      <div className="d-flex gap-2">
                          <Button variant="light" className="rounded-pill px-4" onClick={() => setShowAdd(false)}>Cancel</Button>
                          <Button type="submit" variant="primary" className="rounded-pill px-4 shadow-sm">Save Note</Button>
                      </div>
                  </div>
              </Modal.Body>
          </Form>
      </Modal>

      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .letter-spacing-1 { letter-spacing: 0.05rem; }
      `}</style>
    </div>
  );
};

export default NotesApp;
