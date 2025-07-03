import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Bool "mo:base/Bool";

actor {

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

  stable var savedRepos: [(Text, RepoSerializable)] = [];
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
    for (entry in cs.tree.vals()) {
      let (k, v) = entry;
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
      func((k, v)) : (Text, CommitSerializable) {
        (k, serializeCommit(v))
      }
    );
    collaborators = Iter.toArray(repo.collaborators.entries());
    tags = Iter.toArray(repo.tags.entries());
  };

  func deserializeRepo(rs: RepoSerializable): Repo {
    let branches = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for (entry in rs.branches.vals()) {
      let (k, v) = entry;
      branches.put(k, v);
    };

    let commits = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);
    for (entry in rs.commits.vals()) {
      let (k, v) = entry;
      commits.put(k, deserializeCommit(v));
    };

    let collaborators = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
    for (entry in rs.collaborators.vals()) {
      let (k, v) = entry;
      collaborators.put(k, v);
    };

    let tags = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
    for (entry in rs.tags.vals()) {
      let (k, v) = entry;
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
    repo.owner == user or (switch (repo.collaborators.get(user)) { case (?b) b; case null false })
  };

  public shared func createRepo(name: Text, ownerName: Text): async Text {
    if (Option.isSome(repos.get(name))) {
      return "Error: Repository already exists.";
    };
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

  public shared func commitCode(repoName: Text, branch: Text, fileList: [(Text, Text)], message: Text, author: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        if (not canCommit(repo, author)) return "Error: No permission.";
        let parentHash = repo.branches.get(branch);
        let tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
        for (entry in fileList.vals()) {
          let (f, c) = entry;
          if (c == "") {
            ignore tree.remove(f);
          } else {
            tree.put(f, c);
          }
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

  public query func listFiles(repoName: Text): async [Text] {
    switch (repos.get(repoName)) {
      case null return [];
      case (?repo) {
        switch (repo.branches.get("master")) {
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
      case null return null;
      case (?repo) {
        switch (repo.branches.get(branch)) {
          case null return null;
          case (?commitHash) {
            switch (repo.commits.get(commitHash)) {
              case null return null;
              case (?commit) return commit.tree.get(fileName);
            }
          }
        }
      }
    }
  };

  public shared func addCollaborator(repoName: Text, userToAdd: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        repo.collaborators.put(userToAdd, true);
        "Collaborator " # userToAdd # " added successfully.";
      }
    }
  };

  public shared func removeCollaborator(repoName: Text, userToRemove: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        switch (repo.collaborators.remove(userToRemove)) {
          case null return "Error: Collaborator not found.";
          case (?_) return "Collaborator removed: " # userToRemove;
        }
      }
    }
  };

  public shared func createTag(repoName: Text, tagName: Text, branch: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        switch (repo.branches.get(branch)) {
          case null return "Error: Branch not found.";
          case (?commitHash) {
            repo.tags.put(tagName, commitHash);
            return "Tag " # tagName # " created.";
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

  public shared func createBranch(repoName: Text, newBranch: Text, sourceBranch: Text, caller: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        if (repo.owner != caller) return "Error: Only owner can create branches.";
        switch (repo.branches.get(sourceBranch)) {
          case null return "Error: Source branch not found.";
          case (?commitHash) {
            repo.branches.put(newBranch, commitHash);
            return "Branch " # newBranch # " created from " # sourceBranch;
          }
        }
      }
    }
  };

  public shared func mergeBranches(repoName: Text, sourceBranch: Text, targetBranch: Text, caller: Text): async Text {
    switch (repos.get(repoName)) {
      case null return "Error: Repository not found.";
      case (?repo) {
        if (not canCommit(repo, caller)) return "Error: No permission.";
        switch (repo.branches.get(sourceBranch)) {
          case null return "Error: Source branch not found.";
          case (?sourceHash) {
            repo.branches.put(targetBranch, sourceHash);
            return "Branch " # sourceBranch # " merged into " # targetBranch;
          }
        }
      }
    }
  };

  system func preupgrade() {
    savedRepos := Array.map<(Text, Repo), (Text, RepoSerializable)>(
      Iter.toArray(repos.entries()),
      func((name, repo)) : (Text, RepoSerializable) {
        (name, serializeRepo(repo))
      }
    );
  };

  system func postupgrade() {
    repos := HashMap.HashMap<Text, Repo>(10, Text.equal, Text.hash);
    for (entry in savedRepos.vals()) {
      let (name, serRepo) = entry;
      repos.put(name, deserializeRepo(serRepo));
    }
  };

};
