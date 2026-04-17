// AudioWorkletProcessor for advanced synth features
class SynthProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'frequency', defaultValue: 440, minValue: 20, maxValue: 20000 },
            { name: 'modulationIndex', defaultValue: 0, minValue: 0, maxValue: 100 },
            { name: 'modulationFrequency', defaultValue: 0, minValue: 0, maxValue: 20000 }
        ];
    }

    constructor() {
        super();
        this.phase = 0;
        this.modPhase = 0;
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const freq = parameters.frequency;
        const modIdx = parameters.modulationIndex;
        const modFreq = parameters.modulationFrequency;
        
        for (let channel = 0; channel < output.length; ++channel) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; ++i) {
                const currentFreq = freq.length > 1 ? freq[i] : freq[0];
                const currentModIdx = modIdx.length > 1 ? modIdx[i] : modIdx[0];
                const currentModFreq = modFreq.length > 1 ? modFreq[i] : modFreq[0];
                
                // Frequency modulation
                this.modPhase += 2 * Math.PI * currentModFreq / sampleRate;
                const modSignal = Math.sin(this.modPhase) * currentModIdx;
                
                this.phase += 2 * Math.PI * (currentFreq + modSignal) / sampleRate;
                outputChannel[i] = Math.sin(this.phase);
            }
        }
        return true;
    }
}
registerProcessor('synth-processor', SynthProcessor);
