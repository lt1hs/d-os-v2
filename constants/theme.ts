export interface Theme {
    accentColor: string;
    tintColor: string;
    background: string;
    customBackgroundUrl?: string | null;
}

export const DEFAULT_THEME: Theme = {
    accentColor: 'Blue',
    tintColor: 'Slate',
    background: 'Aurora',
    customBackgroundUrl: null,
};

export interface ThemeSettings {
    accentColors: { name: string; hex: string; hoverHex: string; rgb: string; }[];
    tintColors: { name: string; rgb: string; }[];
    wallpapers: { name: string; url: string; }[];
}

export const THEME_SETTINGS: ThemeSettings = {
    accentColors: [
        { name: 'Blue', hex: '#3b82f6', hoverHex: '#2563eb', rgb: '59, 130, 246' },
        { name: 'Pink', hex: '#ec4899', hoverHex: '#db2777', rgb: '236, 72, 153' },
        { name: 'Green', hex: '#22c55e', hoverHex: '#16a34a', rgb: '34, 197, 94' },
        { name: 'Purple', hex: '#8b5cf6', hoverHex: '#7c3aed', rgb: '139, 92, 246' },
        { name: 'Orange', hex: '#f97316', hoverHex: '#ea580c', rgb: '249, 115, 22' },
        { name: 'Teal', hex: '#14b8a6', hoverHex: '#0d9488', rgb: '20, 184, 166' },
    ],
    tintColors: [
        { name: 'Slate', rgb: '30, 41, 59' }, // slate-800
        { name: 'Stone', rgb: '39, 39, 42' }, // stone-800
        { name: 'Sky', rgb: '14, 55, 96' },   // A darker sky blue
        { name: 'Rose', rgb: '86, 17, 51' },  // A darker rose
        { name: 'Mauve', rgb: '58, 26, 79' }, // A custom purple
    ],
    wallpapers: [
        {
            name: 'Aurora',
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Transparent pixel, relies on CSS background
        },
        {
            name: 'Cosmic Eye',
            url: 'https://i.imgur.com/8i262wM.jpeg',
        },
        {
            name: 'Planetary Path',
            url: 'https://i.imgur.com/pajW3sQ.jpeg',
        },
        {
            name: 'Vector Sunset',
            url: 'https://i.imgur.com/GZfAFsA.jpeg',
        },
        {
            name: 'Digital Sphere',
            url: 'https://i.imgur.com/V72cbM0.jpeg',
        },
        {
            name: 'Abstract',
            url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1887&auto=format&fit=crop',
        },
        {
            name: 'ASCII Matrix',
            url: 'dynamic-ascii',
        }
    ]
};