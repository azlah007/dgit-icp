import React, { useEffect, useState } from 'react';
import { dgit } from './agent';

export default function BranchManager({ repoName, branch, setBranch }) {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (repoName) {
      fetchBranches();
    }
  }, [repoName]);

  const fetchBranches = async () => {
    setStatusMsg('');
    try {
      const res = await dgit.listBranches(repoName);
      setBranches(res);
      if (res.length === 0) {
        setStatusMsg('No branches found.');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setStatusMsg('Error fetching branches.');
    }
  };

  const createBranch = async () => {
    if (!newBranch.trim() || !sourceBranch.trim()) {
      alert('Please enter both new branch name and source branch.');
      return;
    }
    try {
      const res = await dgit.createBranch(repoName, newBranch.trim(), sourceBranch.trim(), 'owner');
      alert(res);
      setNewBranch('');
      setSourceBranch('');
      fetchBranches();
    } catch (err) {
      console.error('Error creating branch:', err);
      alert('Failed to create branch.');
    }
  };

  return (
    <div>
      <h3>Branches</h3>

      {statusMsg && <p>{statusMsg}</p>}

      {branches.length === 0 ? (
        <p>No branches available.</p>
      ) : (
        <ul>
          {branches.map((b) => (
            <li key={b}>
              {b} 
              {b === branch ? ' (Active)' : (
                <button onClick={() => setBranch(b)}>Switch</button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h4>Create New Branch</h4>
      <input 
        type="text" 
        placeholder="New branch name" 
        value={newBranch} 
        onChange={(e) => setNewBranch(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Source branch" 
        value={sourceBranch} 
        onChange={(e) => setSourceBranch(e.target.value)} 
      />
      <button onClick={createBranch}>Create Branch</button>
    </div>
  );
}
