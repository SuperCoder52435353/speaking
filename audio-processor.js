// js/audio-processor.js - Audio Processing and Feature Extraction

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
    }

    // Audio faylni yoki Blob ni qayta ishlash
    async processAudio(audioSource) {
        try {
            console.log('Processing audio source...', audioSource);
            
            // AudioContext yaratish
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            let arrayBuffer;
            
            // Blob yoki File dan arrayBuffer olish
            if (audioSource instanceof Blob || audioSource instanceof File) {
                arrayBuffer = await audioSource.arrayBuffer();
            } else {
                throw new Error('Invalid audio source type');
            }
            
            console.log('ArrayBuffer size:', arrayBuffer.byteLength);
            
            // Audio decode qilish
            try {
                this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            } catch (decodeError) {
                console.error('Decode error:', decodeError);
                throw new Error('Failed to decode audio. Please ensure the file is a valid audio format.');
            }
            
            console.log('Audio decoded successfully:', {
                duration: this.audioBuffer.duration,
                sampleRate: this.audioBuffer.sampleRate,
                channels: this.audioBuffer.numberOfChannels
            });
            
            // Xususiyatlarni ajratib olish
            const features = this.extractFeatures();
            
            // AudioContext ni yopish
            await this.audioContext.close();
            this.audioContext = null;
            
            return features;
            
        } catch (error) {
            console.error('Audio processing error:', error);
            
            // AudioContext ni tozalash
            if (this.audioContext) {
                try {
                    await this.audioContext.close();
                } catch (e) {
                    console.error('Error closing audio context:', e);
                }
                this.audioContext = null;
            }
            
            throw new Error('Failed to process audio: ' + error.message);
        }
    }

    // Audio xususiyatlarini ajratib olish
    extractFeatures() {
        if (!this.audioBuffer) {
            throw new Error('No audio buffer available');
        }
        
        const duration = this.audioBuffer.duration;
        const sampleRate = this.audioBuffer.sampleRate;
        const channelData = this.audioBuffer.getChannelData(0);
        
        console.log('Extracting features from audio:', {
            duration: duration.toFixed(2) + 's',
            sampleRate: sampleRate + 'Hz',
            samples: channelData.length
        });
        
        // Duration tahlili
        const durationAnalysis = this.analyzeDuration(duration);
        
        // Volume va energy tahlili
        const volumeAnalysis = this.analyzeVolume(channelData);
        
        // Pause detection
        const pauseAnalysis = this.detectPauses(channelData, sampleRate);
        
        // Speech rate estimation
        const speechRateAnalysis = this.estimateSpeechRate(duration, pauseAnalysis);
        
        // Pitch analysis
        const pitchAnalysis = this.analyzePitch(channelData, sampleRate);
        
        // Clarity estimation
        const clarity = this.estimateClarity(volumeAnalysis, pitchAnalysis);
        
        const features = {
            duration: duration,
            durationScore: durationAnalysis.score,
            durationFeedback: durationAnalysis.feedback,
            averageVolume: volumeAnalysis.average,
            volumeConsistency: volumeAnalysis.consistency,
            energyLevel: volumeAnalysis.energy,
            totalPauses: pauseAnalysis.count,
            pauseDuration: pauseAnalysis.totalDuration,
            pauseScore: pauseAnalysis.score,
            speechRate: speechRateAnalysis.rate,
            speechRateScore: speechRateAnalysis.score,
            pitchVariation: pitchAnalysis.variation,
            pitchScore: pitchAnalysis.score,
            clarity: clarity
        };
        
        console.log('Features extracted:', features);
        
        return features;
    }

    // Duration tahlili
    analyzeDuration(duration) {
        const minutes = duration / 60;
        let score = 0;
        let feedback = '';
        
        if (minutes < 0.5) {
            score = 40;
            feedback = 'Too short. Try to speak for at least 1-2 minutes';
        } else if (minutes >= 0.5 && minutes < 1) {
            score = 60;
            feedback = 'A bit short. Aim for 1.5-2.5 minutes for optimal assessment';
        } else if (minutes >= 1 && minutes <= 3) {
            score = 95;
            feedback = 'Perfect duration! Well-balanced speaking time';
        } else if (minutes > 3 && minutes <= 4) {
            score = 85;
            feedback = 'Good length, but slightly long. Try to be more concise';
        } else {
            score = 70;
            feedback = 'Too long. Practice being more concise and focused';
        }
        
        return { 
            score: Math.round(score), 
            feedback: feedback,
            minutes: minutes.toFixed(1) 
        };
    }

    // Volume tahlili
    analyzeVolume(channelData) {
        let sum = 0;
        let sumSquares = 0;
        const length = channelData.length;
        
        for (let i = 0; i < length; i++) {
            const value = Math.abs(channelData[i]);
            sum += value;
            sumSquares += value * value;
        }
        
        const average = sum / length;
        const variance = (sumSquares / length) - (average * average);
        const stdDev = Math.sqrt(Math.max(0, variance));
        
        // Consistency: 0-1, qanchalik yuqori bo'lsa shunchalik izchil
        const consistency = average > 0 ? Math.max(0, Math.min(1, 1 - (stdDev / average))) : 0;
        
        // Energy level
        const energy = Math.sqrt(sumSquares / length);
        
        return {
            average: parseFloat(average.toFixed(6)),
            consistency: parseFloat(consistency.toFixed(6)),
            energy: parseFloat(energy.toFixed(6))
        };
    }

    // Pauza aniqlash
    detectPauses(channelData, sampleRate) {
        const threshold = 0.01; // Silence threshold
        const minPauseDuration = 0.3; // Minimum 300ms
        const minPauseSamples = Math.floor(minPauseDuration * sampleRate);
        
        let pauseCount = 0;
        let totalPauseDuration = 0;
        let currentPause = 0;
        
        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) < threshold) {
                currentPause++;
            } else {
                if (currentPause >= minPauseSamples) {
                    pauseCount++;
                    totalPauseDuration += currentPause / sampleRate;
                }
                currentPause = 0;
            }
        }
        
        // Oxirgi pauzani tekshirish
        if (currentPause >= minPauseSamples) {
            pauseCount++;
            totalPauseDuration += currentPause / sampleRate;
        }
        
        // Pause score (optimal: 5-15 pauses)
        let score = 100;
        if (pauseCount < 3) {
            score = 60;
        } else if (pauseCount >= 3 && pauseCount <= 15) {
            score = 95;
        } else if (pauseCount > 15 && pauseCount <= 25) {
            score = 80;
        } else {
            score = 65;
        }
        
        return {
            count: pauseCount,
            totalDuration: parseFloat(totalPauseDuration.toFixed(2)),
            score: Math.round(score)
        };
    }

    // Speech rate baholash
    estimateSpeechRate(duration, pauseAnalysis) {
        const activeSpeechTime = Math.max(1, duration - pauseAnalysis.totalDuration);
        const estimatedWords = activeSpeechTime * 2.5; // Average 2.5 words/second
        const wordsPerMinute = (estimatedWords / duration) * 60;
        
        let score = 100;
        let feedback = '';
        
        if (wordsPerMinute < 100) {
            score = 70;
            feedback = 'Speaking too slowly. Try to speak more naturally';
        } else if (wordsPerMinute >= 100 && wordsPerMinute <= 160) {
            score = 95;
            feedback = 'Excellent speaking pace! Natural and clear';
        } else if (wordsPerMinute > 160 && wordsPerMinute <= 180) {
            score = 85;
            feedback = 'Speaking a bit fast. Try to slow down slightly';
        } else {
            score = 65;
            feedback = 'Speaking too fast. Slow down for better clarity';
        }
        
        return {
            rate: Math.round(wordsPerMinute),
            score: Math.round(score),
            feedback: feedback
        };
    }

    // Pitch tahlili
    analyzePitch(channelData, sampleRate) {
        const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
        const windows = Math.floor(channelData.length / windowSize);
        const pitchValues = [];
        
        for (let i = 0; i < windows; i++) {
            const start = i * windowSize;
            const end = Math.min(start + windowSize, channelData.length);
            let sum = 0;
            
            for (let j = start; j < end; j++) {
                sum += Math.abs(channelData[j]);
            }
            
            const avg = sum / (end - start);
            if (avg > 0.001) { // Ignore very quiet windows
                pitchValues.push(avg);
            }
        }
        
        if (pitchValues.length === 0) {
            return {
                variation: '0.000',
                score: 50
            };
        }
        
        // Calculate variation
        const mean = pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length;
        const variance = pitchValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pitchValues.length;
        const variation = mean > 0 ? Math.sqrt(variance) / mean : 0;
        
        // Score
        let score = 100;
        if (variation < 0.2) {
            score = 65; // Too monotone
        } else if (variation >= 0.2 && variation <= 0.6) {
            score = 95; // Good variation
        } else {
            score = 75; // Too much variation
        }
        
        return {
            variation: variation.toFixed(3),
            score: Math.round(score)
        };
    }

    // Clarity estimation
    estimateClarity(volumeAnalysis, pitchAnalysis) {
        const clarityScore = (volumeAnalysis.consistency * 50) + (pitchAnalysis.score / 2);
        return Math.round(Math.min(100, Math.max(0, clarityScore)));
    }

    // Audio file validation
    validateAudioFile(file) {
        if (!file) {
            return { 
                valid: false, 
                error: 'No file selected' 
            };
        }
        
        const validTypes = [
            'audio/mpeg', 
            'audio/mp3', 
            'audio/wav', 
            'audio/wave',
            'audio/x-wav',
            'audio/m4a', 
            'audio/x-m4a', 
            'audio/aac',
            'audio/x-aac',
            'audio/ogg',
            'audio/webm'
        ];
        
        const validExtensions = /\.(mp3|wav|m4a|aac|ogg|webm)$/i;
        
        // Type yoki extension bo'yicha tekshirish
        const isValidType = validTypes.includes(file.type) || validExtensions.test(file.name);
        
        if (!isValidType) {
            return { 
                valid: false, 
                error: 'Invalid file type. Please upload MP3, WAV, M4A, AAC, OGG, or WEBM files' 
            };
        }
        
        // Size tekshirish (max 100MB)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            return { 
                valid: false, 
                error: 'File too large. Maximum size is 100MB' 
            };
        }
        
        // Minimum size (at least 10KB)
        if (file.size < 10000) {
            return { 
                valid: false, 
                error: 'File too small. Please upload a proper audio recording' 
            };
        }
        
        return { valid: true };
    }
}