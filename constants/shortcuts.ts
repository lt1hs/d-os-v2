import { ShortcutAction, ShortcutMap } from '../types';
import { APPS, SYSTEM_TOOLS } from '../constants';

export const SHORTCUT_ACTIONS: { id: ShortcutAction; name: string }[] = [
  { id: 'openAgent', name: 'Open AI Agent' },
  { id: 'openSearch', name: 'Open Search' },
  { id: 'lockScreen', name: 'Lock Screen' },
  ...APPS.map(app => ({
    id: `openApp:${app.id}` as ShortcutAction,
    name: `Open ${app.name}`,
  })),
  ...SYSTEM_TOOLS.filter(app => app.id !== 'user-profile' && app.id !== 'trash').map(app => ({
    id: `openApp:${app.id}` as ShortcutAction,
    name: `Open ${app.name}`,
  })),
];


export const DEFAULT_SHORTCUTS: ShortcutMap = {
    'openAgent': 'mod+space',
    'openSearch': 'mod+k',
    'lockScreen': 'mod+l',
    'openApp:agent-studio': 'mod+alt+a',
    'openApp:image-studio': 'mod+1',
    'openApp:video-studio': 'mod+2',
    'openApp:video-editor': 'mod+3',
    'openApp:audio-studio': 'mod+4',
    'openApp:design-studio': 'mod+5',
    'openApp:copy-studio': 'mod+6',
    'openApp:podcast-studio': '',
    'openApp:code-studio': 'mod+shift+c',
    'openApp:webapps-store': 'mod+7',
    'openApp:browser': 'mod+b',
    'openApp:todo': 'mod+8',
    'openApp:media-player': 'mod+m',
    'openApp:file-explorer': '',
    // FIX: Add missing 'openApp:file-viewer' to satisfy ShortcutMap type.
    'openApp:file-viewer': '',
    'openApp:settings': '',
    'openApp:secret-terminal': 'mod+t',
};