import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isChannelOwner} from './chat.js';
test('authenticated channel owner can launch without optional badge metadata',()=>{assert.equal(isChannelOwner('jayaspassion','#jayaspassion','jayaspassion'),true);assert.equal(isChannelOwner('JayasPassion','#jayaspassion','jayaspassion'),true);assert.equal(isChannelOwner('viewer','#jayaspassion','jayaspassion'),false);assert.equal(isChannelOwner('jayaspassion','#another_channel','jayaspassion'),false);});
