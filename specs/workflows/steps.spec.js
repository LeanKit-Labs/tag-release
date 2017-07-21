/* eslint max-statements: 0 */

jest.mock( "editor", () => {
	return jest.fn( ( arg, cb ) => cb( 0 ) );
} );

jest.mock( "chalk", () => ( {
	bold: jest.fn( arg => arg ),
	red: jest.fn( arg => arg ),
	gray: jest.fn( arg => arg ),
	green: jest.fn( arg => arg ),
	yellow: jest.fn( arg => arg ),
	underline: jest.fn( arg => arg )
} ) );

jest.mock( "github-api", () => {
	return jest.fn();
} );

jest.mock( "remove-words", () => {
	return jest.fn( arg => arg.split( " " ) );
} );

jest.mock( "when/sequence", () => {
	return jest.fn( () => Promise.resolve( [ {
		pkg: "over-watch",
		version: "2.0.0-new.0"
	}, {
		pkg: "watch-over",
		version: "3.0.0-new.1"
	} ] ) );
} );

import chalk from "chalk"; // eslint-disable-line no-unused-vars
import editor from "editor"; // eslint-disable-line no-unused-vars
import logger from "better-console";
import semver from "semver";
import GitHub from "github-api";
import util from "../../src/utils";
import git from "../../src/git";
import * as run from "../../src/workflows/steps";
import sequence from "when/sequence";
import path from "path";

