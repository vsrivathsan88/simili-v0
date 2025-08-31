/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { audioContext } from "./utils";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        console.log('AudioRecorder: Getting user media...');
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('AudioRecorder: Got media stream');
        
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        console.log('AudioRecorder: Created audio context');
        
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        console.log('AudioRecorder: Created media stream source');

        const workletName = "audio-recorder-worklet";
        console.log('AudioRecorder: Loading worklet from public folder');

        await this.audioContext.audioWorklet.addModule('/audio-recorder-worklet.js');
        console.log('AudioRecorder: Added worklet module');
        
        this.recordingWorklet = await this.createWorkletNodeWithRetry(workletName, 5, 50);
        console.log('AudioRecorder: Created AudioWorkletNode');

      this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
        // worklet processes recording floats and messages converted buffer
        const arrayBuffer = ev.data.data.int16arrayBuffer;

        if (arrayBuffer) {
          const arrayBufferString = arrayBufferToBase64(arrayBuffer);
          this.emit("data", arrayBufferString);
        }
      };
      this.source.connect(this.recordingWorklet);

      // vu meter worklet
      const vuWorkletName = "vu-meter";
      await this.audioContext.audioWorklet.addModule('/vu-meter-worklet.js');
      this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
      this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
        this.emit("volume", ev.data.volume);
      };

      this.source.connect(this.vuWorklet);
      this.recording = true;
      resolve();
      this.starting = null;
      } catch (error) {
        console.error('AudioRecorder: Error during initialization:', error);
        reject(error);
      }
    });
    
    return this.starting;
  }

  /**
   * Attempts to create an AudioWorkletNode, retrying if the processor is not yet registered.
   * @param name The name of the worklet processor.
   * @param maxRetries The maximum number of times to retry.
   * @param retryDelay The base delay in ms between retries.
   * @returns A promise that resolves with the AudioWorkletNode.
   */
  private async createWorkletNodeWithRetry(
    name: string, 
    maxRetries: number, 
    retryDelay: number
  ): Promise<AudioWorkletNode> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        // Attempt to create the node
        return new AudioWorkletNode(this.audioContext!, name);
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          // If we've exhausted retries, throw the last error
          throw error;
        }
        // Log the attempt and wait before trying again
        console.log(`Worklet '${name}' not ready, retrying... (${attempts}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts)); // Exponential backoff
      }
    }
    // This line should be unreachable, but typescript needs it
    throw new Error(`Failed to create worklet node '${name}'`);
  }

  stop() {
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
    };
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}
