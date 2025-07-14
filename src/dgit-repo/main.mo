import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Bool "mo:base/Bool";
import Debug "mo:base/Debug";
import Blob "mo:base/Blob";
import HashMap "mo:base/HashMap";

actor {

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

  stable var oldSavedRepos: [(Text, RepoSerializable)] = []; // previous saved data
  stable var savedRepos: [(Text, RepoSerializable)] = [];    // new target
 var repos: HashMap.HashMap<Text, Repo> = HashMap.HashMap<Text, Repo>(10, Text.equal, Text.hash);

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
    for ((k, v) in cs.tree.vals()) { tree.put(k, v); };
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
      func(entry: (Text, Commit)): (Text, CommitSerializable) {
        let (k, v) = entry;
        (k, serializeCommit(v))
      }
    );

    collaborators = Iter.toArray(repo.collaborators.entries());
    tags = Iter.toArray(repo.tags.entries());
  };

  func deserializeRepo(rs: RepoSerializable): Repo {
    let branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for ((k, v) in rs.branches.vals()) { branches.put(k, v); };

    let commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
    for ((k, v) in rs.commits.vals()) { commits.put(k, deserializeCommit(v)); };

    let collaborators = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
    for ((k, v) in rs.collaborators.vals()) { collaborators.put(k, v); };

    let tags = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for ((k, v) in rs.tags.vals()) { tags.put(k, v); };

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
    repo.owner == user or (switch (repo.collaborators.get(user)) { case (?b) b; case null false })
  };

  func cloneRepo(repo: Repo): Repo {
    let branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for ((k, v) in repo.branches.entries()) { branches.put(k, v); };

    let commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
    for ((k, v) in repo.commits.entries()) { commits.put(k, v); };

    let collaborators = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
    for ((k, v) in repo.collaborators.entries()) { collaborators.put(k, v); };

    let tags = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for ((k, v) in repo.tags.entries()) { tags.put(k, v); };

    {
      name = repo.name;
      owner = repo.owner;
      branches = branches;
      commits = commits;
      collaborators = collaborators;
      tags = tags;
    }
  };

  public shared func createRepo(name: Text, ownerName: Text): async Text {
    if (Option.isSome(repos.get(name))) return "Error: Repository already exists.";
    let repo = {
      name = name;
      owner = ownerName;
      branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
      commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
      collaborators = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
      tags = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    };
    repos.put(name, repo);
    "Repository created: " # name;
  };

  public shared func commitCode(
    repoName: Text,
    branch: Text,
    fileList: [(Text, Text)],
    message: Text,
    author: Text
  ): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?originalRepo) {
        let repo = cloneRepo(originalRepo);
        if (not canCommit(repo, author)) return "Error: No permission.";

        let tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
        switch (repo.branches.get(branch)) {
          case (?parentHash) {
            switch (repo.commits.get(parentHash)) {
              case (?parentCommit) {
                for ((k, v) in parentCommit.tree.entries()) { tree.put(k, v); };
              };
              case null {};
            }
          };
          case null {};
        };

        for ((f, c) in fileList.vals()) {
          if (c == "") {
            ignore tree.remove(f);
          } else {
            let blobContent = Text.encodeUtf8(c);
            tree.put(f, blobContent);
          }
        };

        let newCommit: Commit = {
          tree = tree;
          message = message;
          parent = repo.branches.get(branch);
          author = author;
          timestamp = Time.now();
        };

        let hash = generateCommitHash(message);
        repo.commits.put(hash, newCommit);
        repo.branches.put(branch, hash);
        repos.put(repoName, repo);

        return "Commit successful with hash: " # hash;
      }
    }
  };


  public shared func addCollaborator(repoName: Text, userToAdd: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?oldRepo) {
        let repo = cloneRepo(oldRepo);
        repo.collaborators.put(userToAdd, true);
        repos.put(repoName, repo);
        "Collaborator " # userToAdd # " added successfully.";
      }
    }
  };

  public shared func removeCollaborator(repoName: Text, userToRemove: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?oldRepo) {
        let repo = cloneRepo(oldRepo);
        switch (repo.collaborators.remove(userToRemove)) {
          case null return "Error: Collaborator not found.";
          case (?_) {
            repos.put(repoName, repo);
            return "Collaborator removed: " # userToRemove;
          }
        }
      }
    }
  };

  public shared func createTag(repoName: Text, tagName: Text, branch: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?oldRepo) {
        let repo = cloneRepo(oldRepo);
        switch (repo.branches.get(branch)) {
          case null return "Error: Branch not found.";
          case (?commitHash) {
            repo.tags.put(tagName, commitHash);
            repos.put(repoName, repo);
            return "Tag " # tagName # " created.";
          }
        }
      }
    }
  };

  public shared func createBranch(repoName: Text, newBranch: Text, sourceBranch: Text, caller: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?oldRepo) {
        if (oldRepo.owner != caller) return "Error: Only owner can create branches.";
        let repo = cloneRepo(oldRepo);
        switch (repo.branches.get(sourceBranch)) {
          case null return "Error: Source branch not found.";
          case (?commitHash) {
            repo.branches.put(newBranch, commitHash);
            repos.put(repoName, repo);
            return "Branch " # newBranch # " created from " # sourceBranch;
          }
        }
      }
    }
  };

  public shared func mergeBranches(repoName: Text, sourceBranch: Text, targetBranch: Text, caller: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?oldRepo) {
        if (not canCommit(oldRepo, caller)) return "Error: No permission.";
        let repo = cloneRepo(oldRepo);
        switch (repo.branches.get(sourceBranch)) {
          case null return "Error: Source branch not found.";
          case (?sourceHash) {
            repo.branches.put(targetBranch, sourceHash);
            repos.put(repoName, repo);
            return "Branch " # sourceBranch # " merged into " # targetBranch;
          }
        }
      }
    }
  };

  public query func listFiles(repoName: Text, branch: Text): async [Text] {
    switch (repos.get(repoName)) {
      case null return [];
      case (?repo) {
        switch (repo.branches.get(branch)) {
          case null return [];
          case (?commitHash) {
            switch (repo.commits.get(commitHash)) {
              case null return [];
              case (?commit) return Iter.toArray(commit.tree.keys());
            }
          }
        }
      }
    }
  };

  public query func getRepoList(): async [Text] {
    Iter.toArray(repos.keys());
  };

  public query func getCommitHistory(repoName: Text, branch: Text): async [Text] {
    switch (repos.get(repoName)) {
      case null return [];
      case (?repo) {
        switch (repo.branches.get(branch)) {
          case null return [];
          case (?headHash) {
            var history: [Text] = [];
            var currentHash = ?headHash;
            while (Option.isSome(currentHash)) {
              switch (currentHash) {
                case (?hash) {
                  history := Array.append(history, [hash]);
                  switch (repo.commits.get(hash)) {
                    case null currentHash := null;
                    case (?commit) currentHash := commit.parent;
                  }
                };
                case null currentHash := null;
              }
            };
            return history;
          }
        }
      }
    }
  };

    public query func getFileContent(repoName: Text, branch: Text, fileName: Text): async ?Text {
    switch (repos.get(repoName)) {
      case null return ?"// Repo not found";
      case (?repo) {
        switch (repo.branches.get(branch)) {
          case null return ?"// Branch not found";
          case (?commitHash) {
            switch (repo.commits.get(commitHash)) {
              case null return ?"// Commit not found";
              case (?commit) {
                switch (commit.tree.get(fileName)) {
                  case null return ?"// File not found in commit";
                  case (?blobContent) {
                    return Text.decodeUtf8(blobContent);
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  public query func listTags(repoName: Text): async [Text] {
    switch (repos.get(repoName)) {
      case null return [];
      case (?repo) return Iter.toArray(repo.tags.keys());
    }
  };

  public query func listCollaborators(repoName: Text): async [Text] {
    switch (repos.get(repoName)) {
      case null return [];
      case (?repo) return Iter.toArray(repo.collaborators.keys());
    }
  };

  public query func getCommitMessage(repoName: Text, commitHash: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        switch (repo.commits.get(commitHash)) {
          case null return "Error: Commit not found.";
          case (?commit) return commit.message;
        }
      }
    }
  };

  public query func listBranches(repoName: Text): async [Text] {
    switch (repos.get(repoName)) {
      case null return [];
      case (?repo) return Iter.toArray(repo.branches.keys());
    }
  };

   system func preupgrade() {
  let entries: [(Text, Repo)] = Iter.toArray(repos.entries());
  savedRepos := Array.map<(Text, Repo), (Text, RepoSerializable)>(
    entries,
    func(entry: (Text, Repo)): (Text, RepoSerializable) {
      let (name, repo) = entry;
      (name, serializeRepo(repo));
    }
  );
};


  system func postupgrade() {
  repos := HashMap.HashMap<Text, Repo>(10, Text.equal, Text.hash);
  for ((name, serRepo) in oldSavedRepos.vals()) {
    repos.put(name, deserializeRepo(serRepo));
  };

  let entries: [(Text, Repo)] = Iter.toArray(repos.entries());
  savedRepos := Array.map<(Text, Repo), (Text, RepoSerializable)>(
    entries,
    func(entry: (Text, Repo)): (Text, RepoSerializable) {
      let (name, repo) = entry;
      (name, serializeRepo(repo));
    }
  );
};
};
