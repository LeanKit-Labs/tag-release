jest.mock( "../src/utils", () => ( {
	exec: jest.fn( () => Promise.resolve() ),
	log: {
		begin: jest.fn(),
		end: jest.fn()
	}
} ) );

import util from "../src/utils";
import git from "../src/git";
import path from "path";

describe( "git", () => {
	describe( "runCommand", () => {
		beforeEach( () => {
			util.advise = jest.fn();
			util.writeFile = jest.fn();
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

		it( "should use full command and not append `git` when the `fullCommand` option is true", () => {
			return git.runCommand( { args: "some command", fullCommand: true } ).then( anything => {
				expect( util.exec ).toHaveBeenCalledTimes( 1 );
				expect( util.exec ).toHaveBeenCalledWith( "some command" );
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

			it( "should reject with no error when the command execution fails and `showError` is false", () => {
				return git.runCommand( { args: "--version", showError: false } ).catch( err => {
					expect( util.log.end ).toHaveBeenCalledTimes( 1 );
					expect( err ).toEqual( undefined );
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
			rebase: {
				args: "upstream/test-branch",
				expectedRunCommandArgs: { args: "rebase upstream/test-branch" }
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
			mergePromotionBranch: {
				args: "v1.1.1-feature.0",
				expectedRunCommandArgs: { args: "merge promote-release-v1.1.1-feature.0 --ff-only" }
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
			},
			checkoutTag: {
				args: "v1.1.1-blah.0",
				expectedRunCommandArgs: { args: "checkout -b promote-release-v1.1.1-blah.0 v1.1.1-blah.0" }
			},
			generateRebaseCommitLog: {
				args: "v1.1.1-blah.0",
				expectedRunCommandArgs: { args: "log upstream/master..HEAD --pretty=format:'%h %s' --no-merges" }
			},
			rebaseUpstreamMaster: {
				expectedRunCommandArgs: { args: "rebase upstream/master" }
			},
			getBranchList: {
				expectedRunCommandArgs: { args: "branch", logMessage: `Getting branch list` }
			},
			deleteBranch: {
				args: "promote-release-v1.1.1-feature.0",
				expectedRunCommandArgs: { args: "branch -D promote-release-v1.1.1-feature.0", showOutput: true }
			},
			stageFiles: {
				expectedRunCommandArgs: { args: "add -A" }
			},
			rebaseContinue: {
				expectedRunCommandArgs: { args: `GIT_EDITOR="cat" git rebase --continue`, logMessage: "Continuing with rebase", failHelpKey: "gitRebaseInteractive", showError: false, fullCommand: true }
			},
			checkConflictMarkers: {
				expectedRunCommandArgs: { args: "diff --check", logMessage: "Verifying conflict resolution", failHelpKey: "gitCheckConflictMarkers", showError: false }
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

			it( `should call "git.merge" with provided promotion tag`, () => {
				return git.mergePromotionBranch( "v1.1.1" ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "merge promote-release-v1.1.1 --ff-only" } );
				} );
			} );

			it( `should call "git.merge" with provided promotion tag`, () => {
				return git.mergePromotionBranch( "v1.1.1" ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "merge promote-release-v1.1.1 --ff-only" } );
				} );
			} );

			it( `should call "checkoutTag" with provided promotion tag`, () => {
				return git.checkoutTag( "v1.1.1" ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "checkout -b promote-release-v1.1.1 v1.1.1" } );
				} );
			} );

			it( `should call "deleteBranch" with provided branch`, () => {
				return git.deleteBranch( "promote-release-v1.1.1", false ).then( () => {
					expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
					expect( git.runCommand ).toHaveBeenCalledWith( { args: "branch -D promote-release-v1.1.1", showOutput: false } );
				} );
			} );

			describe( "removePreReleaseCommits", () => {
				let joinSpy;
				beforeEach( () => {
					git.runCommand = jest.fn( () => Promise.resolve( "" ) );
					joinSpy = jest.spyOn( path, "join" ).mockImplementation( () => "my_path/" );
				} );
				it( "should call 'git.runCommand' with appropriate arguments", () => {
					return git.removePreReleaseCommits().then( () => {
						expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
						expect( git.runCommand ).toHaveBeenCalledWith( { args: "GIT_SEQUENCE_EDITOR=\"cat my_path/ >\" git rebase -i upstream/master", failHelpKey: "gitRebaseInteractive", fullCommand: true, logMessage: "Removing pre-release commit history", showError: false } );
					} );
				} );
				afterEach( () => {
					joinSpy.mockRestore();
				} );
			} );

			describe( "removePromotionBranches", () => {
				it( "should remove all promotion branches", () => {
					git.getBranchList = jest.fn( () => Promise.resolve( [
						"feature-branch",
						"promote-release-v1.1.1-feature.0",
						"* master",
						"develop",
						"promote-release-v1.1.1-feature.1" ]
					) );
					git.deleteBranch = jest.fn( branch => Promise.resolve( branch ) );
					return git.removePromotionBranches().then( result => {
						expect( result ).toEqual( [ "promote-release-v1.1.1-feature.0", "promote-release-v1.1.1-feature.1" ] );
						expect( git.deleteBranch ).toHaveBeenCalledTimes( 2 );
					} );
				} );
			} );

			describe( "getPrereleaseTagList", () => {
				it( "should run `git` with the given args", () => {
					git.runCommand = jest.fn( branch => Promise.resolve( `v18.0.0-robert.0
v17.12.0-break.1
v17.12.0-break.0
v17.11.2` ) );
					return git.getPrereleaseTagList().then( () => {
						expect( git.runCommand ).toHaveBeenCalledTimes( 1 );
						expect( git.runCommand ).toHaveBeenCalledWith( { args: "tag --sort=-v:refname", logMessage: "Getting list of pre-releases" } );
					} );
				} );

				it( "should return list of latest tags", () => {
					git.runCommand = jest.fn( branch => Promise.resolve( `v18.0.0-robert.0
v17.12.0-break.0
v17.12.0-break.1
v17.11.2` ) );
					return git.getPrereleaseTagList( 10 ).then( result => {
						expect( result ).toEqual( [ "v18.0.0-robert.0", "v17.12.0-break.1" ] );
					} );
				} );
			} );

			describe( "generateRebaseCommitLog", () => {
				let writeSpy;
				beforeEach( () => {
					writeSpy = jest.spyOn( util, "writeFile" ).mockImplementation( () => "" );
				} );
				it( "should remove all pre-release commits", () => {
					git.runCommand = jest.fn( branch => Promise.resolve( `v1.1.1-feature.1
this is commit 2
v1.1.1-feature.0
this is commit 1` ) );
					return git.generateRebaseCommitLog( "v1.1.1-feature.1" ).then( result => {
						expect( writeSpy.mock.calls[ 0 ][ 1 ] ).toEqual( `pick this is commit 1
pick this is commit 2
` );
					} );
				} );
				afterEach( () => {
					writeSpy.mockRestore();
				} );
			} );
		} );
	} );
} );
