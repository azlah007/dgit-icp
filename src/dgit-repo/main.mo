import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";

actor {
  type Blob = Text;
  type Tree = HashMap.HashMap<Text, Blob>;

  type Commit = {
    tree: Tree;
    message: Text;
    parent: ?Text;
    author: Text;
    timestamp: Int;
  };

  type Ref = Text;

  stable var repoName : Text = "";
  stable var owner : Text = "";

  var branches : HashMap.HashMap<Text, Ref> = HashMap.HashMap<Text, Ref>(10, Text.equal, Text.hash);
  var commits : HashMap.HashMap<Text, Commit> = HashMap.HashMap<Text, Commit>(10, Text.equal, Text.hash);

  func generateCommitHash(msg : Text) : Text {
    return msg # "_" # Int.toText(Time.now());
  };

  public shared func createRepo(name: Text, ownerName: Text) : async Text {
    repoName := name;
    owner := ownerName;
    branches.put("master", "");
    return "Repository created with name: " # name # " owned by: " # ownerName;
  };

  public shared func commitCode(
    branch: Text,
    fileList: [(Text, Text)],
    message: Text,
    author: Text
  ): async Text {
    let commitHash = generateCommitHash(message);
    let parentCommit: ?Text = branches.get(branch);

    let files : Tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
    for ((filename, content) in fileList.vals()) {
      files.put(filename, content);
    };

    let newCommit: Commit = {
      tree = files;
      message = message;
      parent = parentCommit;
      author = author;
      timestamp = Time.now();
    };

    commits.put(commitHash, newCommit);
    branches.put(branch, commitHash);

    return "Commit successful with hash: " # commitHash;
  };

  public shared func createBranch(newBranch: Text, fromCommitHash: Text): async Text {
    let commitOption = commits.get(fromCommitHash);
    switch (commitOption) {
      case null {
        return "Error: Commit hash not found.";
      };
      case (?_) {
        branches.put(newBranch, fromCommitHash);
        return "Branch '" # newBranch # "' created from commit: " # fromCommitHash;
      };
    };
  };

  type CommitSerializable = {
    tree: [(Text, Blob)];
    message: Text;
    parent: ?Text;
    author: Text;
    timestamp: Int;
  };

  func commitToSerializable(c: Commit): CommitSerializable {
    var arr: [(Text, Blob)] = [];
    for ((k, v) in c.tree.entries()) {
      arr := Array.append(arr, [(k, v)]);
    };
    return {
      tree = arr;
      message = c.message;
      parent = c.parent;
      author = c.author;
      timestamp = c.timestamp;
    };
  };

  public query func getCommit(commitHash: Text): async ?CommitSerializable {
    switch (commits.get(commitHash)) {
      case null { return null };
      case (?c) { return ?commitToSerializable(c) };
    };
  };

  public shared func mergeBranch(
  targetBranch: Text,
  sourceBranch: Text,
  author: Text,
  message: Text
): async Text {
  let targetCommitHashOpt = branches.get(targetBranch);
  let sourceCommitHashOpt = branches.get(sourceBranch);

  if (targetCommitHashOpt == null or sourceCommitHashOpt == null) {
    return "Error: One of the branches does not exist.";
  };

  let targetCommitHash = switch (targetCommitHashOpt) {
    case (?hash) hash;
    case null return "Error: Unexpected null target commit hash.";
  };

  let sourceCommitHash = switch (sourceCommitHashOpt) {
    case (?hash) hash;
    case null return "Error: Unexpected null source commit hash.";
  };

  let targetCommit = switch (commits.get(targetCommitHash)) {
    case (?c) c;
    case null return "Error: Target commit not found.";
  };

  let sourceCommit = switch (commits.get(sourceCommitHash)) {
    case (?c) c;
    case null return "Error: Source commit not found.";
  };

  let mergedTree: Tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);

  // Add all files from target
  for ((k, v) in targetCommit.tree.entries()) {
    mergedTree.put(k, v);
  };

  // Overwrite/add files from source
  for ((k, v) in sourceCommit.tree.entries()) {
    mergedTree.put(k, v);
  };

  let newCommitHash = generateCommitHash(message);

  let newCommit: Commit = {
    tree = mergedTree;
    message = message;
    parent = ?targetCommitHash;
    author = author;
    timestamp = Time.now();
  };

  commits.put(newCommitHash, newCommit);
  branches.put(targetBranch, newCommitHash);

  return "Branches merged successfully. New commit hash: " # newCommitHash;
};


  public shared func forkRepo(
    newRepoName: Text,
    newOwner: Text
  ): async Text {
    return "Forking is not implemented yet. Requires multi-repo management.";
  };
};