describe( "shared workflow steps", () => {
	let state = {};

	beforeEach( () => {
		util.log.begin = jest.fn();
		util.log.end = jest.fn();
		git.runCommand = jest.fn( () => Promise.resolve( "git.runCommand" ) );
	} );

	afterEach( () => {
		state = {};
	} );

	describe( "getFeatureBranch", () => {
		beforeEach( () => {
			git.getCurrentBranch = jest.fn( () => Promise.resolve( " feature-branch " ) );
		} );

		it( "should call `git.getCurrentBranch` with the appropriate options", () => {
			return run.getFeatureBranch( state ).then( () => {
				expect( git.getCurrentBranch ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "sets the resulting feature branch on the state object", () => {
			return run.getFeatureBranch( state ).then( () => {
				expect( state ).toHaveProperty( "branch" );
				expect( state.branch ).toEqual( "feature-branch" );
			} );
		} );
	} );

	describe( "gitFetchUpstream", () => {
		it( "should return the result of `git.fetchUpstream`", () => {
			git.fetchUpstream = jest.fn( () => Promise.resolve() );

			return run.gitFetchUpstream( state ).then( () => {
				expect( git.fetchUpstream ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "gitMergeUpstreamBranch", () => {
		it( "should call `git.merge` with the appropriate arguments", () => {
			state.branch = "feature-branch";
			git.merge = jest.fn( () => Promise.resolve() );

			return run.gitMergeUpstreamBranch( state ).then( () => {
				expect( git.merge ).toHaveBeenCalledTimes( 1 );
				expect( git.merge ).toHaveBeenCalledWith( "upstream/feature-branch", true, "gitMergeUpstreamBranch" );
			} );
		} );
	} );

	describe( "gitMergeUpstreamMaster", () => {
		it( "should return the result of `git.mergeUpstreamMaster`", () => {
			git.mergeUpstreamMaster = jest.fn( () => Promise.resolve() );

			return run.gitMergeUpstreamMaster( state ).then( () => {
				expect( git.mergeUpstreamMaster ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "gitMergeUpstreamDevelop", () => {
		it( "should return the result of `git.mergeUpstreamDevelop` when there is an upstream develop branch", () => {
			state.hasDevelopBranch = true;
			git.mergeUpstreamDevelop = jest.fn( () => Promise.resolve() );

			return run.gitMergeUpstreamDevelop( state ).then( () => {
				expect( git.mergeUpstreamDevelop ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should do nothing when there is no upstream develop branch", () => {
			git.mergeUpstreamDevelop = jest.fn( () => Promise.resolve() );

			return run.gitMergeUpstreamDevelop( state ).then( () => {
				expect( git.mergeUpstreamDevelop ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( "gitMergePromotionBranch", () => {
		it( "should return the result of `git.mergePromotionBranch`", () => {
			state.promote = "v1.1.1";
			git.mergePromotionBranch = jest.fn( () => Promise.resolve() );

			return run.gitMergePromotionBranch( state ).then( () => {
				expect( git.mergePromotionBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.mergePromotionBranch ).toHaveBeenCalledWith( "v1.1.1" );
			} );
		} );
	} );

	describe( "checkHasDevelopBranch", () => {
		it( "should set `hasDevelopBranch` to true on state when an `upstream/develop` branch exists", () => {
			const branches = "branch-one\nbranch-two\nbranch-three\nupstream/branch-one\nupstream/branch-two\nupstream/branch-three\nupstream/develop";
			git.getRemoteBranches = jest.fn( () => Promise.resolve( branches ) );

			return run.checkHasDevelopBranch( state ).then( () => {
				expect( git.getRemoteBranches ).toHaveBeenCalledTimes( 1 );
				expect( state ).toHaveProperty( "hasDevelopBranch" );
				expect( state.hasDevelopBranch ).toBeTruthy();
			} );
		} );

		it( "should set `hasDevelopBranch` to false on state when no `upstream/develop` branch exists", () => {
			const branches = "branch-one\nbranch-two\nbranch-three\nupstream/branch-one\nupstream/branch-two\nupstream/branch-three";
			git.getRemoteBranches = jest.fn( () => Promise.resolve( branches ) );

			return run.checkHasDevelopBranch( state ).then( () => {
				expect( git.getRemoteBranches ).toHaveBeenCalledTimes( 1 );
				expect( state ).toHaveProperty( "hasDevelopBranch" );
				expect( state.hasDevelopBranch ).toBeFalsy();
			} );
		} );

		it( "should set `hasDevelopBranch` to false on state when the command throws an error", () => {
			git.getRemoteBranches = jest.fn( () => Promise.reject() );

			return run.checkHasDevelopBranch( state ).then( () => {
				expect( git.getRemoteBranches ).toHaveBeenCalledTimes( 1 );
				expect( state ).toHaveProperty( "hasDevelopBranch" );
				expect( state.hasDevelopBranch ).toBeFalsy();
			} );
		} );
	} );

	describe( "askPrereleaseIdentifier", () => {
		beforeEach( () => {
			util.prompt = jest.fn( () => Promise.resolve( { prereleaseIdentifier: "pre" } ) );
		} );

		it( "should not prompt if an identifier was provided at the command line", () => {
			state = { identifier: "test" };
			return run.askPrereleaseIdentifier( state ).then( () => {
				expect( util.prompt ).not.toHaveBeenCalled();
			} );
		} );

		it( "should prompt the user for a prerelease identifier", () => {
			return run.askPrereleaseIdentifier( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "input",
					name: "prereleaseIdentifier",
					message: "Pre-release Identifier:"
				} ] );
			} );
		} );

		it( "should persist the given identifier to the workflow state", () => {
			return run.askPrereleaseIdentifier( state ).then( () => {
				expect( state ).toHaveProperty( "identifier" );
				expect( state.identifier ).toEqual( "pre" );
			} );
		} );
	} );

	describe( "selectPrereleaseToPromote", () => {
		beforeEach( () => {
			util.prompt = jest.fn( () => Promise.resolve( { prereleaseIdentifier: "pre" } ) );
			git.getPrereleaseTagList = jest.fn( () => Promise.resolve( [
				"v18.0.0-robert.0",
				"v17.12.0-break.1",
				"v17.11.2-no-break.0",
				"v17.11.0-no-conflict.1",
				"v17.10.6-conflict.4"
			] ) );
		} );

		it( "should not prompt if tag was provided at the command line", () => {
			state = { promote: "v1.1.1-feature.0" };
			return run.selectPrereleaseToPromote( state ).then( () => {
				expect( util.prompt ).not.toHaveBeenCalled();
			} );
		} );

		it( "should prompt with the latest tags for promotion", () => {
			state = { promote: true };
			return run.selectPrereleaseToPromote( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "list",
					name: "prereleaseToPromote",
					message: "Select the pre-release you wish to promote:",
					choices: [
						"v18.0.0-robert.0",
						"v17.12.0-break.1",
						"v17.11.2-no-break.0",
						"v17.11.0-no-conflict.1",
						"v17.10.6-conflict.4"
					]
				} ] );
			} );
		} );

		describe( "should persist the selected promote option to state", () => {
			const prereleases = [
				"v18.0.0-robert.0",
				"v17.12.0-break.1",
				"v17.11.2-no-break.0",
				"v17.11.0-no-conflict.1",
				"v17.10.6-conflict.4"
			];

			prereleases.forEach( prereleaseToPromote => {
				it( `when "${ prereleaseToPromote }" is selected`, () => {
					state = { promote: true };
					git.getPrereleaseTagList = jest.fn( () => Promise.resolve( prereleases ) );
					util.prompt = jest.fn( () => Promise.resolve( { prereleaseToPromote } ) );
					return run.selectPrereleaseToPromote( state ).then( () => {
						expect( state ).toHaveProperty( "promote" );
						expect( state.promote ).toEqual( prereleaseToPromote );
					} );
				} );
			} );
		} );
	} );

	describe( "gitCheckoutMaster", () => {
		it( "should set `branch` on state to `master`", () => {
			git.checkoutMaster = jest.fn( () => Promise.resolve() );

			return run.gitCheckoutMaster( state ).then( () => {
				expect( state ).toHaveProperty( "branch" );
				expect( state.branch ).toEqual( "master" );
			} );
		} );

		it( "should return the result of `git.checkoutMaster`", () => {
			git.checkoutMaster = jest.fn( () => Promise.resolve() );

			return run.gitCheckoutMaster( state ).then( () => {
				expect( git.checkoutMaster ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "getCurrentBranchVersion", () => {
		beforeEach( () => {
			state.configPath = "./package.json";
			util.readJSONFile = jest.fn( () => ( { version: "1.2.3" } ) );
		} );

		it( "should call `util.readJSONFile`", () => {
			return run.getCurrentBranchVersion( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.readJSONFile ).toHaveBeenCalledWith( "./package.json" );
			} );
		} );

		it( "should write the current version from the config file to state", () => {
			return run.getCurrentBranchVersion( state ).then( () => {
				expect( state ).toHaveProperty( "currentVersion" );
				expect( state.currentVersion ).toEqual( "1.2.3" );
			} );
		} );

		it( "should advise when the call to `util.readJSONFile` fails", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			util.readJSONFile = jest.fn( () => {
				throw new Error( "nope" );
			} );

			return run.getCurrentBranchVersion( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "updateVersion" );
			} );
		} );
	} );

	describe( "gitShortLog", () => {
		beforeEach( () => {
			state.currentVersion = "1.2.3";
			util.writeFile = jest.fn( () => {} );
		} );

		it( "should read the contents of the CHANGELOG.md file", () => {
			git.runCommand = jest.fn( () => Promise.resolve( "* some log comment" ) );
			util.readFile = jest.fn( () => "sample content" );
			run.gitShortLog( {}, {} );
			expect( util.readFile ).toHaveBeenCalledTimes( 1 );
			expect( util.readFile ).toHaveBeenCalledWith( "./CHANGELOG.md" );
		} );

		describe( "when a line containing `### Next` exists in the CHANGELOG.md contents", () => {
			beforeEach( () => {
				util.readFile = jest.fn( () => ( "### Next\n\n* one\n* two\n* three" ) );
			} );

			it( "should strip it out and write the remaining contents of it to state", () => {
				run.gitShortLog( state );
				expect( state ).toHaveProperty( "log" );
				expect( state.log ).toEqual( "* one\n* two\n* three" );
			} );

			it( "should empty the contents of the CHANGELOG.md file", () => {
				util.writeFile = jest.fn( () => {} );

				run.gitShortLog( state );
				expect( util.writeFile ).toHaveBeenCalledTimes( 1 );
				expect( util.writeFile ).toHaveBeenCalledWith( "./CHANGELOG.md", "" );
			} );
		} );

		describe( "when no line containing `### Next` exists in the CHANGELOG.md contents", () => {
			beforeEach( () => {
				util.readFile = jest.fn( () => ( "* four\n* five\n* six\n* seven" ) );
				util.advise = jest.fn( () => {} );
				git.shortLog = jest.fn( () => Promise.resolve( "eight\nnine\nten" ) );
				git.getTagList = jest.fn( () => Promise.resolve( [
					"v0.1.0",
					"v0.2.0",
					"v0.3.0",
					"v0.4.0",
					"v0.5.0",
					"v0.6.0",
					"v0.7.0",
					"v0.8.0",
					"v0.9.0",
					"v0.9.1",
					"v0.9.1-pre-1",
					"v0.9.1-pre-2",
					"v0.9.1-pre-3",
					"v0.9.1-pre-4"
				] ) );
			} );

			it( "should advise when the call to `git.getTagList` fails", () => {
				git.getTagList = jest.fn( () => Promise.reject( "nope" ) );

				return run.gitShortLog( state ).then( () => {
					expect( util.advise ).toHaveBeenCalledTimes( 1 );
					expect( util.advise ).toHaveBeenCalledWith( "gitLog.log" );
				} );
			} );

			describe( "and not in prerelease mode", () => {
				beforeEach( () => {
					state = {
						currentVersion: "1.2.3",
						prerelease: false
					};
				} );

				it( "should get a list of tags", () => {
					return run.gitShortLog( state ).then( () => {
						expect( git.getTagList ).toHaveBeenCalledTimes( 1 );
					} );
				} );

				it( "should get a git log with the latest release from the list of tags returned", () => {
					return run.gitShortLog( state ).then( () => {
						expect( git.shortLog ).toHaveBeenCalledTimes( 1 );
						expect( git.shortLog ).toHaveBeenCalledWith( "v0.9.1" );
					} );
				} );

				it( "should get all logs when there are no tags", () => {
					git.getTagList = jest.fn( () => Promise.resolve( [] ) );

					return run.gitShortLog( state ).then( () => {
						expect( git.shortLog ).toHaveBeenCalledTimes( 1 );
						expect( git.shortLog ).toHaveBeenCalledWith( "v1.2.3" );
					} );
				} );

				it( "should advise when the attempt to get all logs returns no data", () => {
					git.shortLog = jest.fn( () => Promise.resolve( "" ) );

					return run.gitShortLog( state ).then( () => {
						expect( util.advise ).toHaveBeenCalledTimes( 1 );
						expect( util.advise ).toHaveBeenCalledWith( "gitLog.log", { exit: false } );
					} );
				} );

				it( "should save log data to state", () => {
					return run.gitShortLog( state ).then( () => {
						expect( state ).toHaveProperty( "log" );
						expect( state.log ).toEqual( "* eight\n* nine\n* ten" );
					} );
				} );
			} );

			describe( "and in prerelease mode", () => {
				beforeEach( () => {
					state = {
						currentVersion: "1.2.3",
						prerelease: true
					};
				} );

				it( "should use the current version when fetching log data", () => {
					return run.gitShortLog( state ).then( () => {
						expect( git.shortLog ).toHaveBeenCalledTimes( 1 );
						expect( git.shortLog ).toHaveBeenCalledWith( "v1.2.3" );
					} );
				} );
			} );
		} );
	} );

	describe( "previewLog", () => {
		beforeEach( () => {
			state.log = "* I am some random commit";
			logger.log = jest.fn( () => arg => arg );
		} );

		it( "should show logs when provided", () => {
			run.previewLog( state );
			expect( logger.log ).toHaveBeenCalledTimes( 1 );
			expect( logger.log ).toHaveBeenCalledWith( "Here is a preview of your log:\n* I am some random commit" );
		} );

		it( "should show a blank line when no logs are provided", () => {
			state.log = "";
			run.previewLog( state );
			expect( logger.log ).toHaveBeenCalledTimes( 1 );
			expect( logger.log ).toHaveBeenCalledWith( "Here is a preview of your log:\n" );
		} );
	} );

	describe( "askSemverJump", () => {
		beforeEach( () => {
			state.currentVersion = "1.2.3";
			util.prompt = jest.fn( () => Promise.resolve( { release: "test" } ) );
			util.advise = jest.fn( () => {} );
		} );

		describe( "when the prerelease option is false", () => {
			it( "should prompt the user with choices for Major, Minor and Patch releases", () => {
				return run.askSemverJump( state ).then( () => {
					expect( util.prompt ).toHaveBeenCalledTimes( 1 );
					expect( util.prompt ).toHaveBeenCalledWith( [ {
						type: "list",
						name: "release",
						message: "What type of release is this",
						choices: [
							{ name: "Major (Breaking Change) v2.0.0", value: "major", short: "l" },
							{ name: "Minor (New Feature) v1.3.0", value: "minor", short: "m" },
							{ name: "Patch (Bug Fix) v1.2.4", value: "patch", short: "s" }
						]
					} ] );
				} );
			} );
		} );

		describe( "when the prerelease option is true", () => {
			it( "should prompt the user with choices for Pre-major, Pre-minor, Pre-patch and Pre-release releases", () => {
				state = {
					currentVersion: "1.2.3",
					prerelease: true,
					identifier: "test"
				};

				return run.askSemverJump( state ).then( () => {
					expect( util.prompt ).toHaveBeenCalledTimes( 1 );
					expect( util.prompt ).toHaveBeenCalledWith( [ {
						type: "list",
						name: "release",
						message: "What type of release is this",
						choices: [
							{ name: "Pre-major (Breaking Change) v2.0.0-test.0", value: "premajor", short: "p-l" },
							{ name: "Pre-minor (New Feature) v1.3.0-test.0", value: "preminor", short: "p-m" },
							{ name: "Pre-patch (Bug Fix) v1.2.4-test.0", value: "prepatch", short: "p-s" },
							{ name: "Pre-release (Bump existing Pre-release) v1.2.4-test.0", value: "prerelease", short: "p-r" }
						]
					} ] );
				} );
			} );
		} );

		describe( "when the release option has been provided", () => {
			it( "should not prompt the user to select a release option", () => {
				state = {
					currentVersion: "1.2.3",
					release: "prepatch"
				};

				return run.askSemverJump( state ).then( () => {
					expect( util.prompt ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( "should persist the selected release option to state", () => {
			const releaseTypes = [
				"major",
				"minor",
				"patch",
				"premajor",
				"preminor",
				"prepatch",
				"prerelease"
			];

			releaseTypes.forEach( release => {
				it( `when "${ release }"" is selected`, () => {
					util.prompt = jest.fn( () => Promise.resolve( { release } ) );
					return run.askSemverJump( state ).then( () => {
						expect( state ).toHaveProperty( "release" );
						expect( state.release ).toEqual( release );
					} );
				} );
			} );
		} );
	} );

	describe( "updateLog", () => {
		beforeEach( () => {
			state.log = "the originally persisted log message";
			util.editLog = jest.fn( () => Promise.resolve( " an updated commit message " ) );
		} );

		it( "should prompt asking the user if they wish to edit the log", () => {
			return run.updateLog( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "confirm",
					name: "log",
					message: "Would you like to edit your log",
					default: true
				} ] );
			} );
		} );

		describe( "when the user chooses to edit the log", () => {
			beforeEach( () => {
				util.prompt = jest.fn( () => Promise.resolve( { log: true } ) );
			} );

			it( "should launch the user's editor", () => {
				return run.updateLog( state ).then( () => {
					expect( util.editLog ).toHaveBeenCalledTimes( 1 );
					expect( util.editLog ).toHaveBeenCalledWith( "the originally persisted log message" );
				} );
			} );

			it( "should trim the data from the editor, and persist the result to state", () => {
				return run.updateLog( state ).then( () => {
					expect( state ).toHaveProperty( "log" );
					expect( state.log ).toEqual( "an updated commit message" );
				} );
			} );

			it( "should log the action to the console", () => {
				return run.updateLog( state ).then( () => {
					expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
					expect( util.log.begin ).toHaveBeenCalledWith( "log preview" );
					expect( util.log.end ).toHaveBeenCalledTimes( 1 );
				} );
			} );
		} );

		describe( "when the user declines to edit the log", () => {
			it( "should not launch the user's editor", () => {
				util.prompt = jest.fn( () => Promise.resolve( { log: false } ) );
				return run.updateLog( state ).then( () => {
					expect( util.editLog ).not.toHaveBeenCalled();
				} );
			} );
		} );
	} );

	describe( "updateVersion", () => {
		beforeEach( () => {
			state = {
				configPath: "./package.json",
				currentVersion: "1.2.3",
				identifier: undefined,
				release: "minor"
			};
		} );

		it( "should read from the given configuration file", () => {
			run.updateVersion( state );
			expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
			expect( util.readJSONFile ).toHaveBeenCalledWith( "./package.json" );
		} );

		it( "should call `semver.inc` with the selected release", () => {
			const originalInc = semver.inc;
			semver.inc = jest.fn( () => ( "1.3.0" ) );
			run.updateVersion( state );
			expect( semver.inc ).toHaveBeenCalledTimes( 1 );
			expect( semver.inc ).toHaveBeenCalledWith( "1.2.3", "minor", undefined );
			semver.inc = originalInc;
		} );

		it( "should write the updated version to the given configuration file", () => {
			util.writeJSONFile = jest.fn( () => {} );
			run.updateVersion( state );
			expect( util.writeJSONFile ).toHaveBeenCalledTimes( 1 );
			expect( util.writeJSONFile ).toHaveBeenCalledWith( "./package.json", { version: "1.3.0" } );
		} );

		it( "should advise when reading `package.json` fails", () => {
			util.readJSONFile = jest.fn( () => {
				throw new Error( "nope" );
			} );

			run.updateVersion( state );
			expect( util.advise ).toHaveBeenCalledTimes( 1 );
			expect( util.advise ).toHaveBeenCalledWith( "updateVersion" );
		} );

		it( "should use alternate configuration file when provided", () => {
			state = {
				configPath: "./manifest.json",
				currentVersion: "1.2.3",
				identifier: undefined,
				release: "minor"
			};

			util.readJSONFile = jest.fn( () => ( { version: "1.2.3" } ) );

			run.updateVersion( state );
			expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
			expect( util.readJSONFile ).toHaveBeenCalledWith( "./manifest.json" );
		} );

		it( "should update alternate configuration file when provided", () => {
			state = {
				configPath: "./manifest.json",
				currentVersion: "1.2.3",
				identifier: undefined,
				release: "minor"
			};

			util.readJSONFile = jest.fn( () => ( { version: "1.2.3" } ) );
			util.writeJSOnFile = jest.fn( () => {} );

			run.updateVersion( state );
			expect( util.writeJSONFile ).toHaveBeenCalledTimes( 1 );
			expect( util.writeJSONFile ).toHaveBeenCalledWith( "./manifest.json", { version: "1.3.0" } );
		} );
	} );

	describe( "updateChangelog", () => {
		const originalConsoleLog = console.log; // eslint-disable-line no-console

		beforeEach( () => {
			state = {
				versions: {
					newVersion: "1.3.0"
				},
				log: "* commit message",
				release: "minor"
			};

			util.readFile = jest.fn( () => ( "## 1.x\n\n### 1.2.3\n\n* update to v1.2.3" ) );
			util.writeFile = jest.fn( () => {} );
			console.log = jest.fn( () => {} ); // eslint-disable-line no-console
		} );

		afterEach( () => {
			console.log = originalConsoleLog; // eslint-disable-line no-console
		} );

		it( "should log the action to the console", () => {
			run.updateChangelog( state );
			expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
			expect( util.log.end ).toHaveBeenCalledTimes( 1 );
		} );

		it( "should read the current contents of CHANGELOG.md", () => {
			run.updateChangelog( state );
			expect( util.readFile ).toHaveBeenCalledTimes( 1 );
			expect( util.readFile ).toHaveBeenCalledWith( "./CHANGELOG.md" );
		} );

		it( "should insert an H3 header for minor and patch changes", () => {
			run.updateChangelog( state );
			const contents = "## 1.x\n\n### 1.3.0\n\n* commit message\n\n### 1.2.3\n\n* update to v1.2.3";
			expect( util.writeFile ).toHaveBeenCalledTimes( 1 );
			expect( util.writeFile ).toHaveBeenCalledWith( "./CHANGELOG.md", contents );
		} );

		it( "should insert an H2 header for major changes", () => {
			state.release = "major";
			state.versions.newVersion = "2.0.0";
			run.updateChangelog( state );
			const contents = "## 2.x\n\n### 2.0.0\n\n* commit message\n\n## 1.x\n\n### 1.2.3\n\n* update to v1.2.3";
			expect( util.writeFile ).toHaveBeenCalledTimes( 1 );
			expect( util.writeFile ).toHaveBeenCalledWith( "./CHANGELOG.md", contents );
		} );

		it( "should create a new entry in CHANGELOG.md for minor/defect changes", () => {
			util.readFile = jest.fn( () => ( "" ) );
			state = {
				release: "minor",
				log: "* just little stuff",
				versions: {
					newVersion: "2.0.1"
				}
			};

			run.updateChangelog( state );
			const contents = "## 2.x\n\n### 2.0.1\n\n* just little stuff\n";
			expect( util.writeFile ).toHaveBeenCalledTimes( 1 );
			expect( util.writeFile ).toHaveBeenCalledWith( "./CHANGELOG.md", contents );
		} );
	} );

	describe( "gitDiff", () => {
		const originalProcessExit = process.exit;

		beforeEach( () => {
			state.configPath = "./package.json";
			git.diff = jest.fn( () => Promise.resolve( "diff" ) );
			util.prompt = jest.fn( () => Promise.resolve( { proceed: true } ) );
			logger.lg = jest.fn( arg => arg );
			process.exit = jest.fn( () => {} );
		} );

		afterEach( () => {
			process.exit = originalProcessExit;
		} );

		it( "should log the action to the console", () => {
			return run.gitDiff( state ).then( () => {
				expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
				expect( util.log.end ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should call `git.diff` with the appropriate arguments", () => {
			return run.gitDiff( state ).then( () => {
				expect( git.diff ).toHaveBeenCalledTimes( 1 );
				expect( git.diff ).toHaveBeenCalledWith( [ "./CHANGELOG.md", "./package.json" ] );
			} );
		} );

		it( "should prompt the user and ask if the diff is acceptable", () => {
			return run.gitDiff( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "confirm",
					name: "proceed",
					message: "Are you OK with this diff?",
					default: true
				} ] );
			} );
		} );

		it( "should exit the program if the user isn't OK with the diff", () => {
			util.prompt = jest.fn( () => Promise.resolve( { proceed: false } ) );

			return run.gitDiff( state ).then( () => {
				expect( process.exit ).toHaveBeenCalledTimes( 1 );
				expect( process.exit ).toHaveBeenCalledWith( 0 );
			} );
		} );
	} );

	describe( "gitAdd", () => {
		beforeEach( () => {
			state.configPath = "./manifest.json";
			git.add = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.add` with the appropriate arguments", () => {
			return run.gitAdd( state ).then( () => {
				expect( git.add ).toHaveBeenCalledTimes( 1 );
				expect( git.add ).toHaveBeenCalledWith( [ "./CHANGELOG.md", "./manifest.json" ] );
			} );
		} );
	} );

	describe( "gitCommit", () => {
		it( "should call `git.commit` with the appropriate arguments", () => {
			state = { versions: { newVersion: "1.2.3" } };
			git.commit = jest.fn( () => Promise.resolve() );
			return run.gitCommit( state ).then( () => {
				expect( git.commit ).toHaveBeenCalledTimes( 1 );
				expect( git.commit ).toHaveBeenCalledWith( "1.2.3" );
			} );
		} );
	} );

	describe( "gitTag", () => {
		it( "should call `git.tag` with the appropriate options", () => {
			state = { versions: { newVersion: "1.2.3" } };
			git.tag = jest.fn( () => Promise.resolve() );
			return run.gitTag( state ).then( () => {
				expect( git.tag ).toHaveBeenCalledTimes( 1 );
				expect( git.tag ).toHaveBeenCalledWith( "v1.2.3", "v1.2.3" );
			} );
		} );
	} );

	describe( "gitPushUpstreamMaster", () => {
		it( "should call `git.pushUpstreamMasterWithTags`", () => {
			git.pushUpstreamMasterWithTags = jest.fn( () => Promise.resolve() );
			return run.gitPushUpstreamMaster( state ).then( () => {
				expect( git.pushUpstreamMasterWithTags ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "npmPublish", () => {
		beforeEach( () => {
			state = { configPath: "./package.json" };
			util.prompt = jest.fn( () => Promise.resolve( { publish: true } ) );
			util.exec = jest.fn( () => Promise.resolve( "data" ) );
			util.isPackagePrivate = jest.fn( () => false );
			util.readJSONFile = jest.fn( () => ( {
				name: "test-project",
				publishConfig: {
					registry: "http://example-registry.com"
				}
			} ) );
		} );

		it( "should log the action to the console", () => {
			return run.npmPublish( state ).then( () => {
				expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
				expect( util.log.end ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should prompt the user to confirm whether or not they wish to publish", () => {
			return run.npmPublish( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "confirm",
					name: "publish",
					message: "Do you want to publish this package to http://example-registry.com?",
					default: true
				} ] );
			} );
		} );

		it( "should not publish if the user declines at the prompt", () => {
			util.prompt = jest.fn( () => Promise.resolve( { publish: false } ) );
			return run.npmPublish( state ).then( () => {
				expect( util.log.begin ).not.toHaveBeenCalled();
				expect( util.exec ).not.toHaveBeenCalled();
			} );
		} );

		it( "should not prompt if the package is private", () => {
			util.isPackagePrivate = jest.fn( () => true );
			util.getPackageRegistry = jest.fn( () => Promise.resolve() );
			run.npmPublish( state );
			expect( util.getPackageRegistry ).not.toHaveBeenCalled();
		} );

		it( "should advise when the call to `util.exec` fails", () => {
			util.exec = jest.fn( () => Promise.reject() );
			util.advise = jest.fn( () => {} );
			return run.npmPublish( state ).then( () => {
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "npmPublish", { exit: false } );
			} );
		} );

		it( "should do nothing when the given configuration file is not `package.json`", () => {
			state = { configPath: "./manifest.json" };
			util.isPackagePrivate = jest.fn( () => Promise.resolve() );
			run.npmPublish( state );
			expect( util.isPackagePrivate ).not.toHaveBeenCalled();
		} );

		it( "should log an error to the console when the call to `util.getPackageRegistry` fails", () => {
			util.getPackageRegistry = jest.fn( () => Promise.reject( "nope" ) );
			logger.log = jest.fn( () => {} );
			return run.npmPublish( state ).then( () => {
				expect( logger.log ).toHaveBeenCalledTimes( 1 );
				expect( logger.log ).toHaveBeenCalledWith( "nope" );
			} );
		} );
	} );

	describe( "gitCheckoutDevelop", () => {
		beforeEach( () => {
			git.checkoutDevelop = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.checkoutDevelop` when there is a develop branch", () => {
			state = { hasDevelopBranch: true };
			return run.gitCheckoutDevelop( state ).then( () => {
				expect( git.checkoutDevelop ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should do nothing if there is not develop branch", () => {
			run.gitCheckoutDevelop( state );
			expect( git.checkoutDevelop ).not.toHaveBeenCalled();
		} );
	} );

	describe( "gitMergeMaster", () => {
		beforeEach( () => {
			git.mergeMaster = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.mergeMaster` when there is a develop branch", () => {
			state = { hasDevelopBranch: true };
			return run.gitMergeMaster( state ).then( () => {
				expect( git.mergeMaster ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should do nothing when there is no develop branch", () => {
			run.gitMergeMaster( state );
			expect( git.mergeMaster ).not.toHaveBeenCalled();
		} );
	} );

	describe( "gitPushUpstreamDevelop", () => {
		beforeEach( () => {
			git.pushUpstreamDevelop = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.pushUpstreamDevelop` when there is a develop branch", () => {
			state = { hasDevelopBranch: true };
			return run.gitPushUpstreamDevelop( state ).then( () => {
				expect( git.pushUpstreamDevelop ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should do nothing when there is no develop branch", () => {
			run.gitPushUpstreamDevelop( state );
			expect( git.pushUpstreamDevelop ).not.toHaveBeenCalled();
		} );
	} );

	describe( "gitPushUpstreamFeatureBranch", () => {
		beforeEach( () => {
			git.push = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.push` with the appropriate options", () => {
			state = { branch: "feature-branch" };
			return run.gitPushUpstreamFeatureBranch( state ).then( () => {
				expect( git.push ).toHaveBeenCalledTimes( 1 );
				expect( git.push ).toHaveBeenCalledWith( "upstream feature-branch" );
			} );
		} );

		it( "should not call `git.push` when the current branch is not set on the workflow state", () => {
			run.gitPushUpstreamFeatureBranch( state );
			expect( git.push ).not.toHaveBeenCalled();
		} );
	} );

	describe( "gitForcePushUpstreamFeatureBranch", () => {
		beforeEach( () => {
			git.push = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.push` with the appropriate options", () => {
			state = { branch: "feature-branch" };
			return run.gitForcePushUpstreamFeatureBranch( state ).then( () => {
				expect( git.push ).toHaveBeenCalledTimes( 1 );
				expect( git.push ).toHaveBeenCalledWith( "-f upstream feature-branch" );
			} );
		} );

		it( "should not call `git.push` when the current branch is not set on the workflow state", () => {
			run.gitForcePushUpstreamFeatureBranch( state );
			expect( git.push ).not.toHaveBeenCalled();
		} );
	} );

	describe( "gitPushOriginMaster", () => {
		it( "should call `git.pushOriginMaster`", () => {
			git.pushOriginMaster = jest.fn( () => Promise.resolve() );
			return run.gitPushOriginMaster( state ).then( () => {
				expect( git.pushOriginMaster ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "githubUpstream", () => {
		it( "should call `util.exec` with the appropriate arguments to get the upstream repository url", () => {
			util.exec = jest.fn( () => Promise.resolve( "https://github.com/leankit-labs/tag-release.git" ) );
			return run.githubUpstream( state ).then( () => {
				expect( util.exec ).toHaveBeenCalledTimes( 1 );
				expect( util.exec ).toHaveBeenCalledWith( "git config remote.upstream.url" );
			} );
		} );

		it( "should log an error to the console when the call to `util.exec` fails", () => {
			util.exec = jest.fn( () => Promise.reject( "nope" ) );
			logger.log = jest.fn( () => {} );
			return run.githubUpstream( state ).then( () => {
				expect( logger.log ).toHaveBeenCalledTimes( 1 );
				expect( logger.log ).toHaveBeenCalledWith( "error", "nope" );
			} );
		} );

		describe( "when an https uri is returned", () => {
			it( "should extract the correct repository owner and name given https://github.com/leanKit-labs/tag-release.git", () => {
				util.exec = jest.fn( () => Promise.resolve( "https://github.com/leankit-labs/tag-release.git" ) );
				return run.githubUpstream( state ).then( () => {
					expect( state ).toEqual( {
						github: {
							owner: "leankit-labs",
							name: "tag-release"
						}
					} );
				} );
			} );

			it( "should extract the correct repository owner and name given https://github.com/banditsoftware/web-lightning-ui.git", () => {
				util.exec = jest.fn( () => Promise.resolve( "https://github.com/banditsoftware/web-lightning-ui.git" ) );
				return run.githubUpstream( state ).then( () => {
					expect( state ).toEqual( {
						github: {
							owner: "banditsoftware",
							name: "web-lightning-ui"
						}
					} );
				} );
			} );
		} );

		describe( "when an ssh uri is returned", () => {
			it( "should extract the correct repository owner and name given git@github.com:leankit-labs/tag-release.git", () => {
				util.exec = jest.fn( () => Promise.resolve( "git@github.com:leankit-labs/tag-release.git" ) );
				return run.githubUpstream( state ).then( () => {
					expect( state ).toEqual( {
						github: {
							owner: "leankit-labs",
							name: "tag-release"
						}
					} );
				} );
			} );

			it( "should extract the correct repository owner and name given git@github.com:banditsoftware/web-lightning-ui.git", () => {
				util.exec = jest.fn( () => Promise.resolve( "git@github.com:banditsoftware/web-lightning-ui.git" ) );
				return run.githubUpstream( state ).then( () => {
					expect( state ).toEqual( {
						github: {
							owner: "banditsoftware",
							name: "web-lightning-ui"
						}
					} );
				} );
			} );
		} );

		describe( "when no data is returned", () => {
			it( "should set the github object on state to an empty object", () => {
				util.exec = jest.fn( () => Promise.resolve( "" ) );
				return run.githubUpstream( state ).then( () => {
					expect( state ).toEqual( { github: {} } );
				} );
			} );
		} );
	} );

	describe( "githubRelease", () => {
		GitHub.mockImplementation( jest.fn() );
		let getRepo = jest.fn();
		let createRelease = jest.fn();

		const mockCreateRelease = ( shouldResolve = true ) => {
			if ( shouldResolve ) {
				createRelease = jest.fn( () => Promise.resolve( {
					data: {
						html_url: "http://example.com" // eslint-disable-line camelcase
					}
				} ) );

				return createRelease;
			}

			createRelease = jest.fn( () => Promise.reject( "nope" ) );

			return createRelease;
		};

		const mockGitHub = ( createReleaseShouldResolve = true ) => {
			createRelease = mockCreateRelease( createReleaseShouldResolve );
			getRepo = jest.fn( () => ( {
				createRelease
			} ) );

			return jest.fn( () => ( { getRepo } ) );
		};

		beforeEach( () => {
			state = {
				log: "* Added last feature\n* Added second feature\n* Added first feature",
				versions: {
					newVersion: "1.2.3"
				},
				github: { owner: "someone-awesome", name: "something-awesome" },
				token: "z8259r",
				prerelease: false
			};

			util.prompt = jest.fn( () => Promise.resolve( { name: "Something awesome" } ) );
			GitHub.mockImplementation( mockGitHub() );
		} );

		it( "should create a new GitHub client instance given a valid auth token", () => {
			return run.githubRelease( state ).then( () => {
				expect( GitHub ).toHaveBeenCalledTimes( 1 );
				expect( GitHub ).toHaveBeenCalledWith( { token: "z8259r" } );
			} );
		} );

		it( "should prompt the user for a name for the release", () => {
			return run.githubRelease( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "input",
					name: "name",
					message: "What do you want to name the release?",
					default: "Added first feature"
				} ] );
			} );
		} );

		it( "should use use the most recent message from the log as the default value for the name of the release when prompting the user", () => {
			state.log = "* Added last feature\n* Added second feature\n* stavesacre rocks";
			return run.githubRelease( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "input",
					name: "name",
					message: "What do you want to name the release?",
					default: "stavesacre rocks"
				} ] );
			} );
		} );

		it( "should log the action to the console", () => {
			return run.githubRelease( state ).then( () => {
				expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
				expect( util.log.end ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should create an instance of a repository object with the previously fetched repository owner and name", () => {
			return run.githubRelease( state ).then( () => {
				expect( getRepo ).toHaveBeenCalledTimes( 1 );
				expect( getRepo ).toHaveBeenCalledWith( "someone-awesome", "something-awesome" );
			} );
		} );

		it( "should call the GitHub API to create a new release for the repository", () => {
			return run.githubRelease( state ).then( () => {
				expect( createRelease ).toHaveBeenCalledTimes( 1 );
				expect( createRelease ).toHaveBeenCalledWith( {
					tag_name: "v1.2.3", // eslint-disable-line camelcase
					name: "Something awesome",
					body: "* Added last feature\n* Added second feature\n* Added first feature",
					prerelease: false
				} );
			} );
		} );

		it( "should log an error to the console when the call to the API to create a release fails", () => {
			logger.log = jest.fn();
			GitHub.mockImplementation( mockGitHub( false ) );

			return run.githubRelease( state ).then( () => {
				expect( logger.log ).toHaveBeenCalledTimes( 1 );
				expect( logger.log ).toHaveBeenCalledWith( "nope" );
			} );
		} );
	} );

	describe( "checkForUncommittedChanges", () => {
		it( "should call `git.uncommittedChangesExist`", () => {
			git.uncommittedChangesExist = jest.fn( () => Promise.resolve( "5c9f72f455a00d8e6db9a4be9b0ac2cd4885b0b4" ) );
			return run.checkForUncommittedChanges( state ).then( () => {
				expect( git.uncommittedChangesExist ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should persist the result to the workflow state", () => {
			git.uncommittedChangesExist = jest.fn( () => Promise.resolve( "5c9f72f455a00d8e6db9a4be9b0ac2cd4885b0b4" ) );
			return run.checkForUncommittedChanges( state ).then( () => {
				expect( state ).toHaveProperty( "uncommittedChangesExist" );
				expect( state.uncommittedChangesExist ).toBeTruthy();
			} );
		} );

		it( "should return false if there are no uncommitted changes", () => {
			git.uncommittedChangesExist = jest.fn( () => Promise.resolve( "" ) );
			return run.checkForUncommittedChanges( state ).then( () => {
				expect( state ).toHaveProperty( "uncommittedChangesExist" );
				expect( state.uncommittedChangesExist ).toBeFalsy();
			} );
		} );
	} );

	describe( "gitStash", () => {
		it( "should call `git.stash`", () => {
			git.stash = jest.fn( () => Promise.resolve() );
			util.advise = jest.fn();
			return run.gitStash( state ).then( () => {
				expect( git.stash ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "gitStash", { exit: false } );
			} );
		} );
	} );

	describe( "stashIfUncommittedChangesExist", () => {
		it( "should call `git.stash` when uncommitted changes exist", () => {
			state = { uncommittedChangesExist: true };
			git.stash = jest.fn( () => Promise.resolve() );
			return run.stashIfUncommittedChangesExist( state ).then( () => {
				expect( git.stash ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should not call `gitStash` when uncommitted changes do not exist", () => {
			git.stash = jest.fn( () => Promise.resolve() );
			run.stashIfUncommittedChangesExist( state );
			expect( git.stash ).not.toHaveBeenCalled();
		} );
	} );

	describe( "verifyMasterBranch", () => {
		beforeEach( () => {
			git.branchExists = jest.fn( () => Promise.resolve( true ) );
			git.createLocalBranch = jest.fn();
		} );

		it( "should call `git.branchExists` with the appropriate arguments", () => {
			return run.verifyMasterBranch().then( () => {
				expect( git.branchExists ).toHaveBeenCalledTimes( 1 );
				expect( git.branchExists ).toHaveBeenCalledWith( "master" );
			} );
		} );

		it( "should not call `git.createLocalBranch` when the branch does exist locally", () => {
			return run.verifyMasterBranch().then( () => {
				expect( git.createLocalBranch ).not.toHaveBeenCalled();
			} );
		} );

		it( "should call `git.createLocalBranch` when the branch doesn't exist locally", () => {
			git.branchExists = jest.fn( () => Promise.resolve( false ) );
			return run.verifyMasterBranch().then( () => {
				expect( git.createLocalBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.createLocalBranch ).toHaveBeenCalledWith( "master" );
			} );
		} );
	} );

	describe( "verifyDevelopBranch", () => {
		beforeEach( () => {
			git.branchExists = jest.fn( () => Promise.resolve( true ) );
			git.createLocalBranch = jest.fn();
		} );

		it( "should call `git.branchExists` with the appropriate arguments", () => {
			return run.verifyDevelopBranch().then( () => {
				expect( git.branchExists ).toHaveBeenCalledTimes( 1 );
				expect( git.branchExists ).toHaveBeenCalledWith( "develop" );
			} );
		} );

		it( "should not call `git.createLocalBranch` when the branch does exist locally", () => {
			return run.verifyDevelopBranch().then( () => {
				expect( git.createLocalBranch ).not.toHaveBeenCalled();
			} );
		} );

		it( "should call `git.createLocalBranch` when the branch doesn't exist locally", () => {
			state.hasDevelopBranch = true;
			git.branchExists = jest.fn( () => Promise.resolve( false ) );
			return run.verifyDevelopBranch( state ).then( () => {
				expect( git.createLocalBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.createLocalBranch ).toHaveBeenCalledWith( "develop" );
			} );
		} );

		it( "should not call `git.createLocalBranch` when the branch doesn't exist locally and on remote", () => {
			git.branchExists = jest.fn( () => Promise.resolve( false ) );
			return run.verifyDevelopBranch( state ).then( () => {
				expect( git.createLocalBranch ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( "resetMaster", () => {
		it( "should call `git.resetBranch` with the appropriate arguments", () => {
			git.resetBranch = jest.fn( () => Promise.resolve() );
			return run.gitResetMaster().then( () => {
				expect( git.resetBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.resetBranch ).toHaveBeenCalledWith( "master" );
			} );
		} );
	} );

	describe( "resetDevelop", () => {
		it( "should call `git.resetBranch` with the appropriate arguments", () => {
			state.hasDevelopBranch = true;
			git.resetBranch = jest.fn( () => Promise.resolve() );
			return run.gitResetDevelop( state ).then( () => {
				expect( git.resetBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.resetBranch ).toHaveBeenCalledWith( "develop" );
			} );
		} );

		it( "should not call `git.resetBranch` with no develop branch on upstream", () => {
			git.resetBranch = jest.fn( () => Promise.resolve() );
			return run.gitResetDevelop( state ).then( () => {
				expect( git.resetBranch ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( "gitCheckoutTag", () => {
		it( "should call `git.checkoutTag` with the appropriate arguments when tag includes `v`", () => {
			state.promote = "v1.1.1";
			git.checkoutTag = jest.fn( () => Promise.resolve() );
			return run.gitCheckoutTag( state ).then( () => {
				expect( git.checkoutTag ).toHaveBeenCalledTimes( 1 );
				expect( git.checkoutTag ).toHaveBeenCalledWith( "v1.1.1" );
			} );
		} );

		it( "should call `git.checkoutTag` with the appropriate arguments when tag excludes `v`", () => {
			state.promote = "1.1.1";
			git.checkoutTag = jest.fn( () => Promise.resolve() );
			return run.gitCheckoutTag( state ).then( () => {
				expect( git.checkoutTag ).toHaveBeenCalledTimes( 1 );
				expect( git.checkoutTag ).toHaveBeenCalledWith( "v1.1.1" );
			} );
		} );
	} );

	describe( "gitGenerateRebaseCommitLog", () => {
		it( "should call `git.generateRebaseCommitLog` with the appropriate arguments", () => {
			state.promote = "v1.1.1";
			git.generateRebaseCommitLog = jest.fn( () => Promise.resolve() );
			return run.gitGenerateRebaseCommitLog( state ).then( () => {
				expect( git.generateRebaseCommitLog ).toHaveBeenCalledTimes( 1 );
				expect( git.generateRebaseCommitLog ).toHaveBeenCalledWith( "v1.1.1" );
			} );
		} );
	} );

	describe( "gitRemovePreReleaseCommits", () => {
		it( "should call `git.removePreReleaseCommits`", () => {
			git.removePreReleaseCommits = jest.fn( () => Promise.resolve() );
			return run.gitRemovePreReleaseCommits( state ).then( () => {
				expect( git.removePreReleaseCommits ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "gitRebaseUpstreamMaster", () => {
		it( "should call `git.rebaseUpstreamMaster`", () => {
			git.rebaseUpstreamMaster = jest.fn( () => Promise.resolve() );
			return run.gitRebaseUpstreamMaster().then( () => {
				expect( git.rebaseUpstreamMaster ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "gitRemovePromotionBranches", () => {
		it( "should call `git.removePromotionBranches`", () => {
			git.removePromotionBranches = jest.fn( () => Promise.resolve() );
			return run.gitRemovePromotionBranches().then( () => {
				expect( git.removePromotionBranches ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "gitStageFiles", () => {
		it( "should call `git.stageFiles`", () => {
			git.stageFiles = jest.fn( () => Promise.resolve() );
			return run.gitStageFiles().then( () => {
				expect( git.stageFiles ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "gitRebaseContinue", () => {
		it( "should call `git.rebaseContinue`", () => {
			git.rebaseContinue = jest.fn( () => Promise.resolve() );
			return run.gitRebaseContinue().then( () => {
				expect( git.rebaseContinue ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "setPromote", () => {
		it( "should set `state.promote` based on current branch", () => {
			state.branch = "promote-release-v1.1.1-feature.0";
			return run.setPromote( state ).then( () => {
				expect( state.promote ).toEqual( "v1.1.1-feature.0" );
			} );
		} );
	} );

	describe( "verifyConflictResolution", () => {
		it( "should call `git.checkConflictMarkers`", () => {
			git.checkConflictMarkers = jest.fn( () => Promise.resolve() );
			return run.verifyConflictResolution().then( () => {
				expect( git.checkConflictMarkers ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "getPackageScope", () => {
		beforeEach( () => {
			util.readJSONFile = jest.fn( () => ( {} ) );
		} );

		describe( "qa", () => {
			it( "should set CLI flag to default scope", () => {
				state.qa = true;
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@lk" );
				} );
			} );

			it( `should use scope read from ".state.txt" default scope`, () => {
				state.qa = true;
				util.readJSONFile = jest.fn( () => ( {
					scope: "@my_scope"
				} ) );
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@my_scope" );
				} );
			} );

			it( "should set CLI flag to provided scope when passed by user and add @ when not provided", () => {
				state.qa = "aoe";
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@aoe" );
				} );
			} );

			it( "should set CLI flag to provided scope when passed by user", () => {
				state.qa = "@aoe";
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@aoe" );
				} );
			} );
		} );

		describe( "pr", () => {
			it( "should set CLI flag to default scope", () => {
				state.pr = true;
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@lk" );
				} );
			} );

			it( `should use scope read from ".state.txt" default scope`, () => {
				state.pr = true;
				util.readJSONFile = jest.fn( () => ( {
					scope: "@my_scope"
				} ) );
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@my_scope" );
				} );
			} );

			it( "should set CLI flag to provided scope when passed by user and add @ when not provided", () => {
				state.pr = "aoe";
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@aoe" );
				} );
			} );

			it( "should set CLI flag to provided scope when passed by user", () => {
				state.pr = "@aoe";
				return run.getPackageScope( state ).then( () => {
					expect( state.scope ).toEqual( "@aoe" );
				} );
			} );
		} );
	} );

	describe( "getScopedRepos", () => {
		const originalProcessExit = process.exit;

		beforeEach( () => {
			state.configPath = "./package.json";
			state.scope = "@lk";
			util.readJSONFile = jest.fn( () => ( {
				devDependencies: { "@lk/over-watch": "1.1.1" },
				dependencies: { "@lk/watch-over": "1.1.1" }
			} ) );
			process.exit = jest.fn( () => {} );
		} );

		afterEach( () => {
			process.exit = originalProcessExit;
		} );

		it( "should call `util.readJSONFile`", () => {
			return run.getScopedRepos( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.readJSONFile ).toHaveBeenCalledWith( "./package.json" );
			} );
		} );

		it( "should resolve with repos within scope from config", () => {
			return run.getScopedRepos( state ).then( repos => {
				expect( repos ).toEqual( [ "over-watch", "watch-over" ] );
			} );
		} );

		it( "should advise when no dependencies or devDepdencies in package.json", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			util.readJSONFile = jest.fn( () => ( {} ) );
			state.scope = "@aoe";

			return run.getScopedRepos( state ).then( () => {
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "noPackagesInScope" );
				expect( process.exit ).toHaveBeenCalledTimes( 1 );
				expect( process.exit ).toHaveBeenCalledWith( 0 );
			} );
		} );

		it( "should advise when no repos are under scope within config and exit", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			state.scope = "@aoe";

			return run.getScopedRepos( state ).then( () => {
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "noPackagesInScope" );
				expect( process.exit ).toHaveBeenCalledTimes( 1 );
				expect( process.exit ).toHaveBeenCalledWith( 0 );
			} );
		} );

		it( "should advise when the call to `util.readJSONFile` fails", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			util.readJSONFile = jest.fn( () => {
				throw new Error( "nope" );
			} );

			return run.getScopedRepos( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "updateVersion" );
			} );
		} );
	} );

	describe( "askReposToUpdate", () => {
		beforeEach( () => {
			state.scope = "@lk";
			util.readJSONFile = jest.fn( () => ( {
				devDependencies: { "@lk/over-watch": "1.1.1" },
				dependencies: { "@lk/watch-over": "1.1.1" }
			} ) );
			util.prompt = jest.fn( () => Promise.resolve( { packagesToPromote: "over-watch" } ) );
		} );

		it( "should call `util.prompt` with the appropriate arguments", () => {
			return run.askReposToUpdate( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "checkbox",
					name: "packagesToPromote",
					message: "Select the package(s) you wish to update:",
					choices: [ "over-watch", "watch-over" ]
				} ] );
			} );
		} );

		it( "should persist the packagesToPromote to the workflow state", () => {
			return run.askReposToUpdate( state ).then( () => {
				expect( state ).toHaveProperty( "packages" );
				expect( state.packages ).toEqual( "over-watch" );
			} );
		} );
	} );

	describe( "askVersion", () => {
		let getRepo = jest.fn();
		let listTags = jest.fn();

		const mockListTags = ( shouldResolve = true ) => {
			if ( shouldResolve ) {
				listTags = jest.fn( () => Promise.resolve( {
					data: [ {
						name: "v1.1.1"
					}, {
						name: "v2.0.0-feature.1"
					}, {
						name: "v3.0.0-blah.0"
					} ]
				} ) );

				return listTags;
			}

			listTags = jest.fn( () => Promise.reject( "listTags fail" ) );

			return listTags;
		};

		const mockGitHub = ( listTagsShouldResolve = true ) => {
			listTags = mockListTags( listTagsShouldResolve );
			getRepo = jest.fn( () => ( {
				listTags
			} ) );

			return jest.fn( () => ( { getRepo } ) );
		};

		beforeEach( () => {
			state = {
				github: { owner: "someone-awesome", name: "something-awesome" },
				token: "z8259r"
			};
			util.prompt = jest.fn( () => Promise.resolve( { pkg: "over-watch", version: "1.1.1" } ) );
			GitHub.mockImplementation( mockGitHub() );
		} );

		it( "should prompt the user for package version", () => {
			return run.askVersion( state, { pkg: "over-watch", version: "1.1.1" } )().then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "list",
					name: "tag",
					message: `Update over-watch from 1.1.1 to:`,
					choices: [ "1.1.1", "2.0.0-feature.1", "3.0.0-blah.0" ]
				} ] );
			} );
		} );
	} );

	describe( "askVersions", () => {
		beforeEach( () => {
			state.dependencies = [ {
				pkg: "over-watch",
				version: "1.1.1"
			}, {
				pkg: "watch-over",
				version: "2.2.2"
			} ];
			util.prompt = jest.fn( () => Promise.resolve( { pkg: "over-watch", version: "1.1.1" } ) );
		} );

		it( "should call 'sequence' with an array of dependencies", () => {
			return run.askVersions( state ).then( () => {
				expect( sequence ).toHaveBeenCalledTimes( 1 );
				expect( sequence ).toHaveBeenCalledWith( expect.any( Array ) );
			} );
		} );

		it( "should persist the dependencies to the workflow state", () => {
			return run.askVersions( state ).then( () => {
				expect( state ).toHaveProperty( "dependencies" );
				expect( state.dependencies ).toEqual( [
					{
						pkg: "over-watch",
						version: "2.0.0-new.0"
					}, {
						pkg: "watch-over",
						version: "3.0.0-new.1"
					} ] );
			} );
		} );

		it( "should persist the identifier to the workflow state", () => {
			return run.askVersions( state ).then( () => {
				expect( state ).toHaveProperty( "identifier" );
				expect( state.identifier ).toEqual( "new" );
			} );
		} );

		it( "should persist the identifier to the workflow state using changeReason if no identifier exists in dependencies", () => {
			sequence.mockImplementation( jest.fn( () => Promise.resolve( [ {
				pkg: "over-watch",
				version: "2.0.0"
			}, {
				pkg: "watch-over",
				version: "3.0.0"
			} ] ) ) );
			state.changeReason = "magical powers";
			return run.askVersions( state ).then( () => {
				expect( state ).toHaveProperty( "identifier" );
				expect( state.identifier ).toEqual( "magical-powers" );
			} );
		} );
	} );

	describe( "askChangeType", () => {
		beforeEach( () => {
			util.prompt = jest.fn( () => Promise.resolve( { changeType: "feature" } ) );
		} );

		it( "should prompt the user for change type", () => {
			return run.askChangeType( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "list",
					name: "changeType",
					message: "What type of change is this work",
					choices: [ "feature", "defect", "rework" ]
				} ] );
			} );
		} );

		it( "should persist the given change type to the workflow state", () => {
			return run.askChangeType( state ).then( () => {
				expect( state ).toHaveProperty( "changeType" );
				expect( state.changeType ).toEqual( "feature" );
			} );
		} );
	} );

	describe( "askChangeReason", () => {
		beforeEach( () => {
			util.prompt = jest.fn( () => Promise.resolve( { changeReason: "this is a reason" } ) );
		} );

		it( "should prompt the user for change reason", () => {
			return run.askChangeReason( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "input",
					name: "changeReason",
					message: "What is the reason for this change"
				} ] );
			} );
		} );

		it( "should persist the given change reason to the workflow state", () => {
			return run.askChangeReason( state ).then( () => {
				expect( state ).toHaveProperty( "changeReason" );
				expect( state.changeReason ).toEqual( "this is a reason" );
			} );
		} );
	} );

	describe( "gitCheckoutAndCreateBranch", () => {
		beforeEach( () => {
			git.checkoutAndCreateBranch = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.checkoutAndCreateBranch` with the appropriate argument", () => {
			state.branch = "feature-new-menu";
			return run.gitCheckoutAndCreateBranch( state ).then( () => {
				expect( git.checkoutAndCreateBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.checkoutAndCreateBranch ).toHaveBeenCalledWith( "feature-new-menu" );
			} );
		} );
	} );

	describe( "gitCheckoutBranch", () => {
		beforeEach( () => {
			git.checkoutBranch = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.checkoutBranch` with the appropriate argument", () => {
			state.branch = "feature-new-menu";
			return run.gitCheckoutBranch( state ).then( () => {
				expect( git.checkoutBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.checkoutBranch ).toHaveBeenCalledWith( "feature-new-menu" );
			} );
		} );
	} );

	describe( "updateDependencies", () => {
		beforeEach( () => {
			state = {
				configPath: "./package.json",
				scope: "@lk",
				dependencies: [ {
					pkg: "over-watch",
					version: "1.1.1"
				}, {
					pkg: "watch-over",
					version: "2.2.2"
				} ]
			};
			util.readJSONFile = jest.fn( () => ( {
				devDependencies: { "@lk/over-watch": "1.1.1" },
				dependencies: { "@lk/watch-over": "1.1.1" }
			} ) );
			util.writeJSONFile = jest.fn( () => {} );
		} );

		it( "should call `util.readJSONFile`", () => {
			return run.updateDependencies( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.readJSONFile ).toHaveBeenCalledWith( state.configPath );
			} );
		} );

		it( "should call `util.writeJSONFile`", () => {
			return run.updateDependencies( state ).then( () => {
				expect( util.writeJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.writeJSONFile ).toHaveBeenCalledWith( state.configPath, {
					dependencies: {
						"@lk/watch-over": "2.2.2"
					},
					devDependencies: {
						"@lk/over-watch": "1.1.1"
					} } );
			} );
		} );

		it( "should advise when the call to `util.readJSONFile` fails", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			util.readJSONFile = jest.fn( () => {
				throw new Error( "nope" );
			} );

			return run.updateDependencies( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "updateVersion" );
			} );
		} );
	} );

	describe( "gitCommitBumpMessage", () => {
		beforeEach( () => {
			git.commit = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.commit` with the appropriate argument", () => {
			state.dependencies = [ {
				pkg: "over-watch",
				version: "1.1.1"
			}, {
				pkg: "watch-over",
				version: "2.2.2"
			} ];
			state.changeReason = "this is my reason";
			return run.gitCommitBumpMessage( state ).then( () => {
				expect( git.commit ).toHaveBeenCalledTimes( 1 );
				expect( git.commit ).toHaveBeenCalledWith( "Bumped over-watch to 1.1.1, watch-over to 2.2.2: this is my reason" );
			} );
		} );
	} );

	describe( "gitCreateUpstreamBranch", () => {
		beforeEach( () => {
			git.createUpstreamBranch = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.createUpstreamBranch` with the appropriate argument", () => {
			state.branch = "feature-this-is-a-reason";
			return run.gitCreateUpstreamBranch( state ).then( () => {
				expect( git.createUpstreamBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.createUpstreamBranch ).toHaveBeenCalledWith( "feature-this-is-a-reason" );
			} );
		} );
	} );

	describe( "verifyPackagesToPromote", () => {
		const originalProcessExit = process.exit;

		beforeEach( () => {
			state.packages = [ "over-watch", "watch-over" ];
			process.exit = jest.fn( () => {} );
		} );

		afterEach( () => {
			process.exit = originalProcessExit;
		} );

		it( "should resolve when there are packages", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			return run.verifyPackagesToPromote( state ).then( repos => {
				expect( util.advise ).toHaveBeenCalledTimes( 0 );
				expect( process.exit ).toHaveBeenCalledTimes( 0 );
			} );
		} );

		it( "should advise when no packages to promote and exit", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			state.packages = [];

			return run.verifyPackagesToPromote( state ).then( () => {
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "noPackages" );
				expect( process.exit ).toHaveBeenCalledTimes( 1 );
				expect( process.exit ).toHaveBeenCalledWith( 0 );
			} );
		} );
	} );

	describe( "gitRebaseUpstreamBranch", () => {
		beforeEach( () => {
			git.rebaseUpstreamBranch = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.gitRebaseUpstreamBranch` with the appropriate argument", () => {
			state.branch = "feature-branch";
			return run.gitRebaseUpstreamBranch( state ).then( () => {
				expect( git.rebaseUpstreamBranch ).toHaveBeenCalledTimes( 1 );
				expect( git.rebaseUpstreamBranch ).toHaveBeenCalledWith( "feature-branch" );
			} );
		} );
	} );

	describe( "gitRebaseUpstreamDevelop", () => {
		beforeEach( () => {
			git.rebaseUpstreamDevelop = jest.fn( () => Promise.resolve() );
		} );

		it( "should call `git.gitRebaseUpstreamDevelop` with the appropriate argument", () => {
			return run.gitRebaseUpstreamDevelop().then( () => {
				expect( git.rebaseUpstreamDevelop ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "getReposFromBumpCommit", () => {
		beforeEach( () => {
			git.getLatestCommitMessage = jest.fn( () => {
				return Promise.resolve( "Bumped web-board-slice to 3.1.0, web-card-slice to 13.1.0, web-common-ui to 15.7.0: Users needed a change" );
			} );
		} );

		it( "should call `git.getLatestCommitMessage`", () => {
			return run.getReposFromBumpCommit( state ).then( () => {
				expect( git.getLatestCommitMessage ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should persist the `packages` on the state", () => {
			return run.getReposFromBumpCommit( state ).then( () => {
				expect( state ).toHaveProperty( "packages" );
				expect( state.packages ).toEqual( [ "web-board-slice", "web-card-slice", "web-common-ui" ] );
			} );
		} );

		it( "should persist the `changeReason` on the state", () => {
			return run.getReposFromBumpCommit( state ).then( () => {
				expect( state ).toHaveProperty( "changeReason" );
				expect( state.changeReason ).toEqual( "Users needed a change" );
			} );
		} );

		it( "should use empty array and string when no matches are found in commit message", () => {
			git.getLatestCommitMessage = jest.fn( () => {
				return Promise.resolve( "Some random commit message" );
			} );
			return run.getReposFromBumpCommit( state ).then( () => {
				expect( state ).toHaveProperty( "packages" );
				expect( state ).toHaveProperty( "changeReason" );
				expect( state.packages ).toEqual( [] );
				expect( state.changeReason ).toEqual( "" );
			} );
		} );

		it( "should persist the `packages` on the state", () => {
			return run.getReposFromBumpCommit( state ).then( () => {
				expect( state ).toHaveProperty( "packages" );
				expect( state.packages ).toEqual( [ "web-board-slice", "web-card-slice", "web-common-ui" ] );
			} );
		} );
	} );

	describe( "gitAmendCommitBumpMessage", () => {
		beforeEach( () => {
			state = {
				dependencies: [ {
					pkg: "web-common-ui",
					version: "1.1.1-new.0"
				}, {
					pkg: "web-board-slice",
					version: "2.2.2-new.1"
				} ],
				changeReason: "This is the reason"
			};
			git.amend = jest.fn( () => Promise.resolve() );
		} );

		it( "should called `git.amend` with appropriate arguments", () => {
			return run.gitAmendCommitBumpMessage( state ).then( () => {
				expect( git.amend ).toHaveBeenCalledTimes( 1 );
				expect( git.amend ).toHaveBeenCalledWith( "Bumped web-common-ui to 1.1.1-new.0, web-board-slice to 2.2.2-new.1: This is the reason" );
			} );
		} );

		it( "should persist the `bumpComment` on the state", () => {
			return run.gitAmendCommitBumpMessage( state ).then( () => {
				expect( state ).toHaveProperty( "bumpComment" );
				expect( state.bumpComment ).toEqual( "Bumped web-common-ui to 1.1.1-new.0, web-board-slice to 2.2.2-new.1: This is the reason" );
			} );
		} );
	} );

	describe( "getCurrentDependencyVersions", () => {
		beforeEach( () => {
			state = {
				configPath: "./blah",
				packages: [ "another-ui", "my-secret-repo" ],
				scope: "@lk"
			};
			util.readJSONFile = jest.fn( () => ( {
				devDependencies: {
					"@lk/another-ui": "1.0.0",
					"@lk/my-thing": "14.0.0"
				},
				dependencies: {
					"@lk/web-common-ui": "3.0.0",
					"@lk/my-secret-repo": "4.0.0"
				}
			} ) );
		} );

		it( "should call `util.readJSONFile` with path", () => {
			return run.getCurrentDependencyVersions( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.readJSONFile ).toHaveBeenCalledWith( state.configPath );
			} );
		} );

		it( "should push package dependencies onto state", () => {
			return run.getCurrentDependencyVersions( state ).then( () => {
				expect( state ).toHaveProperty( "dependencies" );
				expect( state.dependencies ).toEqual( [ {
					pkg: "another-ui",
					version: "1.0.0"
				}, {
					pkg: "my-secret-repo",
					version: "4.0.0"
				} ] );
			} );
		} );

		it( "should advise when the call to `util.readJSONFile` fails", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			util.readJSONFile = jest.fn( () => {
				throw new Error( "nope" );
			} );

			return run.getCurrentDependencyVersions( state ).then( () => {
				expect( util.readJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "updateVersion" );
			} );
		} );
	} );

	describe( "createGithubPullRequestAganistDevelop", () => {
		let getRepo = jest.fn();
		let getIssues = jest.fn();
		let createPullRequest = jest.fn();
		let editIssue = jest.fn();

		const mockCreatePullRequest = ( shouldResolve = true ) => {
			if ( shouldResolve ) {
				createPullRequest = jest.fn( () => Promise.resolve( {
					data: {
						html_url: "http://example.com", // eslint-disable-line camelcase
						number: 47
					}
				} ) );

				return createPullRequest;
			}

			createPullRequest = jest.fn( () => Promise.reject( "pullRequest fail" ) );

			return createPullRequest;
		};

		const mockEditIssues = ( shouldResolve = true ) => {
			if ( shouldResolve ) {
				editIssue = jest.fn( () => Promise.resolve() );

				return editIssue;
			}

			editIssue = jest.fn( () => Promise.reject( "editIssues fail" ) );

			return editIssue;
		};

		const mockGitHub = ( createPullRequestShouldResolve = true, editIssueShouldResolve = true ) => {
			createPullRequest = mockCreatePullRequest( createPullRequestShouldResolve );
			editIssue = mockEditIssues( editIssueShouldResolve );
			getRepo = jest.fn( () => ( {
				createPullRequest
			} ) );
			getIssues = jest.fn( () => ( {
				editIssue
			} ) );

			return jest.fn( () => ( { getRepo, getIssues } ) );
		};

		beforeEach( () => {
			state = {
				github: { owner: "someone-awesome", name: "something-awesome" },
				token: "z8259r",
				prerelease: false,
				branch: "feature-branch"
			};

			logger.log = jest.fn();
			util.prompt = jest.fn( () => Promise.resolve( { name: "Something awesome" } ) );
			GitHub.mockImplementation( mockGitHub() );
		} );

		it( "should create a new GitHub client instance given a valid auth token", () => {
			return run.createGithubPullRequestAganistDevelop( state ).then( () => {
				expect( GitHub ).toHaveBeenCalledTimes( 1 );
				expect( GitHub ).toHaveBeenCalledWith( { token: "z8259r" } );
			} );
		} );

		it( "should log the action to the console", () => {
			return run.createGithubPullRequestAganistDevelop( state ).then( () => {
				expect( util.log.begin ).toHaveBeenCalledTimes( 1 );
				expect( util.log.end ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should create an instance of a repository object with the previously fetched repository owner and name", () => {
			return run.createGithubPullRequestAganistDevelop( state ).then( () => {
				expect( getRepo ).toHaveBeenCalledTimes( 1 );
				expect( getRepo ).toHaveBeenCalledWith( "someone-awesome", "something-awesome" );
			} );
		} );

		it( "should call `editIssue` with issue number and label", () => {
			logger.log = jest.fn();
			return run.createGithubPullRequestAganistDevelop( state ).then( () => {
				expect( editIssue ).toHaveBeenCalledTimes( 1 );
				expect( editIssue ).toHaveBeenCalledWith( 47, { labels: [ "Ready to Merge Into Develop" ] } );
			} );
		} );

		it( "should log an error to the console when the call to the API to create a release fails", () => {
			GitHub.mockImplementation( mockGitHub( false, true ) );

			return run.createGithubPullRequestAganistDevelop( state ).then( () => {
				expect( logger.log ).toHaveBeenCalledTimes( 1 );
				expect( logger.log ).toHaveBeenCalledWith( "pullRequest fail" );
			} );
		} );

		it( "should log an error to the console when the call to the API to edit issues fails", () => {
			GitHub.mockImplementation( mockGitHub( true, false ) );

			return run.createGithubPullRequestAganistDevelop( state ).then( () => {
				expect( logger.log ).toHaveBeenCalledTimes( 1 );
				expect( logger.log ).toHaveBeenCalledWith( "editIssues fail" );
			} );
		} );
	} );

	describe( "saveState", () => {
		let joinSpy;

		beforeEach( () => {
			state = {
				scope: "@lk"
			};
			util.writeJSONFile = jest.fn( () => {} );
			joinSpy = jest.spyOn( path, "join" ).mockImplementation( () => "my_path/" );
		} );

		afterEach( () => {
			joinSpy.mockRestore();
		} );

		it( "should call `util.writeJSONFile` with path and content", () => {
			return run.saveState( state ).then( () => {
				expect( util.writeJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.writeJSONFile ).toHaveBeenCalledWith( "my_path/", { scope: "@lk" } );
			} );
		} );

		it( "should advise when the call to `util.writeJSONFile` fails", () => {
			util.advise = jest.fn( () => Promise.resolve() );
			util.writeJSONFile = jest.fn( () => {
				throw new Error( "nope" );
			} );

			return run.saveState( state ).then( () => {
				expect( util.writeJSONFile ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledTimes( 1 );
				expect( util.advise ).toHaveBeenCalledWith( "saveState" );
			} );
		} );
	} );

	describe( "cleanUpTmpFiles", () => {
		let joinSpy;

		beforeEach( () => {
			git.cleanUp = jest.fn( () => Promise.resolve() );
			util.deleteFile = jest.fn( () => {} );
			joinSpy = jest.spyOn( path, "join" ).mockImplementation( () => "my_path/" );
		} );

		afterEach( () => {
			joinSpy.mockRestore();
		} );

		it( "should call `util.deleteFile` with path", () => {
			return run.cleanUpTmpFiles( state ).then( () => {
				expect( util.deleteFile ).toHaveBeenCalledTimes( 1 );
				expect( util.deleteFile ).toHaveBeenCalledWith( "my_path/" );
			} );
		} );

		it( "should call `git.cleanUp`", () => {
			return run.cleanUpTmpFiles( state ).then( () => {
				expect( git.cleanUp ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "promptBranchName", () => {
		beforeEach( () => {
			state = {
				changeType: "feature",
				identifier: "magic"
			};
			util.prompt = jest.fn( () => Promise.resolve( { branchName: "feature-magic" } ) );
		} );

		it( "should call `util.prompt` with the appropriate arguments", () => {
			return run.promptBranchName( state ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "input",
					name: "branchName",
					message: "What do you want your branch name to be?",
					default: "feature-magic"
				} ] );
			} );
		} );

		it( "should persist the `branchName` to the workflow state", () => {
			return run.promptBranchName( state ).then( () => {
				expect( state ).toHaveProperty( "branch" );
				expect( state.branch ).toEqual( "feature-magic" );
			} );
		} );
	} );

	describe( "getTagsFromRepo", () => {
		let getRepo = jest.fn();
		let listTags = jest.fn();

		const mockListTags = ( shouldResolve = true ) => {
			if ( shouldResolve ) {
				listTags = jest.fn( () => Promise.resolve( {
					data: [ {
						name: "v1.1.1"
					}, {
						name: "v2.0.0-feature.1"
					}, {
						name: "v3.0.0-blah.0"
					} ]
				} ) );

				return listTags;
			}

			listTags = jest.fn( () => Promise.reject( "listTags fail" ) );

			return listTags;
		};

		const mockGitHub = ( listTagsShouldResolve = true ) => {
			listTags = mockListTags( listTagsShouldResolve );
			getRepo = jest.fn( () => ( {
				listTags
			} ) );

			return jest.fn( () => ( { getRepo } ) );
		};

		beforeEach( () => {
			state = {
				github: { owner: "someone-awesome", name: "something-awesome" },
				token: "z8259r"
			};
			GitHub.mockImplementation( mockGitHub() );
		} );

		it( "should create a new GitHub client instance given a valid auth token", () => {
			return run.getTagsFromRepo( state, "my-secret-repo" ).then( () => {
				expect( GitHub ).toHaveBeenCalledTimes( 1 );
				expect( GitHub ).toHaveBeenCalledWith( { token: "z8259r" } );
			} );
		} );

		it( "should create an instance of a repository object with the previously fetched repository owner and passed in name", () => {
			return run.getTagsFromRepo( state, "my-secret-repo" ).then( () => {
				expect( getRepo ).toHaveBeenCalledTimes( 1 );
				expect( getRepo ).toHaveBeenCalledWith( "someone-awesome", "my-secret-repo" );
			} );
		} );

		it( "should call the GitHub API to get a list of tags from the repository", () => {
			return run.getTagsFromRepo( state, "my-secret-repo" ).then( result => {
				expect( listTags ).toHaveBeenCalledTimes( 1 );
				expect( result ).toEqual( [ "1.1.1", "2.0.0-feature.1", "3.0.0-blah.0" ] );
			} );
		} );

		it( "should log an error to the console when the call to the API to get a list of tags fails", () => {
			logger.log = jest.fn();
			GitHub.mockImplementation( mockGitHub( false ) );

			return run.getTagsFromRepo( state ).then( () => {
				expect( logger.log ).toHaveBeenCalledTimes( 1 );
				expect( logger.log ).toHaveBeenCalledWith( "listTags fail" );
			} );
		} );
	} );
} );
