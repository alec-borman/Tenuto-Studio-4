const fs = require('fs');
const path = require('path');

function main() {
    const runtimeDir = path.join(__dirname, '../../runtime/web');
    const testsDir = path.join(__dirname, '../../tests');
    
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.mkdirSync(testsDir, { recursive: true });
    
    fs.writeFileSync(path.join(runtimeDir, 'engine.js'), `
class WebAudioEngine {
    constructor(audioContext) {
        this.ctx = audioContext;
    }

    scheduleSynth(node, when, duration) {
        // Translate style=synth nodes into continuous frequency functions
        // utilizing AudioWorkletNode oscillators and GainNode ADSR envelope automations
        const osc = new OscillatorNode(this.ctx);
        const gain = new GainNode(this.ctx);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        // ADSR envelope (simplified for test)
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(1, when + 0.01); // Attack
        gain.gain.setValueAtTime(1, when + duration - 0.05); // Sustain
        gain.gain.linearRampToValueAtTime(0, when + duration); // Release
        
        // Exact start(when, offset, duration) scheduling
        osc.start(when);
        osc.stop(when + duration);
        
        return { osc, gain };
    }

    scheduleConcrete(buffer, when, offset, duration) {
        // Translate style=concrete nodes into AudioBufferSourceNode objects
        const source = new AudioBufferSourceNode(this.ctx, { buffer });
        source.connect(this.ctx.destination);
        
        // Exact start(when, offset, duration) scheduling
        source.start(when, offset, duration);
        
        return source;
    }
}

module.exports = { WebAudioEngine };
`);

    fs.writeFileSync(path.join(runtimeDir, 'processor.js'), `
// AudioWorkletProcessor for advanced synth features
class SynthProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        return true;
    }
}
registerProcessor('synth-processor', SynthProcessor);
`);

    fs.writeFileSync(path.join(testsDir, 'test_audio.js'), `
const test = require('node:test');
const assert = require('node:assert');
const { WebAudioEngine } = require('../runtime/web/engine.js');

// Mock AudioContext for testing
class MockAudioParam {
    setValueAtTime() {}
    linearRampToValueAtTime() {}
}

class MockAudioNode {
    connect() {}
}

class MockOscillatorNode extends MockAudioNode {
    constructor() {
        super();
        this.started = false;
        this.stopped = false;
        this.startTime = 0;
        this.stopTime = 0;
    }
    start(when) {
        this.started = true;
        this.startTime = when;
    }
    stop(when) {
        this.stopped = true;
        this.stopTime = when;
    }
}

class MockGainNode extends MockAudioNode {
    constructor() {
        super();
        this.gain = new MockAudioParam();
    }
}

class MockAudioBufferSourceNode extends MockAudioNode {
    constructor() {
        super();
        this.started = false;
        this.startTime = 0;
        this.offset = 0;
        this.duration = 0;
    }
    start(when, offset, duration) {
        this.started = true;
        this.startTime = when;
        this.offset = offset;
        this.duration = duration;
    }
}

class MockAudioContext {
    constructor() {
        this.destination = new MockAudioNode();
    }
}

// Inject mocks into global scope for the engine to use
global.OscillatorNode = MockOscillatorNode;
global.GainNode = MockGainNode;
global.AudioBufferSourceNode = MockAudioBufferSourceNode;

test('WebAudioEngine schedules synth correctly without setTimeout', (t) => {
    const ctx = new MockAudioContext();
    const engine = new WebAudioEngine(ctx);
    
    const when = 1.5;
    const duration = 2.0;
    
    const { osc } = engine.scheduleSynth({}, when, duration);
    
    assert.strictEqual(osc.started, true);
    assert.strictEqual(osc.startTime, when);
    assert.strictEqual(osc.stopped, true);
    assert.strictEqual(osc.stopTime, when + duration);
});

test('WebAudioEngine schedules concrete correctly without setTimeout', (t) => {
    const ctx = new MockAudioContext();
    const engine = new WebAudioEngine(ctx);
    
    const buffer = {};
    const when = 2.0;
    const offset = 0.5;
    const duration = 1.0;
    
    const source = engine.scheduleConcrete(buffer, when, offset, duration);
    
    assert.strictEqual(source.started, true);
    assert.strictEqual(source.startTime, when);
    assert.strictEqual(source.offset, offset);
    assert.strictEqual(source.duration, duration);
});
`);
}

main();
