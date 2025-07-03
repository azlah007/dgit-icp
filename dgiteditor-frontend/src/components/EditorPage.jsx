import React, { useState, useEffect } from 'react';
import FileManager from './FileManager';
import BranchManager from './BranchManager';
import TagManager from './TagManager';

export default function EditorPage({ repoName }) {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  return (
    <div>
      <h2>Repository: {repoName}</h2>
      <BranchManager repoName={repoName} />
      <TagManager repoName={repoName} />
      <FileManager 
        repoName={repoName} 
        setCurrentFile={setCurrentFile} 
        setFileContent={setFileContent} 
      />
      
      {currentFile && (
        <div>
          <h3>Editing: {currentFile}</h3>
          <textarea 
            rows="15" 
            cols="80" 
            value={fileContent} 
            onChange={(e) => setFileContent(e.target.value)}
          />
          <button onClick={() => alert('Save functionality will go here.')}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
