jest.mock( "../src/utils", () => ( {
	exec: jest.fn( () => Promise.resolve() ),
	log: {
		begin: jest.fn(),
		end: jest.fn()
	}
} ) );

import util from "../src/utils";
import git from "../src/git";

describe( "git", () => {
	describe( "runCommand", () => {
		beforeEach( () => {
			util.advise = jest.fn();
		} );

		it( "should run `git` with the given args", () => {
			const branch = "master";
			const includeTags = true;
			const args = `fetch upstream ${ branch }${ includeTags ? " --tags" : "" }`;

			return git.runCommand( { args } ).then( anything => {
				expect( util.exec ).toHaveBeenCalledTimes( 1 );
				expect( util.exec ).toHaveBeenCalledWith( "git fetch upstream master --tags" );
			} );
		} );

		it( "should log output by default", () => {
			return git.runCommand( { args: "--version" } ).then( () => {
				expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
				expect( util.log.end ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should log with the given `logMessage` when provided", () => {
			return git.runCommand( { args: "--version", logMessage: "Get git version" } ).then( () => {
				expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
				expect( util.log.begin ).toHaveBeenCalledWith( "Get git version" );
			} );
		} );

		it( "should log with the command with the `logMessage` option is not provided", () => {
			return git.runCommand( { args: "--version" } ).then( () => {
				expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
				expect( util.log.begin ).toHaveBeenCalledWith( "git --version" );
			} );
		} );

		it( "should not log output when the `showOutput` option is false", () => {
			return git.runCommand( { args: "--version", showOutput: false } ).then( () => {
				expect( util.log.begin ).not.toHaveBeenCalled();
				expect( util.log.end ).not.toHaveBeenCalled();
			} );
		} );

		describe( "failure", () => {
			beforeEach( () => {
				util.exec = jest.fn( () => Promise.reject( "fail" ) );
			} );

			it( "should reject when the command execution fails", () => {
				return git.runCommand( { args: "--version" } ).catch( err => {
					expect( util.log.end ).toHaveBeenCalledTimes( 1 );
					expect( err ).toEqual( "fail" );
				} );
			} );
		} );
	} );

	describe( "commands", () => {
		const commands = {
			getRemoteBranches: {
				expectedRunCommandArgs: { args: "branch -r" }
			},
			fetch: {
				expectedRunCommandArgs: { args: "fetch upstream master --tags" }
			},
			fetchUpstreamMaster: {
				expectedRunCommandArgs: { args: "fetch upstream master --tags", failHelpKey: "gitFetchUpstreamMaster" }
			},
			checkout: {
				args: "test-branch",
				expectedRunCommandArgs: { args: "checkout test-branch" }
			},
			checkoutMaster: {
				expectedRunCommandArgs: { args: "checkout master" }
			},
			checkoutDevelop: {
				expectedRunCommandArgs: { args: "checkout develop", failHelpKey: "gitCheckoutDevelop" }
			},
			merge: {
				args: "upstream/test-branch",
				expectedRunCommandArgs: { args: "merge upstream/test-branch --ff-only" }
			},
			mergeMaster: {
				expectedRunCommandArgs: { args: "merge master --ff-only", failHelpKey: "gitMergeMaster" }
			},
			mergeUpstreamMaster: {
				expectedRunCommandArgs: { args: "merge upstream/master --ff-only" }
			},
			mergeUpstreamDevelop: {
				expectedRunCommandArgs: { args: "merge upstream/develop" }
			},
			getCurrentBranch: {
				expectedRunCommandArgs: { args: "rev-parse --abbrev-ref HEAD", log: "Getting current branch" }
			},
			getTagList: {
				expectedRunCommandArgs: { args: "tag --sort=v:refname", logMessage: "Getting list of tags" }
			},
			shortLog: {
				expectedRunCommandArgs: { args: "--no-pager log --no-merges --date-order --pretty=format:'%s'", logMessage: "Parsing git log" }
			},
			diff: {
				args: [ "CHANGELOG.md", "package.json" ],
				expectedRunCommandArgs: { args: "diff --color CHANGELOG.md package.json" }
			},
			add: {
				args: [ "CHANGELOG.md", "package.json" ],
				expectedRunCommandArgs: { args: "add CHANGELOG.md package.json" }
			},
			commit: {
				args: "This is a test commit",
				expectedRunCommandArgs: { args: "commit -m \"This is a test commit\"" }
			},
			tag: {
				args: "v1.0.0",
				expectedRunCommandArgs: { args: `tag -a v1.0.0 -m v1.0.0` }
			},
			push: {
				args: "test-branch",
				expectedRunCommandArgs: { args: "push test-branch --tags" }
			},
			pushUpstreamMaster: {
				expectedRunCommandArgs: { args: "push upstream master", failHelpKey: "gitPushUpstreamFeatureBranch" }
			},
			pushUpstreamMasterWithTags: {
				expectedRunCommandArgs: { args: "push upstream master --tags" }
			},
			pushOriginMaster: {
				expectedRunCommandArgs: { args: "push origin master" }
			},
			pushOriginMasterWithTags: {
				expectedRunCommandArgs: { args: "push origin master --tags" }
			},
			pushUpstreamDevelop: {
				expectedRunCommandArgs: { args: "push upstream develop" }
			},
			uncommittedChangesExist: {
				expectedRunCommandArgs: { args: "diff-index HEAD --", logMessage: "Checking for uncommitted changes" }
			},
			stash: {
				expectedRunCommandArgs: { args: "stash", logMessage: "Stashing uncommitted changes" }
			},
			branchExists: {
				args: "test-branch",
				expectedRunCommandArgs: { args: "branch --list test-branch", logMessage: `Verifying branch: "test-branch" exists` }
			},
			createLocalBranch: {
				args: "test-branch",
				expectedRunCommandArgs: { args: "branch test-branch upstream/test-branch", logMessage: `Creating local branch "test-branch"` }
			},
			resetBranch: {
				args: "test-branch",
				expectedRunCommandArgs: { args: "reset --hard upstream/test-branch", logMessage: `Hard reset on branch: "test-branch"` }
			}
		};

		beforeEach( () => {
			git.runCommand = jest.fn( () => Promise.resolve( "" ) );
		} );

		describe( "default behavior", () => {
			Object.keys( commands ).forEach( command => {
				const testData = commands[ command ];

				it( `should call "git.${ command }" with the appropriate options`, () => {
					const result = testData.args ? git[ command ]( testData.args ) : git[ command ]();

					return result.then( () => {
						expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
						expect( git.runCommand ).toHaveBeenCalledWith( testData.expectedRunCommandArgs );
					} );
				} );
			} );
		} );

		describe( "alternate behaviors", () => {
			it( "should call `git.runCommand` with failHelpKey when provided in the call to `git.checkout`", () => {
				return git.checkout( "test-branch", "test-key" ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "checkout test-branch", failHelpKey: "test-key" } );
				} );
			} );

			it( "should call `git.fetch` without tags when specified", () => {
				return git.fetch( "test-branch", false ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "fetch upstream test-branch" } );
				} );
			} );

			it( "should call `git.fetch` with the `master` branch by default when not specified", () => {
				return git.fetchWithoutTags().then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "fetch upstream master" } );
				} );
			} );

			it( "should call `git.shortLog` with the appropriate options when a tag is given", () => {
				return git.shortLog( "v1.2.3" ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "--no-pager log --no-merges --date-order --pretty=format:'%s' v1.2.3..", logMessage: "Parsing git log" } );
				} );
			} );

			it( `should call "git.merge" without fast-forward when specified`, () => {
				return git.merge( "upstream/test-branch", false ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "merge upstream/test-branch" } );
				} );
			} );

			it( `should call "git.push" without tags when specified`, () => {
				return git.push( "upstream test-branch", false ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "push upstream test-branch" } );
				} );
			} );
		} );
	} );
} );
