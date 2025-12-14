// app.js - Enhanced Main Application
// Version 4.0 - With Brain Learning & Speech-to-Text
// Powered by Abduraxmon

class SpeakProApp {
    constructor() {
        // Core modules
        this.storage = new StorageManager();
        this.audioProcessor = new AudioProcessor();
        this.aiAnalyzer = new AIAnalyzer();
        this.uiController = new UIController();
        this.brain = new BrainSystem();
        this.transcriber = new Transcriber();
        
        // Recording state
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingTimer = null;
        this.recordingStartTime = 0;
        this.isRecording = false;
        this.mediaStream = null;
        
        // Transcription state
        this.currentTranscription = '';
        this.isTranscribing = false;
        
        this.init();
    }

    init() {
        console.log('🚀 SpeakPro AI v4.0 initializing...');
        console.log('🧠 Brain Learning System: Active');
        console.log('📝 Speech-to-Text: ' + (this.transcriber.isSupported ? 'Supported' : 'Not supported'));
        
        window.app = this;
        
        this.setupEventListeners();
        this.loadHistory();
        this.loadStatistics();
        this.loadBrainInsights();
        
        console.log('✅ SpeakPro AI initialized successfully!');
    }

    setupEventListeners() {
        // Upload method
        this.uiController.elements.uploadMethod?.addEventListener('click', () => {
            this.uiController.selectUploadMethod();
        });
        
        // File input
        this.uiController.elements.audioFile?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const validation = this.audioProcessor.validateAudioFile(file);
                if (validation.valid) {
                    this.uiController.handleFileUpload(file);
                } else {
                    this.uiController.showError(validation.error);
                    e.target.value = '';
                }
            }
        });
        
        // Record method
        this.uiController.elements.recordMethod?.addEventListener('click', () => {
            this.uiController.selectRecordMethod();
        });
        
        // Record button
        this.uiController.elements.recordBtn?.addEventListener('click', () => {
            this.toggleRecording();
        });
        
        // Analyze button
        this.uiController.elements.analyzeBtn?.addEventListener('click', () => {
            this.startAnalysis();
        });
        
        // New test button
        this.uiController.elements.newTestBtn?.addEventListener('click', () => {
            this.resetApp();
        });

        // Transcription updates
        if (this.transcriber.isSupported) {
            this.transcriber.onTranscriptUpdate = (data) => {
                this.currentTranscription = data.combined;
                this.uiController.updateLiveTranscription(data.combined);
            };
        }
    }

    // ==================== RECORDING WITH TRANSCRIPTION ====================

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            console.log('Requesting microphone access...');
            
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });
            
            console.log('Microphone access granted');
            
            // Start transcription if supported
            if (this.transcriber.isSupported) {
                this.transcriber.start();
                this.isTranscribing = true;
                console.log('Transcription started');
            }
            
            // MIME type
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/ogg';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = '';
                }
            }
            
            const options = mimeType ? { mimeType } : {};
            this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                console.log('Recording stopped');
                
                // Stop transcription
                if (this.isTranscribing) {
                    this.currentTranscription = this.transcriber.stop();
                    this.isTranscribing = false;
                    console.log('Final transcription:', this.currentTranscription);
                }
                
                if (this.audioChunks.length === 0) {
                    this.uiController.showError('Recording failed. Please try again.');
                    this.cleanupRecording();
                    return;
                }
                
                const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                
                if (audioBlob.size < 1000) {
                    this.uiController.showError('Recording too short.');
                    this.cleanupRecording();
                    return;
                }
                
                this.uiController.handleRecordingComplete(audioBlob, this.currentTranscription);
                this.cleanupRecording();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                this.uiController.showError('Recording error occurred.');
                this.cleanupRecording();
            };
            
            this.mediaRecorder.start(1000);
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.currentTranscription = '';
            
            this.uiController.elements.recordBtn.classList.add('recording');
            this.uiController.elements.recordBtn.textContent = '⏹️';
            this.uiController.elements.recordingStatus.textContent = 'Recording... Click to stop';
            
            // Show live transcription area
            this.uiController.showLiveTranscription();
            
            this.startRecordingTimer();
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            
            let errorMessage = 'Could not access microphone. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please grant microphone permission.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No microphone found.';
            } else {
                errorMessage += error.message;
            }
            
            this.uiController.showError(errorMessage);
            this.cleanupRecording();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            try {
                if (this.mediaRecorder.state !== 'inactive') {
                    this.mediaRecorder.stop();
                }
            } catch (error) {
                console.error('Error stopping recorder:', error);
            }
            
            this.isRecording = false;
            this.stopRecordingTimer();
            
            this.uiController.elements.recordBtn.classList.remove('recording');
            this.uiController.elements.recordBtn.textContent = '🎙️';
            this.uiController.elements.recordingStatus.textContent = 'Processing...';
        }
    }

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            
            this.uiController.elements.recordingTime.textContent = 
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    cleanupRecording() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        if (this.isTranscribing) {
            this.transcriber.stop();
            this.isTranscribing = false;
        }
    }

    // ==================== ANALYSIS ====================

    async startAnalysis() {
        try {
            const file = this.uiController.currentFile;
            const topic = this.uiController.elements.topicSelect.value;
            const transcription = this.uiController.currentTranscription || this.currentTranscription;
            
            if (!file) {
                this.uiController.showError('Please upload an audio file or record your speaking');
                return;
            }
            
            if (!topic) {
                this.uiController.showError('Please select a speaking topic');
                return;
            }
            
            console.log('Starting analysis...');
            console.log('Has transcription:', !!transcription);
            
            this.uiController.showLoading();
            
            // Step 1: Process audio
            await this.sleep(500);
            const audioFeatures = await this.audioProcessor.processAudio(file);
            console.log('Audio features:', audioFeatures);
            
            // Step 2: Analyze transcription
            let transcriptionAnalysis = null;
            if (transcription && transcription.length > 0) {
                transcriptionAnalysis = this.transcriber.analyzeTranscript(transcription);
                console.log('Transcription analysis:', transcriptionAnalysis);
            }
            
            // Step 3: AI Analysis
            await this.sleep(800);
            const analysis = await this.aiAnalyzer.analyzeFullSpeaking(
                audioFeatures, 
                topic, 
                transcriptionAnalysis
            );
            console.log('AI analysis complete:', analysis);
            
            // Step 4: Save to storage
            const assessmentId = this.storage.saveAssessment(analysis);
            console.log('Saved with ID:', assessmentId);
            
            // Step 5: Save audio
            try {
                await this.storage.saveAudioFile(file, assessmentId);
            } catch (audioError) {
                console.warn('Could not save audio:', audioError.message);
            }
            
            // Step 6: Brain learning
            this.brain.learnFromSession(analysis, transcription);
            console.log('Brain learned from session');
            
            this.uiController.hideLoading();
            
            // Display results
            this.uiController.displayResults(analysis);
            
            // Reload all data
            this.loadHistory();
            this.loadStatistics();
            this.loadBrainInsights();
            
            // Check for milestones
            const insights = this.brain.getInsights();
            if (insights.recentMilestones && insights.recentMilestones.length > 0) {
                const latest = insights.recentMilestones[insights.recentMilestones.length - 1];
                if (new Date(latest.date).getTime() > Date.now() - 60000) {
                    this.uiController.showMilestone(latest);
                }
            }
            
            this.uiController.showSuccess('Analysis complete! Check your results below.');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.uiController.hideLoading();
            this.uiController.showError('Analysis failed: ' + error.message);
        }
    }

    // ==================== DATA LOADING ====================

    loadHistory() {
        try {
            const assessments = this.storage.getAllAssessments();
            this.uiController.displayHistory(assessments);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    loadStatistics() {
        try {
            const stats = this.storage.getStatistics();
            const progress = this.storage.getProgressAnalysis();
            this.uiController.displayStatistics(stats, progress);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }

    loadBrainInsights() {
        try {
            const insights = this.brain.getInsights();
            this.uiController.displayBrainInsights(insights);
        } catch (error) {
            console.error('Failed to load brain insights:', error);
        }
    }

    loadAssessment(id) {
        try {
            const assessment = this.storage.getAssessment(id);
            if (assessment) {
                this.uiController.displayResults(assessment);
                setTimeout(() => {
                    this.uiController.elements.resultsSection.scrollIntoView({ 
                        behavior: 'smooth', block: 'start'
                    });
                }, 200);
            } else {
                this.uiController.showError('Assessment not found');
            }
        } catch (error) {
            this.uiController.showError('Failed to load assessment');
        }
    }

    deleteAssessment(id) {
        if (confirm('Delete this assessment?')) {
            this.storage.deleteAssessment(id);
            this.loadHistory();
            this.loadStatistics();
            this.uiController.showSuccess('Assessment deleted');
        }
    }

    playAudio(assessmentId) {
        const audioUrl = this.storage.getAudioPlaybackUrl(assessmentId);
        if (audioUrl) {
            this.uiController.playAudio(audioUrl);
        } else {
            this.uiController.showError('Audio not available');
        }
    }

    // ==================== UTILITY ====================

    resetApp() {
        if (this.isRecording) {
            this.stopRecording();
        }
        this.cleanupRecording();
        this.currentTranscription = '';
        this.uiController.resetUI();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    exportData() {
        this.storage.exportData();
    }

    clearAllData() {
        if (this.storage.clearAllData()) {
            this.brain.resetBrain();
            this.loadHistory();
            this.loadStatistics();
            this.loadBrainInsights();
            this.uiController.showSuccess('All data cleared');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
    try {
        new SpeakProApp();
    } catch (error) {
        console.error('Init failed:', error);
        alert('Failed to initialize. Please refresh.');
    }
});
