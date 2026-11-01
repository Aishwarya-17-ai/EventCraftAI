/**
 * EventCraft AI - Adaptive Timeline Tab
 * Displays dynamic countdown banner, Today & Event Day markers,
 * priority task listings, and accessible "At risk" badges with quick alternatives.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AdaptiveTimeline, TimelineMilestone, TimelineTask } from '../lib/types';
import { formatDate } from '../lib/formatters';

interface TimelineTabProps {
  timeline: AdaptiveTimeline;
  eventDate: string;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ timeline, eventDate }) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const { daysLeft, planStyle, milestones, atRiskCount } = timeline;

  return (
    <section
      role="tabpanel"
      id="panel-timeline"
      aria-labelledby="tab-timeline"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Dynamic Timeline Banner: "X days left - [Plan style]" */}
      <div className="timeline-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
              {daysLeft} days left — {planStyle}
            </h3>
            {atRiskCount > 0 && (
              <span className="badge-at-risk" role="status" aria-label={`${atRiskCount} tasks at risk due to tight lead time`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{atRiskCount} at risk</span>
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Adaptive planning schedule computed from <strong>Today</strong> to target date{' '}
            <strong>{formatDate(eventDate)}</strong>. Never schedules tasks in the past.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="timeline-marker-today">
            <Clock className="w-3.5 h-3.5" />
            <span>Today</span>
          </span>
          <span className="timeline-marker-event">
            <Calendar className="w-3.5 h-3.5" />
            <span>Event Day</span>
          </span>
        </div>
      </div>

      {/* Milestones and Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {milestones.map((m: TimelineMilestone) => {
          return (
            <div
              key={m.id}
              className="card"
              style={{
                borderLeft: m.isEventDay
                  ? '4px solid var(--primary)'
                  : m.isToday
                  ? '4px solid var(--sage)'
                  : '4px solid var(--border)',
              }}
            >
              {/* Milestone Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {m.timeframe}
                    </span>
                    {m.isToday && (
                      <span className="timeline-marker-today" aria-label="Milestone starts Today">
                        Today
                      </span>
                    )}
                    {m.isEventDay && (
                      <span className="timeline-marker-event" aria-label="Final Event Day Milestone">
                        Event Day
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                    {m.title}
                  </h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(m.targetDate)}</span>
                  </span>

                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      backgroundColor: 'var(--bg)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {m.daysRemaining === 0
                      ? 'Today'
                      : m.daysRemaining === 1
                      ? 'Tomorrow'
                      : `in ${m.daysRemaining} days`}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {m.tasks.map((task: TimelineTask) => {
                  const isChecked = !!completedTasks[task.id];
                  return (
                    <li
                      key={task.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isChecked ? 'var(--bg)' : 'transparent',
                        border: '1px solid',
                        borderColor: isChecked
                          ? 'var(--border)'
                          : task.isAtRisk
                          ? 'rgba(185, 28, 28, 0.25)'
                          : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id={`chk-${task.id}`}
                          checked={isChecked}
                          onChange={() => toggleTask(task.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            marginTop: '2px',
                            cursor: 'pointer',
                            accentColor: 'var(--primary)',
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <label
                              htmlFor={`chk-${task.id}`}
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                color: isChecked ? 'var(--text-muted)' : 'var(--text)',
                                textDecoration: isChecked ? 'line-through' : 'none',
                              }}
                            >
                              {task.title}
                            </label>

                            {/* Priority Indicator */}
                            <span className={`priority-pill priority-${task.priority}`}>
                              {task.priority}
                            </span>

                            {/* At Risk Badge (Text + Icon, Not Color Alone) */}
                            {task.isAtRisk && !isChecked && (
                              <span
                                className="badge-at-risk"
                                role="status"
                                aria-label={`Task at risk: requires ${task.minLeadDays} days lead time but only ${daysLeft} days remaining`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>At risk</span>
                              </span>
                            )}
                          </div>

                          {/* Due Date & Lead time info */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                            }}
                          >
                            <span>Due: {formatDate(task.dueDate)}</span>
                            <span>•</span>
                            <span>
                              {task.daysRemaining === 0 ? 'Today' : `in ${task.daysRemaining} days`}
                            </span>
                            <span>•</span>
                            <span>Min lead: {task.minLeadDays}d</span>
                          </div>

                          {/* Quick Alternative Fallback Box */}
                          {task.isAtRisk && task.quickAlternative && (
                            <div className="quick-alt-box" role="note">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--sage)', marginBottom: '2px' }}>
                                <Zap className="w-3.5 h-3.5" />
                                <span>Fast-Track Alternative:</span>
                              </div>
                              <span>{task.quickAlternative}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};
