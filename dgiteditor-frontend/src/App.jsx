import React, { useState, useEffect } from 'react';
import EditorPage from './components/EditorPage';
import { initAgent } from './components/agent';

export default function App() {
  const [repoName, setRepoName] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const connect = async () => {
      const connected = await initAgent();
      if (connected) setReady(true);
      else alert("Failed to connect to Plug wallet.");
    };
    connect();
  }, []);

  const openEditor = () => {
    if (repoName.trim() === '') {
      alert('Enter a repository name');
      return;
    }
    setSelectedRepo(repoName);
  };

  if (!ready) return <p>Connecting to Plug...</p>;

  return (
    <div>
      <h1>dGit Editor</h1>

      {!selectedRepo && (
        <div>
          <input 
            type="text" 
            placeholder="Repository Name" 
            value={repoName} 
            onChange={(e) => setRepoName(e.target.value)} 
          />
          <button onClick={openEditor}>Open Repository</button>
        </div>
      )}

      {selectedRepo && <EditorPage repoName={selectedRepo} />}
    </div>
  );
}
