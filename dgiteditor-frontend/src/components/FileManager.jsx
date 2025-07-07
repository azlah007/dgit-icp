import React, { useEffect, useState } from 'react';
import { dgit } from './agent';

export default function FileManager({ repoName, setCurrentFile, setFileContent, branch = 'master' }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (repoName) {
      fetchFiles();
    }
  }, [repoName, branch]);

  const fetchFiles = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const files = await dgit.listFiles(repoName);
      setFiles(files);
      if (files.length === 0) {
        setStatusMsg('No files found.');
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setStatusMsg('Error fetching files.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (fileName) => {
    try {
      const content = await dgit.getFileContent(repoName, branch, fileName);
      setCurrentFile(fileName);
      setFileContent(content ?? '');
    } catch (err) {
      console.error('Error fetching file content:', err);
      setFileContent('');
      setStatusMsg('Error loading file content.');
    }
  };

  return (
    <div>
      <h3>Files in branch: {branch}</h3>
      {loading ? (
        <p>Loading files...</p>
      ) : files.length === 0 ? (
        <p>{statusMsg || 'No files found.'}</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file}>
              {file} 
              <button onClick={() => openFile(file)}>Open</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
