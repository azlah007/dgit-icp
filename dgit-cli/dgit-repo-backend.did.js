export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'addCollaborator' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'commitCode' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
          IDL.Text,
          IDL.Text,
        ],
        [IDL.Text],
        [],
      ),
    'createBranch' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Text],
        [],
      ),
    'createRepo' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'createTag' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'getCommitHistory' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getCommitMessage' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], ['query']),
    'getFileContent' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Opt(IDL.Text)],
        ['query'],
      ),
    'getRepoList' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'listBranches' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'listCollaborators' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'listFiles' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'listTags' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'mergeBranches' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Text],
        [],
      ),
    'removeCollaborator' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
