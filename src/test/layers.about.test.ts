import t = require('tap');
import {
    AuthorAddress,
    AuthorKeypair,
    FormatName,
    IStorage,
    IValidator,
    isErr,
} from '../util/types';
import {
    generateAuthorKeypair
} from '../crypto/crypto';
import {
    ValidatorEs4
} from '../validator/es4';
import {
    StorageMemory
} from '../storage/memory';
import {
    LayerAbout,
    AuthorInfo,
    AuthorProfile,
} from '../layers/about';

//================================================================================
// prepare for test scenarios

let WORKSPACE = '+gardenclub.xxxxxxxxxxxxxxxxxxxx';
let VALIDATORS : IValidator[] = [ValidatorEs4];
let FORMAT : FormatName = VALIDATORS[0].format;

let keypair1 = generateAuthorKeypair('test') as AuthorKeypair;
let keypair2 = generateAuthorKeypair('twoo') as AuthorKeypair;
let keypair3 = generateAuthorKeypair('thre') as AuthorKeypair;
if (isErr(keypair1)) { throw "oops"; }
if (isErr(keypair2)) { throw "oops"; }
if (isErr(keypair3)) { throw "oops"; }
let author1: AuthorAddress = keypair1.address;
let author2: AuthorAddress = keypair2.address;
let author3: AuthorAddress = keypair3.address;
let now = 1500000000000000;

let makeStorage = (workspace : string) : IStorage =>
    new StorageMemory(VALIDATORS, workspace);

let sparkleEmoji = '✨';

//================================================================================

t.test('with empty storage', (t: any) => {
    let storage = makeStorage(WORKSPACE);
    let about = new LayerAbout(storage);

    t.same(about.listAuthorInfos(), [], 'listAuthors empty');
    t.ok(isErr(about.getAuthorInfo('x')), 'unparsable author address => error');

    // add a random document so that this author will be one of the authors in the workspace.
    storage.set(keypair2, {
        format: FORMAT,
        path: '/extra',
        content: 'whatever',
    });

    let expectedInfo1 : AuthorInfo = {
        address: author1,
        shortname: 'test',
        pubkey: author1.split('.')[1],
        profile: {},
    }
    let expectedInfo2 : AuthorInfo = {
        address: author2,
        shortname: 'twoo',
        pubkey: author2.split('.')[1],
        profile: {},
    }
    t.same(about.listAuthorInfos(), [expectedInfo2], 'listAuthors for an author with no profile doc');
    t.same(about.getAuthorInfo(author2), expectedInfo2, 'getAuthorProfile for an existant author with no profile doc');
    t.same(about.getAuthorInfo(author1), expectedInfo1, 'getAuthorProfile for a nonexistant author with no profile doc');

    let profile1a : AuthorProfile = {
        displayName: 'Whee ' + sparkleEmoji,
        bio: 'all about me',
        hue: 123,
    };
    t.true(about.setMyAuthorProfile(keypair1, profile1a), 'set author profile for first time');
    t.same(about.getAuthorInfo(author1), {...expectedInfo1, profile: profile1a}, 'getAuthorProfile with profile doc');

    t.same(storage.paths({pathPrefix: '/about/'}), [`/about/~${author1}/profile.json`], 'profile is stored at the expected path');

    let profile1b : AuthorProfile = {
        displayName: 'Wheeeeeee ' + sparkleEmoji,
    };
    t.true(about.setMyAuthorProfile(keypair1, profile1b), 'set author profile again');
    t.same(about.getAuthorInfo(author1), {...expectedInfo1, profile: profile1b}, 'getAuthorProfile with updated profile doc');

    t.same(about.listAuthorInfos(), [{...expectedInfo1, profile: profile1b}, expectedInfo2], 'listAuthors again');

    t.true(about.setMyAuthorProfile(keypair1, null), 'clear author profile using null');
    t.same(about.getAuthorInfo(author1), {...expectedInfo1, profile: {}}, 'getAuthorProfile with cleared profile doc');

    t.true(about.setMyAuthorProfile(keypair1, {}), 'clear author profile using {}');
    t.same(about.getAuthorInfo(author1), {...expectedInfo1, profile: {}}, 'getAuthorProfile with cleared profile doc');

    t.end();
});
