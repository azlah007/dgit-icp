import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Option "mo:base/Option";

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
    collaborators: HashMap.HashMap<Text, Bool>;
    tags: HashMap.HashMap<Text, Ref>;
  };

  type RepoSerializable = {
    name: Text;
    owner: Text;
    branches: [(Text, Ref)];
    commits: [(Text, CommitSerializable)];
    collaborators: [(Text, Bool)];
    tags: [(Text, Ref)];
  };

  // === Stable Variables ===
  stable var savedRepos: [(Text, RepoSerializable)] = [];

  // === In-memory State ===
  var repos: HashMap.HashMap<Text, Repo> = HashMap.HashMap<Text, Repo>(10, Text.equal, Text.hash);

  // === Utility Functions ===

  func generateCommitHash(msg: Text): Text {
    msg # "_" # Int.toText(Time.now())
  };

  func serializeCommit(c: Commit): CommitSerializable = {
    tree = Iter.toArray(c.tree.entries());
    message = c.message;
    parent = c.parent;
    author = c.author;
    timestamp = c.timestamp;
  };

  func deserializeCommit(cs: CommitSerializable): Commit {
    let tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
    for (pair in cs.tree.vals()) {
      let (k, v) = pair;
      tree.put(k, v);
    };
    {
      tree = tree;
      message = cs.message;
      parent = cs.parent;
      author = cs.author;
      timestamp = cs.timestamp;
    }
  };

  func serializeRepo(repo: Repo): RepoSerializable = {
    name = repo.name;
    owner = repo.owner;
    branches = Iter.toArray(repo.branches.entries());
    commits = Array.map<(Text, Commit), (Text, CommitSerializable)>(
      Iter.toArray(repo.commits.entries()),
      func(entry) {
        let (k, v) = entry;
        (k, serializeCommit(v));
      }
    );
    collaborators = Iter.toArray(repo.collaborators.entries());
    tags = Iter.toArray(repo.tags.entries());
  };

  func deserializeRepo(rs: RepoSerializable): Repo {
    let branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for ((k, v) in rs.branches.vals()) {
      branches.put(k, v);
    };

    let commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
    for ((k, v) in rs.commits.vals()) {
      commits.put(k, deserializeCommit(v));
    };

    let collaborators = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
    for ((k, v) in rs.collaborators.vals()) {
      collaborators.put(k, v);
    };

    let tags = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for ((k, v) in rs.tags.vals()) {
      tags.put(k, v);
    };

    {
      name = rs.name;
      owner = rs.owner;
      branches = branches;
      commits = commits;
      collaborators = collaborators;
      tags = tags;
    }
  };

  func canCommit(repo: Repo, user: Text): Bool {
    if (repo.owner == user) {
      true;
    } else {
      switch (repo.collaborators.get(user)) {
        case (?true) true;
        case _ false;
      }
    }
  };

  // === Public Functions ===

  public shared func createRepo(name: Text, ownerName: Text): async Text {
    switch (repos.get(name)) {
      case null {
        let newRepo: Repo = {
          name = name;
          owner = ownerName;
          branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
          commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
          collaborators = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
          tags = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
        };
        newRepo.branches.put("master", "");
        repos.put(name, newRepo);
        "Repository created: " # name;
      };
      case _ "Error: Repository already exists.";
    }
  };

  public shared func commitCode(repoName: Text, branch: Text, fileList: [(Text, Text)], message: Text, author: Text): async Text {
    switch (repos.get(repoName)) {
      case null "Error: Repository not found.";
      case (?repo) {
        if (not canCommit(repo, author)) return "Error: No permission.";
        let parentHash = repo.branches.get(branch);
        let tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
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
        "Commit successful with hash: " # hash;
      }
    }
  };

  public shared func forkRepo(existing: Text, newName: Text, newOwner: Text): async Text {
    switch (repos.get(existing)) {
      case null "Error: Source repo not found.";
      case (?sourceRepo) {
        if (Option.isSome(repos.get(newName))) return "Error: Fork name exists.";
        let forkedRepo: Repo = {
          name = newName;
          owner = newOwner;
          branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
          commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
          collaborators = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
          tags = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
        };
        for ((k, v) in sourceRepo.branches.entries()) { forkedRepo.branches.put(k, v); };
        for ((k, v) in sourceRepo.commits.entries()) { forkedRepo.commits.put(k, v); };
        for ((k, v) in sourceRepo.tags.entries()) { forkedRepo.tags.put(k, v); };
        repos.put(newName, forkedRepo);
        "Repository forked to: " # newName;
      }
    }
  };

  public shared func addCollaborator(repoName: Text, ownerName: Text, collaborator: Text): async Text {
    switch (repos.get(repoName)) {
      case null "Error: Repo not found.";
      case (?repo) {
        if (repo.owner != ownerName) return "Error: Only owner can add collaborators.";
        repo.collaborators.put(collaborator, true);
        "Collaborator added.";
      }
    }
  };

  public shared func removeCollaborator(repoName: Text, ownerName: Text, collaborator: Text): async Text {
    switch (repos.get(repoName)) {
      case null "Error: Repo not found.";
      case (?repo) {
        if (repo.owner != ownerName) return "Error: Only owner can remove collaborators.";
        ignore repo.collaborators.remove(collaborator);
        "Collaborator removed.";
      }
    }
  };

  public shared func addTag(repoName: Text, tag: Text, commitHash: Text, owner: Text): async Text {
    switch (repos.get(repoName)) {
      case null "Error: Repo not found.";
      case (?repo) {
        if (repo.owner != owner) return "Error: Only owner can add tags.";
        if (Option.isSome(repo.commits.get(commitHash))) {
          repo.tags.put(tag, commitHash);
          "Tag '" # tag # "' added.";
        } else {
          "Error: Commit not found.";
        }
      }
    }
  };

  public query func getTag(repoName: Text, tag: Text): async ?Text {
    switch (repos.get(repoName)) {
      case null null;
      case (?repo) repo.tags.get(tag);
    }
  };

  public shared func removeTag(repoName: Text, tag: Text, owner: Text): async Text {
    switch (repos.get(repoName)) {
      case null "Error: Repo not found.";
      case (?repo) {
        if (repo.owner != owner) return "Error: Only owner can remove tags.";
        ignore repo.tags.remove(tag);
        "Tag removed.";
      }
    }
  };

  public query func getCommitHistory(repoName: Text, startHash: Text): async [Text] {
    switch (repos.get(repoName)) {
      case null [];
      case (?repo) {
        var history: [Text] = [];
        var current: ?Text = ?startHash;
        while (current != null) {
          switch (current) {
            case (?hash) {
              history := Array.append(history, [hash]);
              switch (repo.commits.get(hash)) {
                case (?c) current := c.parent;
                case null current := null;
              };
            };
            case null current := null;
          };
        };
        history;
      }
    }
  };

  // === Upgrade Hooks ===

  system func preupgrade() {
    savedRepos := Array.map<(Text, Repo), (Text, RepoSerializable)>(
      Iter.toArray(repos.entries()),
      func(entry) {
        let (name, repo) = entry;
        (name, serializeRepo(repo));
      }
    );
  };

  system func postupgrade() {
    repos := HashMap.HashMap<Text, Repo>(10, Text.equal, Text.hash);
    for ((name, serRepo) in savedRepos.vals()) {
      repos.put(name, deserializeRepo(serRepo));
    }
  };

};
