import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";

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
    fileList: [ (Text, Text) ],
    message: Text,
    author: Text
  ): async Text {
    let commitHash = generateCommitHash(message);
    let parentCommit: ?Text = branches.get(branch);

    let files : Tree = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
    for ((filename, content) in fileList) {
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
    tree: [ (Text, Blob) ];
    message: Text;
    parent: ?Text;
    author: Text;
    timestamp: Int;
  };

  func commitToSerializable(c: Commit): CommitSerializable {
    var arr: [ (Text, Blob) ] = [];
    for ((key, val) in c.tree.entries()) {
      arr := arr # [(key, val): [(Text, Blob)]];
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
      case null { return null; };
      case (?c) { return ?commitToSerializable(c); };
    };
  };
};
