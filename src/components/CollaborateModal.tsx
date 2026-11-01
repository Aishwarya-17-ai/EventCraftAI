/**
 * EventCraft AI - Collaborative Session Modal
 * Invite team members, configure view/edit roles, view live activity updates,
 * and share unique event links.
 */

import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  UserPlus,
  Shield,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { EventActivity, EventDocument } from '../lib/types';
import { addCollaboratorToEvent, addEventActivity } from '../lib/firebase';

interface CollaborateModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDocument;
  activities: EventActivity[];
  currentUserId?: string;
  isOwner: boolean;
}

export const CollaborateModal: React.FC<CollaborateModalProps> = ({
  isOpen,
  onClose,
  event,
  activities,
  currentUserId,
  isOwner,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [copied, setCopied] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?event=${event.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatusMsg('Link: ' + shareUrl);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setStatusMsg('');
    try {
      await addCollaboratorToEvent(event.id, email, inviteRole);
      await addEventActivity(event.id, `Invited ${email} as ${inviteRole}`);
      setInviteEmail('');
      setStatusMsg(`Successfully added ${email} as ${inviteRole}!`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.debug('Failed to invite:', err);
      setStatusMsg('Could not save collaborator. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const note = newNote.trim();
    if (!note) return;

    try {
      await addEventActivity(event.id, note);
      setNewNote('');
    } catch (err) {
      console.debug('Failed to post activity:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-modal-title"
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '24px',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="icon-button"
          style={{ position: 'absolute', top: '16px', right: '16px' }}
          aria-label="Close collaboration settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 id="collab-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Live Collaboration & Sharing
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Work with partners, co-hosts, or clients in real time
            </p>
          </div>
        </div>

        {/* Share Link */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
            Event Share Link
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="form-input"
              style={{ fontSize: '0.85rem' }}
            />
            <button onClick={handleCopyLink} className="btn-secondary" style={{ flexShrink: 0 }}>
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
            Invite Collaborator
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px' }}>
            <input
              type="email"
              placeholder="collaborator@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="form-input"
              required
              style={{ fontSize: '0.85rem' }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
              className="form-select"
              style={{ width: 'auto', fontSize: '0.85rem' }}
            >
              <option value="editor">Editor (Can edit)</option>
              <option value="viewer">Viewer (Read only)</option>
            </select>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !inviteEmail.trim()}>
              <UserPlus className="w-4 h-4" />
              <span>Invite</span>
            </button>
          </div>
          {statusMsg && (
            <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '6px', fontWeight: 600 }}>
              {statusMsg}
            </p>
          )}
        </form>

        {/* Team Members List */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield className="w-4 h-4 text-primary" />
            <span>Members with Access</span>
          </h4>
          <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg)',
                fontSize: '0.85rem',
              }}
            >
              <span>{event.ownerEmail || 'Owner (You)'}</span>
              <span className="badge-upcoming">Owner</span>
            </div>
            {(event.editors || []).map((email, idx) => (
              <div
                key={`ed-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  fontSize: '0.85rem',
                }}
              >
                <span>{email}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>Editor</span>
              </div>
            ))}
            {(event.viewers || []).map((email, idx) => (
              <div
                key={`vw-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  fontSize: '0.85rem',
                }}
              >
                <span>{email}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Viewer</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Activity & Collaborative Notes Feed */}
        <div style={{ flex: 1, minHeight: '140px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageCircle className="w-4 h-4 text-accent" />
            <span>Live Session Activity & Notes</span>
          </h4>
          <div
            style={{
              flex: 1,
              maxHeight: '140px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {activities.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
                No activity yet. Leave a note below for collaborators.
              </p>
            ) : (
              activities.map((act) => (
                <div key={act.id} style={{ fontSize: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <strong>{act.userEmail}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock className="w-3 h-3" />
                      {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text)', marginTop: '2px' }}>{act.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick note input */}
          <form onSubmit={handlePostNote} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input
              type="text"
              placeholder="Add a real-time note for collaborators..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.85rem', height: '38px', minHeight: '38px' }}
            />
            <button type="submit" className="btn-secondary" style={{ height: '38px', minHeight: '38px', padding: '0 12px' }}>
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
