import { dgitRepoBackend } from '$lib/ic/actors/dgit_repo_backend';

dgitRepoBackend.getRepoList()
  .then((repos) => console.log("Repos:", repos))
  .catch((e) => console.error("Error:", e));

