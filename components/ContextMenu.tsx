import React, { useEffect, useRef } from 'react';
import { ContextMenuItem } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-48 bg-gray-800/90 backdrop-blur-md rounded-md shadow-lg border border-border-color py-1"
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.preventDefault()} // Prevent stacking context menus
    >
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-white/90 hover:bg-brand-blue flex items-center gap-2"
            >
              {item.icon}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
