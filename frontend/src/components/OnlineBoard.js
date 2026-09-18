import React from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

function OnlineBoard({ onClose }) {
    return (
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 9999, 
            background: '#fff',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Верхняя панель с кнопкой закрытия */}
            <div style={{
                height: 48,
                background: '#fff',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                zIndex: 10000,
                position: 'relative'
            }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>📝 Онлайн доска</div>
                <button
                    onClick={onClose}
                    style={{
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#EF4444',
                        height: 34,
                        minWidth: 34,
                        padding: '0 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    ✕ Закрыть
                </button>
            </div>
            
            {/* Tldraw доска */}
            <div style={{ flex: 1, position: 'relative' }}>
                <Tldraw />
            </div>
        </div>
    );
}

export default OnlineBoard;