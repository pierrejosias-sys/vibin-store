'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles.css';

// Mock job postings
const mockJobs = [
  { id: 1, title: 'Support Specialist', type: 'Full-Time', department: 'Support', status: 'active', applicants: 12, created: '2026-04-29' },
  { id: 2, title: 'Full-Stack Developer', type: 'Contract', department: 'Engineering', status: 'active', applicants: 8, created: '2026-04-29' },
  { id: 3, title: 'DevOps / Infrastructure', type: 'Project-Based', department: 'Engineering', status: 'active', applicants: 3, created: '2026-04-29' },
  { id: 4, title: 'Social Media Manager', type: 'Part-Time', department: 'Marketing', status: 'closed', applicants: 45, created: '2026-04-15' },
];

// Mock applications
const mockApplications = [
  { id: 1, job_id: 1, name: 'Alex Johnson', email: 'alex.j@email.com', portfolio: 'https://alexj.dev', experience: '2 years customer support at Shopify', status: 'pending', applied: '2026-04-29' },
  { id: 2, job_id: 1, name: 'Sam Rivera', email: 'sam.r@email.com', portfolio: 'https://samr.portfolio.com', experience: '3 years e-commerce support', status: 'reviewing', applied: '2026-04-28' },
  { id: 3, job_id: 2, name: 'Jordan Chen', email: 'jordan.c@email.com', portfolio: 'https://jordanc.dev', experience: '5 years React/Next.js, Supabase expert', status: 'pending', applied: '2026-04-29' },
  { id: 4, job_id: 3, name: 'Taylor Smith', email: 'taylor.s@email.com', portfolio: 'https://taylors.dev', experience: '4 years DevOps, Vercel certified', status: 'pending', applied: '2026-04-29' },
];

