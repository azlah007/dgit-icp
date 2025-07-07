import React, { useEffect, useState } from 'react';
import { dgit } from './agent';

export default function TagManager({ repoName }) {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [branch, setBranch] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (repoName) {
      fetchTags();
    }
  }, [repoName]);

  const fetchTags = async () => {
    setStatusMsg('');
    try {
      const tags = await dgit.listTags(repoName);
      setTags(tags);
      if (tags.length === 0) {
        setStatusMsg('No tags found.');
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      setStatusMsg('Error fetching tags.');
    }
  };

  const createTag = async () => {
    if (!newTag.trim() || !branch.trim()) {
      alert('Please enter both tag name and branch to tag.');
      return;
    }
    try {
      const res = await dgit.createTag(repoName, newTag.trim(), branch.trim());
      alert(res);
      setNewTag('');
      setBranch('');
      fetchTags();
    } catch (err) {
      console.error('Error creating tag:', err);
      alert('Failed to create tag.');
    }
  };

  return (
    <div>
      <h3>Tags</h3>

      {statusMsg && <p>{statusMsg}</p>}

      {tags.length === 0 ? (
        <p>No tags available.</p>
      ) : (
        <ul>
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      <h4>Create New Tag</h4>
      <input 
        type="text" 
        placeholder="New tag name" 
        value={newTag} 
        onChange={(e) => setNewTag(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Branch to tag" 
        value={branch} 
        onChange={(e) => setBranch(e.target.value)} 
      />
      <button onClick={createTag}>Create Tag</button>
    </div>
  );
}
