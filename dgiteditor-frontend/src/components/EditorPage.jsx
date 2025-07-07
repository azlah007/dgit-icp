import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import BranchManager from './BranchManager';
import MergeManager from './MergeManager';
import TagManager from './TagManager';
import CommitHistory from './CommitHistory';
import { dgit } from '../agent';
import Editor from '@monaco-editor/react';

export default function EditorPage({ repoName }) {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [branch, setBranch] = useState('master');
  const [statusMsg, setStatusMsg] = useState('');
  const [principal, setPrincipal] = useState(null);

  useEffect(() => {
    connectPlug();
  }, []);

  const connectPlug = async () => {
    if (window.ic && window.ic.plug) {
      const connected = await window.ic.plug.isConnected();
      if (!connected) {
        try {
          await window.ic.plug.requestConnect();
        } catch (e) {
          alert('Plug connection denied.');
          return;
        }
      }
      const principalId = await window.ic.plug.getPrincipal();
      setPrincipal(principalId);
    } else {
      alert('Plug wallet not found. Please install it.');
    }
  };

  useEffect(() => {
    if (currentFile) {
      loadFileContent();
    }
  }, [currentFile, branch]);

  const loadFileContent = async () => {
    try {
      const content = await dgit.getFileContent(repoName, branch, currentFile);
      setFileContent(content ?? '');
    } catch (err) {
      console.error('Error loading file:', err);
      setFileContent('');
    }
  };

  const saveChanges = async () => {
    if (!principal || !currentFile) {
      alert('Missing Plug connection or no file selected.');
      return;
    }

    const message = prompt("Enter commit message:");
    if (!message) {
      setStatusMsg('Commit cancelled.');
      return;
    }

    setStatusMsg('Saving...');
    try {
      const fileList = [[currentFile, fileContent]];
      const res = await dgit.commitCode(repoName, branch, fileList, message, principal.toString());
      setStatusMsg(res);
    } catch (err) {
      console.error('Error saving changes:', err);
      setStatusMsg('Error saving changes.');
    }
  };

  return (
    <div>
      <h2>Repository: {repoName} | Branch: {branch}</h2>

      {!principal ? (
        <button onClick={connectPlug}>🔌 Connect Plug</button>
      ) : (
        <p>Connected as: {principal.toString()}</p>
      )}

      <BranchManager repoName={repoName} branch={branch} setBranch={setBranch} />
      <MergeManager repoName={repoName} branch={branch} />
      <TagManager repoName={repoName} />
      <FileTree
        repoName={repoName}
        branch={branch}
        setCurrentFile={setCurrentFile}
        setFileContent={setFileContent}
      />
      <CommitHistory repoName={repoName} branch={branch} />

      {currentFile && (
        <div>
          <h3>Editing: {currentFile}</h3>
          <Editor
            height="400px"
            defaultLanguage="javascript"
            value={fileContent}
            onChange={(value) => setFileContent(value ?? '')}
            theme="vs-dark"
          />
          <br />
          <button onClick={saveChanges}>💾 Save Changes</button>
          <p>{statusMsg}</p>

          {currentFile.endsWith('.html') && (
            <div>
              <h4>Live Preview:</h4>
              <iframe
                srcDoc={fileContent}
                style={{ width: '100%', height: '300px', border: '1px solid #ccc' }}
                title="Live Preview"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
