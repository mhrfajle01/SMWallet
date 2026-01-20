import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Modal } from 'react-bootstrap';
import { useProductivity } from '../../context/ProductivityContext';
import { FaPlus, FaTrash, FaThumbtack, FaPalette } from 'react-icons/fa';
import { motion } from 'framer-motion';

const NotesApp = () => {
  const { notes, addNote, deleteNote, updateNote } = useProductivity();
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#ffffff' });

  const colors = ['#ffffff', '#fecaca', '#fde68a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#f5f5f5'];

  const handleAdd = (e) => {
    e.preventDefault();
    if (newNote.title.trim() || newNote.content.trim()) {
      addNote(newNote.title, newNote.content, newNote.color);
      setNewNote({ title: '', content: '', color: '#ffffff' });
      setShowModal(false);
    }
  };

  const togglePin = (note) => {
    updateNote(note.id, { pinned: !note.pinned });
  };

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Sticky Notes</h4>
        <Button variant="primary" onClick={() => setShowModal(true)} className="rounded-pill px-3">
          <FaPlus className="me-2" /> New Note
        </Button>
      </div>

      <Row className="g-3" data-masonry='{"percentPosition": true }'>
        {notes.sort((a,b) => (b.pinned === a.pinned ? 0 : b.pinned ? 1 : -1)).map(note => (
          <Col xs={12} md={6} lg={4} key={note.id}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: note.color }}>
                <Card.Body className="position-relative">
                    <div className="d-flex justify-content-between mb-2">
                        {note.title && <h6 className="fw-bold mb-0">{note.title}</h6>}
                        <div className="d-flex gap-2">
                             <Button 
                                size="sm" 
                                variant="link" 
                                className={`p-0 ${note.pinned ? 'text-primary' : 'text-muted opacity-25'}`}
                                onClick={() => togglePin(note)}
                             >
                                <FaThumbtack />
                             </Button>
                             <Button size="sm" variant="link" className="p-0 text-danger opacity-25 hover-opacity-100" onClick={() => deleteNote(note.id)}>
                                <FaTrash size={12} />
                             </Button>
                        </div>
                    </div>
                  <p className="small mb-0 text-dark opacity-75" style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
         <Modal.Body className="p-0 overflow-hidden rounded-3">
            <Form onSubmit={handleAdd} className="p-4" style={{ backgroundColor: newNote.color, transition: 'background-color 0.3s' }}>
                <Form.Control 
                    placeholder="Title" 
                    className="border-0 bg-transparent fw-bold fs-5 shadow-none px-0 mb-2"
                    value={newNote.title}
                    onChange={e => setNewNote({...newNote, title: e.target.value})}
                />
                <Form.Control 
                    as="textarea" 
                    rows={4} 
                    placeholder="Type your note here..." 
                    className="border-0 bg-transparent shadow-none px-0 mb-3"
                    value={newNote.content}
                    onChange={e => setNewNote({...newNote, content: e.target.value})}
                />
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-1">
                        {colors.map(c => (
                            <div 
                                key={c}
                                onClick={() => setNewNote({...newNote, color: c})}
                                className={`rounded-circle border ${newNote.color === c ? 'border-primary border-2' : 'border-0'}`}
                                style={{ width: '24px', height: '24px', backgroundColor: c, cursor: 'pointer' }}
                            />
                        ))}
                    </div>
                    <Button type="submit" variant="dark" className="rounded-pill px-4">Save</Button>
                </div>
            </Form>
         </Modal.Body>
      </Modal>
    </div>
  );
};

export default NotesApp;
