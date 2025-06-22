import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

actor {

  // === Types ===
  type Blob = Text;
  type Tree = HashMap.HashMap<Text, Blob>;
  type Ref = Text;

  type Commit = {
    tree: Tree;
    message: Text;
    parent: ?Text;
    author: Text;
    timestamp: Int;
  };

  type CommitSerializable = {
    tree: [(Text, Blob)];
    message: Text;
    parent: ?Text;
    author: Text;
    timestamp: Int;
  };

  type Repo = {
    name: Text;
    owner: Text;
    branches: HashMap.HashMap<Text, Ref>;
    commits: HashMap.HashMap<Text, Commit>;
  };

  type RepoSerializable = {
    name: Text;
    owner: Text;
    branches: [(Text, Ref)];
    commits: [(Text, CommitSerializable)];
  };

  // === Stable Variables ===
  stable var savedRepos: [(Text, RepoSerializable)] = [];

  // TEMPORARY: old vars to migrate safely
  stable var owner: Text = "";
  stable var repoName: Text = "";
  stable var savedOwner: ?Text = null;
  stable var savedRepoName: ?Text = null;

  // === In-memory State ===
  var repos: HashMap.HashMap<Text, Repo> = HashMap.HashMap<Text, Repo>(10, Text.equal, Text.hash);

  // === Utility Functions ===
  func generateCommitHash(msg: Text): Text {
    msg # "_" # Int.toText(Time.now());
  };

  func serializeCommit(c: Commit): CommitSerializable {
    {
      tree = Iter.toArray(c.tree.entries());
      message = c.message;
      parent = c.parent;
      author = c.author;
      timestamp = c.timestamp;
    };
  };

  func deserializeCommit(cs: CommitSerializable): Commit {
    let tree: Tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
    for ((k, v) in cs.tree.vals()) {
      tree.put(k, v);
    };
    {
      tree = tree;
      message = cs.message;
      parent = cs.parent;
      author = cs.author;
      timestamp = cs.timestamp;
    };
  };

  func serializeRepo(repo: Repo): RepoSerializable {
    let branchesArray: [(Text, Ref)] = Iter.toArray(repo.branches.entries());
    let commitsArray: [(Text, Commit)] = Iter.toArray(repo.commits.entries());
    let serialCommits: [(Text, CommitSerializable)] =
      Array.map<(Text, Commit), (Text, CommitSerializable)>(
        commitsArray,
        func(entry: (Text, Commit)): (Text, CommitSerializable) {
          let (k, v) = entry;
          (k, serializeCommit(v));
        }
      );
    {
      name = repo.name;
      owner = repo.owner;
      branches = branchesArray;
      commits = serialCommits;
    };
  };

  func deserializeRepo(rs: RepoSerializable): Repo {
    let branches: HashMap.HashMap<Text, Ref> = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for ((k, v) in rs.branches.vals()) { branches.put(k, v); };

    let commits: HashMap.HashMap<Text, Commit> = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
    for ((k, v) in rs.commits.vals()) { commits.put(k, deserializeCommit(v)); };

    {
      name = rs.name;
      owner = rs.owner;
      branches = branches;
      commits = commits;
    };
  };

  // === Public Functions ===
  public shared func createRepo(name: Text, ownerName: Text): async Text {
    switch (repos.get(name)) {
      case null {
        let branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
        let commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
        branches.put("master", "");
        let newRepo: Repo = {
          name = name;
          owner = ownerName;
          branches = branches;
          commits = commits;
        };
        repos.put(name, newRepo);
        return "Repository created: " # name;
      };
      case (?_) return "Error: Repository with this name already exists.";
    };
  };

  public shared func commitCode(repoName: Text, branch: Text, fileList: [(Text, Text)], message: Text, author: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        let parentHash = repo.branches.get(branch);
        let tree: Tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
        for ((f, c) in fileList.vals()) {
          tree.put(f, c);
        };
        let newCommit: Commit = {
          tree = tree;
          message = message;
          parent = parentHash;
          author = author;
          timestamp = Time.now();
        };
        let hash = generateCommitHash(message);
        repo.commits.put(hash, newCommit);
        repo.branches.put(branch, hash);
        return "Commit successful with hash: " # hash;
      };
    };
  };

  public shared func forkRepo(existing: Text, newName: Text, newOwner: Text): async Text {
    switch (repos.get(existing)) {
      case null return "Error: Source repository does not exist.";
      case (?sourceRepo) {
        switch (repos.get(newName)) {
          case (?_) return "Error: Fork name already exists.";
          case null {
            let forkedBranches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
            for ((k, v) in sourceRepo.branches.entries()) {
              forkedBranches.put(k, v);
            };
            let forkedCommits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
            for ((k, v) in sourceRepo.commits.entries()) {
              forkedCommits.put(k, v);
            };
            let forkedRepo: Repo = {
              name = newName;
              owner = newOwner;
              branches = forkedBranches;
              commits = forkedCommits;
            };
            repos.put(newName, forkedRepo);
            return "Repository forked to: " # newName;
          };
        };
      };
    };
  };

  public query func getCommit(repoName: Text, commitHash: Text): async ?CommitSerializable {
    switch (repos.get(repoName)) {
      case null return null;
      case (?repo) {
        switch (repo.commits.get(commitHash)) {
          case null return null;
          case (?c) return ?serializeCommit(c);
        };
      };
    };
  };

  // === Upgrade Hooks ===

  system func preupgrade() {
    let entries: [(Text, Repo)] = Iter.toArray(repos.entries());
    savedRepos := Array.map<(Text, Repo), (Text, RepoSerializable)>(
      entries,
      func(entry: (Text, Repo)): (Text, RepoSerializable) {
        let (name, repo) = entry;
        (name, serializeRepo(repo));
      }
    );

    // Clean up unused stable vars
    ignore owner;
    ignore repoName;
    ignore savedOwner;
    ignore savedRepoName;
  };

  system func postupgrade() {
    repos := HashMap.HashMap<Text, Repo>(10, Text.equal, Text.hash);
    for ((name, ser) in savedRepos.vals()) {
      repos.put(name, deserializeRepo(ser));
    };
  };
};
