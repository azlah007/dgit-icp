import React, { useEffect, useState } from 'react';

export default function TagManager({ repoName }) {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [branch, setBranch] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const tags = await window.dgit.listTags(repoName);
    setTags(tags);
  };

  const createTag = async () => {
    const res = await window.dgit.createTag(repoName, newTag, branch);
    alert(res);
    fetchTags();
  };

  return (
    <div>
      <h3>Tags</h3>
      <ul>
        {tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
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
