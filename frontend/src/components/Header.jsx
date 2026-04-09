import React from 'react';
import { Menu, Search, HelpCircle, Settings, Grid3x3, Moon, Sun } from 'lucide-react';

const Header = ({ searchQuery, onSearchChange, darkMode, toggleTheme }) => {
    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-paper)',
            borderBottom: '1px solid var(--border-color)',
            height: '64px',
            transition: 'background-color 0.3s, border-color 0.3s'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px' }}>
                <button style={{
                    padding: '12px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#5f6368'
                }}>
                    <Menu size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                        alt="Gmail"
                        style={{ height: '32px', width: '32px' }}
                    />
                    <span style={{
                        fontSize: '22px',
                        color: 'var(--text-secondary)',
                        fontFamily: "'Product Sans', 'Roboto', 'Google Sans', sans-serif",
                        lineHeight: '24px',
                        position: 'relative',
                        top: '-2px',
                        letterSpacing: '-0.5px'
                    }}>
                        Gmail
                    </span>
                </div>
            </div>

            <div style={{ flex: 1, maxWidth: '720px', margin: '0 32px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--input-bg)',
                    padding: '12px 16px',
                    borderRadius: '24px',
                    transition: 'background-color 0.3s'
                }}>
                    <Search size={20} style={{ color: '#5f6368', marginRight: '12px' }} />
                    <input
                        type="text"
                        placeholder="Search mail"
                        value={searchQuery || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                            fontSize: '16px',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', justifyContent: 'flex-end' }}>
                <button onClick={toggleTheme} className="icon-btn" title="Toggle Theme">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="icon-btn"><HelpCircle size={20} /></button>
                <button className="icon-btn"><Settings size={20} /></button>
                <button className="icon-btn"><Grid3x3 size={20} /></button>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginLeft: '8px',
                    cursor: 'pointer'
                }}>A</div>
            </div>
        </header>
    );
};

export default Header;
