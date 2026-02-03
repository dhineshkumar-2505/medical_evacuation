import { useState, useEffect } from 'react';
import { Search, Command } from 'lucide-react';
import './GlobalSearch.css';

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <button
                className="search-trigger-btn"
                onClick={() => setIsOpen(true)}
            >
                <Search size={16} />
                <span>Search everything...</span>
                <span className="kbd-shortcut">Ctrl K</span>
            </button>

            {isOpen && (
                <div className="search-overlay" onClick={() => setIsOpen(false)}>
                    <div className="search-modal" onClick={e => e.stopPropagation()}>
                        <div className="search-input-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search clinics, patients, or commands..."
                                autoFocus
                            />
                        </div>
                        <div className="search-footer">
                            <span>Type to start searching</span>
                            <div>
                                <span className="shortcut-badge">Esc</span> to close
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalSearch;
