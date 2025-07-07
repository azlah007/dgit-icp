import React, { useEffect, useState } from 'react';
import { dgit } from '../agent';

export default function FileTree({ repoName, setCurrentFile, setFileContent, branch }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    if (repoName) {
      fetchFiles();
    }
  }, [repoName, branch]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await dgit.listFiles(repoName);
      setFiles(res);
    } catch (err) {
      console.error('Error fetching files:', err);
      setFiles([]);
    }
    setLoading(false);
  };

  const openFile = async (fileName) => {
    try {
      const content = await dgit.getFileContent(repoName, branch, fileName);
      setCurrentFile(fileName);
      setFileContent(content ?? '');
    } catch (err) {
      console.error('Error opening file:', err);
      setFileContent('');
    }
  };

  const deleteFile = async (fileName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${fileName}"?`);
    if (!confirmDelete) return;

    try {
      const res = await dgit.deleteFile(repoName, branch, fileName);
      alert(res);
      if (fileName === currentFile) {
        setCurrentFile(null);
        setFileContent('');
      }
      fetchFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file.');
    }
  };

  const createFile = async () => {
    if (!newFileName) {
      alert('Enter a valid file name.');
      return;
    }

    try {
      const res = await dgit.commitCode(
        repoName,
        branch,
        [[newFileName, '']], // Create empty file
        'Created new file',
        'system'
      );
      alert(res);
      setNewFileName('');
      fetchFiles();
    } catch (err) {
      console.error('Error creating file:', err);
      alert('Failed to create file.');
    }
  };

  return (
    <div>
      <h3>File Tree</h3>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="New file name"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          style={{ marginRight: '5px' }}
        />
        <button onClick={createFile}>➕ Create</button>
      </div>

      {loading ? (
        <p>Loading files...</p>
      ) : files.length === 0 ? (
        <p>No files found in this branch.</p>
      ) : (
        <ul>
          {files.map((f) => (
            <li key={f}>
              📄 {f}
              <button onClick={() => openFile(f)} style={{ marginLeft: '5px' }}>Open</button>
              <button onClick={() => deleteFile(f)} style={{ marginLeft: '5px' }}>🗑️ Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
