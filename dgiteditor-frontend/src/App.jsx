import React, { useState } from 'react';
import EditorPage from './EditorPage';

export default function App() {
  const [repoName, setRepoName] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);

  const openEditor = () => {
    if (repoName.trim() === '') {
      alert('Enter a repository name');
      return;
    }
    setSelectedRepo(repoName);
  };

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
