import test from 'node:test';import assert from 'node:assert/strict';import {advanceFeed} from '../shared/feed.mjs';
test('coarse flow changes to fine feed',()=>{assert.equal(advanceFeed(0,4,.1).fine,false);assert.equal(advanceFeed(3.8,4,.1).fine,true);assert.ok(advanceFeed(0,4,.1).rate>advanceFeed(3.8,4,.1).rate)});
test('feed cannot overrun target and eventually completes',()=>{let w=0;for(let i=0;i<1500;i++)w=advanceFeed(w,4,.1,i*.1).weight;assert.equal(w,4)});
test('long frame does not produce unsafe jump',()=>assert.ok(advanceFeed(0,4,100).weight<.1));
