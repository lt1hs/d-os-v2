import React, { useState } from 'react';
import { generateSocialPost, repurposeContent, generateBlogPost } from '../../services/geminiService';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';


type Mode = 'post' | 'repurpose' | 'blog';

const platforms = ['X/Twitter', 'Instagram', 'LinkedIn', 'Facebook', 'TikTok'];

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const getInitialProjectData = () => ({
    mode: 'post',
    postPrompt: 'a new feature launch for our AI Studio',
    platform: 'X/Twitter',
    repurposeInput: 'AI Studio is a powerful platform for content creators...',
    blogTopic: 'The future of AI in content creation',
    generatedPost: null,
    repurposedContent: null,
    blogPost: null,
    activeRepurposeFormat: 'tweetThread',
});


export const CopyStudio: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;
    
    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;
    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        updateData({ generatedPost: null, repurposedContent: null, blogPost: null });

        try {
            if (projectData.mode === 'post') {
                const result = await generateSocialPost(projectData.postPrompt, projectData.platform);
                updateData({ generatedPost: result });
            } else if (projectData.mode === 'repurpose') {
                const result = await repurposeContent(projectData.repurposeInput);
                updateData({ repurposedContent: result, activeRepurposeFormat: Object.keys(result)[0] });
            } else if (projectData.mode === 'blog') {
                const result = await generateBlogPost(projectData.blogTopic);
                updateData({ blogPost: result });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!activeProject) {
        return (
            <ProjectSelectionScreen
                projects={projects.filter(p => p.appId === appId)}
                onCreate={(name) => {
                    const newId = onCreateProject(appId, name, getInitialProjectData());
                    onSetActiveProjectId(appId, newId);
                }}
                onOpen={(projectId) => onSetActiveProjectId(appId, projectId)}
                onDelete={onDeleteProject}
                appDefinition={appDefinition}
            />
        );
    }
    
    const renderLeftPanel = () => (
        <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow flex flex-col">
            {projectData.mode === 'post' && (
                <>
                    <h4 className="text-md font-semibold mb-2">Post Generator</h4>
                    <p className="text-xs text-white/60 mb-3">Generate a post for a specific social media platform.</p>
                    <label className="text-xs font-medium text-white/70">Topic</label>
                    <textarea value={projectData.postPrompt} onChange={e => updateData({ postPrompt: e.target.value })} placeholder="e.g., A new product launch" className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm h-24 resize-none"/>
                    <label className="text-xs font-medium text-white/70 mt-3">Platform</label>
                    <select value={projectData.platform} onChange={e => updateData({ platform: e.target.value })} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm">
                        {platforms.map(p => <option key={p} value={p} className="bg-gray-800">{p}</option>)}
                    </select>
                </>
            )}
            {projectData.mode === 'repurpose' && (
                 <>
                    <h4 className="text-md font-semibold mb-2">Content Repurposer Pro</h4>
                    <p className="text-xs text-white/60 mb-3">Input any asset and get 10+ formats back instantly.</p>
                    <label className="text-xs font-medium text-white/70">Source Content</label>
                    <textarea value={projectData.repurposeInput} onChange={e => updateData({ repurposeInput: e.target.value })} placeholder="Paste your article, script, or ideas here..." className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm h-full resize-none"/>
                </>
            )}
            {projectData.mode === 'blog' && (
                 <>
                    <h4 className="text-md font-semibold mb-2">Blog Studio</h4>
                    <p className="text-xs text-white/60 mb-3">Generate a complete, structured blog post from a single topic.</p>
                    <label className="text-xs font-medium text-white/70">Blog Topic</label>
                    <textarea value={projectData.blogTopic} onChange={e => updateData({ blogTopic: e.target.value })} placeholder="e.g., The future of AI in marketing" className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm h-24 resize-none"/>
                </>
            )}
            <button onClick={handleGenerate} disabled={isLoading} className="mt-auto w-full flex items-center justify-center gap-2 h-11 px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover disabled:bg-gray-500/50">
                {isLoading ? 'Generating...' : 'Generate Content'}
            </button>
        </div>
    );

    const renderCenterPanel = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <div className="text-center text-red-400 p-4">{error}</div>;

        let content = <p className="text-center text-white/50">Your generated content will appear here.</p>;

        if (projectData.mode === 'post' && projectData.generatedPost) {
            content = <p className="whitespace-pre-wrap">{projectData.generatedPost.post}</p>;
        } else if (projectData.mode === 'repurpose' && projectData.repurposedContent) {
            content = <p className="whitespace-pre-wrap">{projectData.repurposedContent[projectData.activeRepurposeFormat]}</p>;
        } else if (projectData.mode === 'blog' && projectData.blogPost) {
            content = <ReactMarkdown className="prose prose-invert max-w-none">{projectData.blogPost.content}</ReactMarkdown>;
        }
        
        return <div className="p-4 h-full overflow-y-auto">{content}</div>
    };
    
    const renderRightPanel = () => (
        <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow overflow-y-auto">
             {projectData.mode === 'post' && projectData.generatedPost && !isLoading && (
                <>
                    <h4 className="text-md font-semibold mb-2">Analysis</h4>
                    <div className="mb-4">
                        <p className="text-sm font-medium text-white/70">SEO Score</p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${projectData.generatedPost.seoScore || 0}%` }}></div>
                        </div>
                         <p className="text-right text-xs font-bold mt-1">{projectData.generatedPost.seoScore || 0} / 100</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white/70">Hashtag Suggestions</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(projectData.generatedPost.hashtags || []).map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-brand-blue/20 text-brand-blue text-xs font-medium rounded-full">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </>
            )}
            {projectData.mode === 'repurpose' && projectData.repurposedContent && !isLoading && (
                <>
                    <h4 className="text-md font-semibold mb-2">Repurposed Formats</h4>
                    <div className="flex flex-col gap-2">
                        {Object.keys(projectData.repurposedContent).map(key => (
                            <button 
                                key={key}
                                onClick={() => updateData({ activeRepurposeFormat: key })}
                                className={`w-full p-2 text-left rounded-md text-sm font-medium transition-colors ${projectData.activeRepurposeFormat === key ? 'bg-brand-blue' : 'bg-white/10 hover:bg-brand-blue/50'}`}
                            >
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </>
            )}
            {!isLoading && !projectData.generatedPost && !projectData.repurposedContent && <p className="text-sm text-white/50">Analysis and tools will appear here.</p>}
        </div>
    );

    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-12 left-2 text-xs px-2 py-1 bg-black/30 rounded-full z-10 hover:bg-black/50">&lt; Back to Projects</button>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                <h3 className="text-lg font-semibold pt-6">{activeProject.name}</h3>
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button onClick={() => updateData({ mode: 'post' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'post' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Post</button>
                    <button onClick={() => updateData({ mode: 'repurpose' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'repurpose' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Repurpose</button>
                    <button onClick={() => updateData({ mode: 'blog' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'blog' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Blog</button>
                </div>
                {renderLeftPanel()}
            </div>
            <div className="w-1/2 flex flex-col bg-black/20 rounded-lg border border-border-color">
                <div className="p-2 border-b border-border-color">
                    <h4 className="text-md font-semibold">
                        {projectData.mode === 'post' && 'Generated Post'}
                        {projectData.mode === 'repurpose' && 'Repurposed Content'}
                        {projectData.mode === 'blog' && (projectData.blogPost?.title || 'Generated Blog Post')}
                    </h4>
                </div>
                {renderCenterPanel()}
            </div>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                {renderRightPanel()}
            </div>
        </div>
    );
};
