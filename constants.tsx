

import React from 'react';
import { AppDefinition } from './types';

export const AIStudioLogo = () => <i className="fi fi-rr-transform" />;

export const LockIcon = () => <i className="fi fi-rr-lock" />;

export const APPS: AppDefinition[] = [
    {
        id: 'image-studio',
        name: 'Image Studio',
        icon: <i className="fi fi-rr-images" />,
    },
    {
        id: 'video-studio',
        name: 'Video Studio',
        icon: <i className="fi fi-rr-film" />,
    },
    {
        id: 'video-editor',
        name: 'AI Video Editor',
        icon: <i className="fi fi-rr-scissors" />,
    },
    {
        id: 'audio-studio',
        name: 'Audio & Voice Studio',
        icon: <i className="fi fi-rr-waveform-path" />,
    },
     {
        id: 'design-studio',
        name: 'AI Design Studio',
        icon: <i className="fi fi-rr-palette" />,
    },
    {
        id: 'copy-studio',
        name: 'AI Copy & Content',
        icon: <i className="fi fi-rr-feather" />,
    },
    {
        id: 'podcast-studio',
        name: 'Podcast Studio',
        icon: <i className="fi fi-rr-microphone" />,
    },
    {
        id: 'webapps-store',
        name: 'WebApps Store',
        icon: <i className="fi fi-rr-apps" />,
    },
    {
        id: 'browser',
        name: 'Web Browser',
        icon: <i className="fi fi-rr-globe" />,
    },
    {
        id: 'todo',
        name: 'To-Do',
        icon: <i className="fi fi-rr-list-check" />,
    },
];

export const SYSTEM_TOOLS: AppDefinition[] = [
    {
        id: 'user-profile',
        name: 'User Profile',
        icon: <i className="fi fi-rr-user" />,
    },
    {
        id: 'file-explorer',
        name: 'File Explorer',
        icon: <i className="fi fi-rr-folder" />,
    },
    {
        id: 'settings',
        name: 'Settings',
        icon: <i className="fi fi-rr-settings-sliders" />,
    },
    {
        id: 'secret-terminal',
        name: 'Secret Terminal',
        icon: <i className="fi fi-rr-skull" />,
    },
    {
        id: 'trash',
        name: 'Trash',
        icon: <i className="fi fi-rr-trash" />,
    }
];

export const WEB_APPS = [
    { id: 'instagram', name: 'Instagram', category: 'Social Media', description: 'Connect to schedule posts and analyze performance.', icon: <i className="fi fi-rr-camera" /> },
    { id: 'facebook', name: 'Facebook', category: 'Social Media', description: 'Manage your pages and schedule content.', icon: <i className="fi fi-rr-thumbs-up" /> },
    { id: 'linkedin', name: 'LinkedIn', category: 'Social Media', description: 'Publish articles and engage with your professional network.', icon: <i className="fi fi-rr-briefcase" /> },
    { id: 'slack', name: 'Slack', category: 'Productivity', description: 'Send content and notifications to your Slack channels.', icon: <i className="fi fi-rr-comment-alt" /> },
    { id: 'notion', name: 'Notion', category: 'Productivity', description: 'Sync your content calendar with your Notion database.', icon: <i className="fi fi-rr-notebook" /> },
    { id: 'google-drive', name: 'Google Drive', category: 'Productivity', description: 'Access your assets directly from Google Drive.', icon: <i className="fi fi-rr-cloud" /> },
    { id: 'figma', name: 'Figma', category: 'Design', description: 'Import your Figma designs and assets.', icon: <i className="fi fi-rr-pencil-ruler" /> },
    { id: 'canva', name: 'Canva', category: 'Design', description: 'Seamlessly move between Canva and AI Studio.', icon: <i className="fi fi-rr-picture" /> },
];

// File System Data
export type SyncStatus = 'local' | 'cloud' | 'syncing';
export type FileType = 'image' | 'video' | 'document';

export interface CloudFile {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  size: string;
  modified: string;
  syncStatus: SyncStatus;
  url?: string;
}

export interface CloudFolder {
  id: string;
  name: string;
  parentId: string | null;
  syncStatus: SyncStatus;
}

export const mockFolders: CloudFolder[] = [
    { id: 'root', name: 'Cloud Drive', parentId: null, syncStatus: 'local' },
    { id: '1', name: 'Generated Images', parentId: 'root', syncStatus: 'local' },
    { id: '2', name: 'Generated Videos', parentId: 'root', syncStatus: 'cloud' },
    { id: '3', name: 'Social Posts', parentId: 'root', syncStatus: 'syncing' },
    { id: '4', name: 'Stock Photos', parentId: '1', syncStatus: 'local' },
];

export const mockFiles: CloudFile[] = [
    { id: 'f1', name: 'futuristic-city.jpeg', type: 'image', parentId: '1', size: '2.1 MB', modified: '2023-10-27', syncStatus: 'local', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg' },
    { id: 'f2', name: 'cat-hologram.mp4', type: 'video', parentId: '2', size: '15.8 MB', modified: '2023-10-26', syncStatus: 'cloud', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
    { id: 'f3', name: 'product-launch.jpeg', type: 'image', parentId: '1', size: '3.4 MB', modified: '2023-10-25', syncStatus: 'syncing', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg' },
    { id: 'f4', name: 'influencer-collab.jpeg', type: 'image', parentId: '4', size: '1.9 MB', modified: '2023-10-24', syncStatus: 'local', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg' },
    { id: 'f5', name: 'summer-sale.mp4', type: 'video', parentId: '2', size: '22.3 MB', modified: '2023-10-23', syncStatus: 'cloud', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
];