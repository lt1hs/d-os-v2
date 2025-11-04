import React from 'react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
}

export interface WindowState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Workspace {
  id: string;
  name: string;
  state: {
    openApps: string[];
    minimizedApps: Set<string>;
    maximizedApps: Set<string>;
    activeApp: string;
    windowStates: {
      [appId: string]: WindowState;
    };
  };
}

export interface WindowSnapHint {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type SystemAction = {
  action:
    | 'openApp'
    | 'closeApp'
    | 'minimizeApp'
    | 'maximizeApp'
    | 'createWorkspace'
    | 'switchWorkspace'
    | 'pinFolder'
    | 'unpinFolder'
    | 'setTheme'
    | 'lockScreen';
  payload: { [key: string]: any };
};

export type ShortcutAction =
  | 'openAgent'
  | 'lockScreen'
  | 'openApp:image-studio'
  | 'openApp:video-studio'
  | 'openApp:video-editor'
  | 'openApp:audio-studio'
  | 'openApp:design-studio'
  | 'openApp:copy-studio'
  | 'openApp:podcast-studio'
  | 'openApp:code-studio'
  | 'openApp:webapps-store'
  | 'openApp:browser'
  | 'openApp:todo'
  | 'openApp:file-explorer'
  | 'openApp:settings'
  | 'openApp:secret-terminal';

export type ShortcutMap = Record<ShortcutAction, string>;

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

export interface UserProfileState {
  name: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  appId: string;
  data: any;
  lastModified: number;
  thumbnail?: string;
}

export interface CreativeAppProps {
  projects: Project[];
  appId: string;
  activeProjectId: string | null;
  onSetActiveProjectId: (appId: string, projectId: string | null) => void;
  onUpdateProject: (projectId: string, data: any, thumbnail?: string) => void;
  onCreateProject: (appId: string, name: string, initialData: any) => string;
  onDeleteProject: (projectId: string) => void;
  appDefinition: AppDefinition;
}