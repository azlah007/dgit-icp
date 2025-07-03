import React, { useEffect, useState } from 'react';

export default function BranchManager({ repoName }) {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const branches = await window.dgit.listBranches(repoName);
    setBranches(branches);
  };

  const createBranch = async () => {
    const res = await window.dgit.createBranch(repoName, newBranch, sourceBranch, 'owner');
    alert(res);
    fetchBranches();
  };

  return (
    <div>
      <h3>Branches</h3>
      <ul>
        {branches.map((b) => <li key={b}>{b}</li>)}
      </ul>
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
