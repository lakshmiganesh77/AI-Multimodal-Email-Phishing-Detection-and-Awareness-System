import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const CustomTooltip = ({ title, usedFor, interpret }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, arrowOffset: 0, isTop: false });
    const iconRef = useRef(null);

    useEffect(() => {
        if (isHovered && iconRef.current) {
            const updateCoords = () => {
                if (!iconRef.current) return;
                const rect = iconRef.current.getBoundingClientRect();
                let left = rect.left + rect.width / 2;
                let arrowOffset = 0;
                const tooltipWidth = 300;
                const screenWidth = window.innerWidth;
                
                // Adjust horizontally if too close to edges
                if (left - tooltipWidth / 2 < 20) {
                    const diff = (tooltipWidth / 2) - left + 20;
                    left += diff;
                    arrowOffset = -diff;
                } else if (left + tooltipWidth / 2 > screenWidth - 20) {
                    const diff = (left + tooltipWidth / 2) - (screenWidth - 20);
                    left -= diff;
                    arrowOffset = diff;
                }

                // Adjust vertically if goes off bottom of screen
                let top = rect.bottom + 12;
                let isTop = false;
                if (top + 180 > window.innerHeight && rect.top - 180 > 0) {
                    top = rect.top - 12;
                    isTop = true;
                }

                setCoords({ top, left, arrowOffset, isTop });
            };

            updateCoords();

            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
            return () => {
                window.removeEventListener('scroll', updateCoords, true);
                window.removeEventListener('resize', updateCoords);
            };
        }
    }, [isHovered]);

    const tooltipContent = (
        <div 
            className="fixed bg-[#0f171e]/98 border border-[var(--cyan)]/30 rounded-lg p-4 z-[999999] shadow-[0_12px_40px_rgba(0,0,0,0.8)] cursor-default text-left normal-case tracking-normal backdrop-blur-md"
            style={{ 
                top: coords.isTop ? 'auto' : `${coords.top}px`, 
                bottom: coords.isTop ? `${window.innerHeight - coords.top}px` : 'auto',
                left: `${coords.left}px`, 
                width: '300px',
                transform: 'translate(-50%, 0)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className={`absolute w-3 h-3 bg-[#0f171e] border-[var(--cyan)]/30 ${coords.isTop ? 'bottom-[-7px] border-b border-r' : '-top-[7px] border-t border-l'} rotate-45`}
                style={{
                    left: `calc(50% + ${coords.arrowOffset}px)`,
                    transform: 'translate(-50%, 0) rotate(45deg)'
                }}
            />
            <div className="text-[var(--cyan)] text-[13px] font-bold mb-3 uppercase border-b border-[var(--cyan)]/20 pb-2 relative">
                {title}
            </div>
            <div className="mb-4 relative">
                <div className="text-white/60 text-[10px] font-bold mb-1.5 uppercase tracking-[0.5px]">What is this graph used for?</div>
                <div className="text-[var(--text-primary)] text-xs leading-relaxed font-normal">{usedFor}</div>
            </div>
            <div className="relative">
                <div className="text-white/60 text-[10px] font-bold mb-1.5 uppercase tracking-[0.5px]">How to measure & interpret</div>
                <div className="text-[var(--text-primary)] text-xs leading-relaxed font-normal">{interpret}</div>
            </div>
        </div>
    );

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            ref={iconRef}
        >
            <Info
                size={14}
                className={`ml-1.5 cursor-help transition-colors duration-200 ${isHovered ? 'text-[var(--cyan)]' : 'text-white/30'}`}
            />
            {isHovered && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
        </div>
    );
};

export default CustomTooltip;