export default function RequisitionsPage() {
  const [jobs, setJobs] = useState(mockJobs);
  const [applications, setApplications] = useState(mockApplications);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('vibin_user');
    if (!savedUser) {
      router.push('/admin/login');
      return;
    }
    const user = JSON.parse(savedUser);
    if (!user.is_admin) {
      router.push('/login');
    }
  }, [router]);

  function handleStatusChange(appId, newStatus) {
    setApplications(applications.map(app =>
      app.id === appId ? { ...app, status: newStatus } : app
    ));
  }

  function handleJobStatus(jobId, newStatus) {
    setJobs(jobs.map(job =>
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
  }

  const filteredApps = selectedJob
    ? applications.filter(app => app.job_id === selectedJob.id && (filter === 'all' || app.status === filter))
    : applications.filter(app => filter === 'all' || app.status === filter);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <nav>
        <a href="/" className="logo">VIBIN ADMIN</a>
        <div className="nav-links">
          <a href="/admin">Dashboard</a>
          <a href="/admin/orders">Orders</a>
          <a href="/admin/support">Support</a>
          <a href="/admin/security">Security</a>
          <a href="/admin/requisitions" style={{color:'var(--coral)'}}>Requisitions</a>
        </div>
      </nav>

      <div style={{padding:'40px 60px', maxWidth:'1400px', margin:'0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
          <div>
            <h1 style={{fontFamily:'Anton, sans-serif', fontSize:'48px', textTransform:'uppercase', marginBottom:'8px'}}>
              Job <em style={{fontStyle:'italic', color:'var(--coral)'}}>Requisitions</em>
            </h1>
            <p style={{color:'var(--muted)', fontSize:'13px'}}>
              Manage job postings and review applications
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding:'12px 24px',
              background: showCreateForm ? 'var(--ink2)' : 'var(--coral)',
              color:'var(--cream)',
              border:'none',
              cursor:'pointer',
              fontFamily:'Manrope, sans-serif',
              fontSize:'12px',
              fontWeight:700,
              letterSpacing:'.1em',
              textTransform:'uppercase'
            }}
          >
            {showCreateForm ? 'Cancel' : '+ New Job'}
          </button>
        </div>

        {showCreateForm && (
          <div style={{background:'var(--ink2)', border:'1px solid var(--line)', padding:'24px', marginBottom:'32px'}}>
            <h3 style={{fontFamily:'Anton, sans-serif', fontSize:'24px', textTransform:'uppercase', marginBottom:'16px'}}>
              Create <em style={{fontStyle:'italic', color:'var(--coral)'}}>New Job</em>
            </h3>
            <form style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'16px'}}>
              <div>
                <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'10px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'8px'}}>Job Title</div>
                <input type="text" placeholder="e.g., Support Specialist" style={{width:'100%', padding:'10px', background:'var(--ink)', border:'1px solid var(--line)', color:'var(--cream)', fontSize:'13px'}} />
              </div>
              <div>
                <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'10px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'8px'}}>Type</div>
                <select style={{width:'100%', padding:'10px', background:'var(--ink)', border:'1px solid var(--line)', color:'var(--cream)', fontSize:'13px'}}>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Project-Based</option>
                </select>
              </div>
              <div>
                <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'10px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'8px'}}>Department</div>
                <select style={{width:'100%', padding:'10px', background:'var(--ink)', border:'1px solid var(--line)', color:'var(--cream)', fontSize:'13px'}}>
                  <option>Support</option>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Design</option>
                </select>
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <button type="submit" style={{
                  padding:'12px 24px',
                  background:'var(--coral)',
                  color:'var(--cream)',
                  border:'none',
                  cursor:'pointer',
                  fontFamily:'Manrope, sans-serif',
                  fontSize:'12px',
                  fontWeight:700,
                  letterSpacing:'.1em',
                  textTransform:'uppercase'
                }}>
                  Create Job Posting →
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'24px'}}>
          {/* Jobs List */}
          <div>
            <h3 style={{fontFamily:'JetBrains Mono, monospace', fontSize:'11px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--coral)', marginBottom:'16px'}}>
              Active Jobs ({jobs.filter(j => j.status === 'active').length})
            </h3>
            {jobs.map(job => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                style={{
                  background: selectedJob?.id === job.id ? 'var(--ink2)' : 'var(--ink3)',
                  border:'1px solid var(--line)',
                  padding:'16px',
                  marginBottom:'12px',
                  cursor:'pointer',
                  transition:'background .2s'
                }}
              >
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                  <span style={{fontWeight:600, fontSize:'14px'}}>{job.title}</span>
                  <span style={{
                    padding:'2px 8px',
                    background: job.status === 'active' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                    color: job.status === 'active' ? '#00ff00' : '#ff4444',
                    fontSize:'9px',
                    fontFamily:'JetBrains Mono, monospace',
                    textTransform:'uppercase',
                    letterSpacing:'.1em'
                  }}>
                    {job.status}
                  </span>
                </div>
                <div style={{fontSize:'11px', color:'var(--muted)'}}>
                  {job.type} · {job.department} · {job.applicants} applicants
                </div>
                <div style={{marginTop:'8px'}}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleJobStatus(job.id, job.status === 'active' ? 'closed' : 'active'); }}
                    style={{
                      padding:'4px 8px',
                      background:'transparent',
                      border:'1px solid var(--line)',
                      color:'var(--muted)',
                      cursor:'pointer',
                      fontSize:'10px',
                      fontFamily:'JetBrains Mono, monospace'
                    }}
                  >
                    {job.status === 'active' ? 'Close Job' : 'Reopen Job'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Applications */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
              <h3 style={{fontFamily:'JetBrains Mono, monospace', fontSize:'11px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--coral)'}}>
                {selectedJob ? `${selectedJob.title} Applications` : 'All Applications'} ({filteredApps.length})
              </h3>
              <div style={{display:'flex', gap:'8px'}}>
                {['all', 'pending', 'reviewing', 'accepted', 'rejected'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding:'6px 12px',
                      background: filter === f ? 'var(--coral)' : 'var(--ink2)',
                      color:'var(--cream)',
                      border:'1px solid var(--line)',
                      cursor:'pointer',
                      fontSize:'10px',
                      fontFamily:'JetBrains Mono, monospace',
                      textTransform:'uppercase',
                      letterSpacing:'.1em'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div style={{padding:'40px', textAlign:'center', color:'var(--muted)'}}>
                No applications found
              </div>
            ) : (
              filteredApps.map(app => (
                <div key={app.id} style={{background:'var(--ink2)', border:'1px solid var(--line)', padding:'20px', marginBottom:'12px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                    <div>
                      <div style={{fontWeight:600, fontSize:'15px', marginBottom:'4px'}}>{app.name}</div>
                      <div style={{fontSize:'12px', color:'var(--muted)'}}>{app.email}</div>
                    </div>
                    <span style={{
                      padding:'4px 8px',
                      background:
                        app.status === 'pending' ? 'rgba(255,255,0,0.1)' :
                        app.status === 'reviewing' ? 'rgba(0,100,255,0.1)' :
                        app.status === 'accepted' ? 'rgba(0,255,0,0.1)' :
                        'rgba(255,0,0,0.1)',
                      color:
                        app.status === 'pending' ? '#ffff00' :
                        app.status === 'reviewing' ? '#0064ff' :
                        app.status === 'accepted' ? '#00ff00' :
                        '#ff4444',
                      fontSize:'9px',
                      fontFamily:'JetBrains Mono, monospace',
                      textTransform:'uppercase',
                      letterSpacing:'.1em'
                    }}>
                      {app.status}
                    </span>
                  </div>

                  <div style={{fontSize:'12px', color:'var(--muted)', marginBottom:'12px', lineHeight:'1.6'}}>
                    <div><strong>Experience:</strong> {app.experience}</div>
                    {app.portfolio && <div><strong>Portfolio:</strong> <a href={app.portfolio} style={{color:'var(--coral)'}}>{app.portfolio}</a></div>}
                    <div><strong>Applied:</strong> {app.applied}</div>
                  </div>

                  <div style={{display:'flex', gap:'8px'}}>
                    {app.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusChange(app.id, 'reviewing')} style={{
                          padding:'6px 12px',
                          background:'var(--ink)',
                          color:'var(--cream)',
                          border:'1px solid var(--line)',
                          cursor:'pointer',
                          fontSize:'10px',
                          fontFamily:'JetBrains Mono, monospace',
                          textTransform:'uppercase'
                        }}>
                          Start Review
                        </button>
                        <button onClick={() => handleStatusChange(app.id, 'accepted')} style={{
                          padding:'6px 12px',
                          background:'rgba(0,255,0,0.15)',
                          color:'#00ff00',
                          border:'1px solid rgba(0,255,0,0.3)',
                          cursor:'pointer',
                          fontSize:'10px',
                          fontFamily:'JetBrains Mono, monospace',
                          textTransform:'uppercase'
                        }}>
                          Accept
                        </button>
                        <button onClick={() => handleStatusChange(app.id, 'rejected')} style={{
                          padding:'6px 12px',
                          background:'rgba(255,0,0,0.15)',
                          color:'#ff4444',
                          border:'1px solid rgba(255,0,0,0.3)',
                          cursor:'pointer',
                          fontSize:'10px',
                          fontFamily:'JetBrains Mono, monospace',
                          textTransform:'uppercase'
                        }}>
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'reviewing' && (
                      <>
                        <button onClick={() => handleStatusChange(app.id, 'accepted')} style={{
                          padding:'6px 12px',
                          background:'rgba(0,255,0,0.15)',
                          color:'#00ff00',
                          border:'1px solid rgba(0,255,0,0.3)',
                          cursor:'pointer',
                          fontSize:'10px',
                          fontFamily:'JetBrains Mono, monospace',
                          textTransform:'uppercase'
                        }}>
                          Accept ✓
                        </button>
                        <button onClick={() => handleStatusChange(app.id, 'rejected')} style={{
                          padding:'6px 12px',
                          background:'rgba(255,0,0,0.15)',
                          color:'#ff4444',
                          border:'1px solid rgba(255,0,0,0.3)',
                          cursor:'pointer',
                          fontSize:'10px',
                          fontFamily:'JetBrains Mono, monospace',
                          textTransform:'uppercase'
                        }}>
                          Reject ✗
                        </button>
                      </>
                    )}
                    <button style={{
                      padding:'6px 12px',
                      background:'transparent',
                      border:'1px solid var(--line)',
                      color:'var(--muted)',
                      cursor:'pointer',
                      fontSize:'10px',
                      fontFamily:'JetBrains Mono, monospace',
                      textTransform:'uppercase'
                    }}>
                      Email {app.name.split(' ')[0]} →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer><div className="foot-top">Vibin <em>Different.</em></div></footer>
    </>
  );
}
