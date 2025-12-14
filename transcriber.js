// transcriber.js - Speech-to-Text Transcription System
// Uses Web Speech API for real-time transcription
// Powered by Abduraxmon

class Transcriber {
    constructor() {
        this.recognition = null;
        this.isSupported = this.checkSupport();
        this.isTranscribing = false;
        this.transcript = '';
        this.interimTranscript = '';
        this.onTranscriptUpdate = null;
        this.onTranscriptComplete = null;
    }

    checkSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    init() {
        if (!this.isSupported) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configuration
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Event handlers
        this.recognition.onstart = () => {
            console.log('Transcription started');
            this.isTranscribing = true;
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            if (final) {
                this.transcript += final;
            }
            this.interimTranscript = interim;

            if (this.onTranscriptUpdate) {
                this.onTranscriptUpdate({
                    final: this.transcript,
                    interim: this.interimTranscript,
                    combined: this.transcript + this.interimTranscript
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Transcription error:', event.error);
            
            // Don't stop for no-speech error, just continue
            if (event.error !== 'no-speech') {
                this.isTranscribing = false;
            }
        };

        this.recognition.onend = () => {
            console.log('Transcription ended');
            
            // Auto-restart if still supposed to be transcribing
            if (this.isTranscribing) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.log('Could not restart transcription');
                    this.isTranscribing = false;
                }
            }

            if (this.onTranscriptComplete && !this.isTranscribing) {
                this.onTranscriptComplete(this.getFullTranscript());
            }
        };

        return true;
    }

    start() {
        if (!this.isSupported) {
            console.warn('Transcription not supported');
            return false;
        }

        if (!this.recognition) {
            this.init();
        }

        this.transcript = '';
        this.interimTranscript = '';
        this.isTranscribing = true;

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start transcription:', error);
            return false;
        }
    }

    stop() {
        this.isTranscribing = false;
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.log('Recognition already stopped');
            }
        }

        return this.getFullTranscript();
    }

    getFullTranscript() {
        return (this.transcript + this.interimTranscript).trim();
    }

    // ==================== TRANSCRIPT ANALYSIS ====================

    analyzeTranscript(text) {
        if (!text || text.length === 0) {
            return this.getEmptyAnalysis();
        }

        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Word analysis
        const wordCount = words.length;
        const uniqueWords = new Set(words);
        const uniqueWordCount = uniqueWords.size;
        const vocabularyRichness = uniqueWordCount / wordCount;

        // Filler words
        const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 
                            'literally', 'so', 'well', 'i mean', 'kind of', 'sort of'];
        const fillerWordMap = {};
        let fillerCount = 0;

        fillerWords.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) {
                fillerWordMap[filler] = matches.length;
                fillerCount += matches.length;
            }
        });

        // Sentence analysis
        const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;

        // Word length analysis
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

        // Advanced vocabulary detection
        const advancedWords = this.detectAdvancedVocabulary(words);

        // Grammar indicators (basic)
        const grammarIndicators = this.analyzeGrammarIndicators(text);

        // Coherence indicators
        const coherenceIndicators = this.analyzeCoherenceIndicators(text);

        return {
            wordCount,
            uniqueWordCount,
            vocabularyRichness: (vocabularyRichness * 100).toFixed(1),
            sentenceCount: sentences.length,
            avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
            avgWordLength: avgWordLength.toFixed(1),
            fillerWordCount: fillerCount,
            fillerWords: fillerWordMap,
            fillerRatio: ((fillerCount / wordCount) * 100).toFixed(1),
            advancedWords: advancedWords,
            advancedWordCount: advancedWords.length,
            grammarIndicators,
            coherenceIndicators,
            rawText: text
        };
    }

    detectAdvancedVocabulary(words) {
        // Common advanced English words (B2-C2 level)
        const advancedWordList = [
            'furthermore', 'moreover', 'nevertheless', 'consequently', 'subsequently',
            'particularly', 'significantly', 'essentially', 'predominantly', 'fundamentally',
            'comprehensive', 'substantial', 'considerable', 'remarkable', 'extraordinary',
            'implement', 'establish', 'demonstrate', 'illustrate', 'emphasize',
            'perspective', 'approach', 'aspect', 'factor', 'impact',
            'enhance', 'facilitate', 'contribute', 'integrate', 'accommodate',
            'environment', 'technology', 'development', 'opportunity', 'experience',
            'sustainable', 'innovative', 'efficient', 'effective', 'beneficial',
            'analyze', 'evaluate', 'assess', 'determine', 'investigate',
            'phenomenon', 'methodology', 'hypothesis', 'paradigm', 'synthesis'
        ];

        const foundAdvanced = [];
        const wordSet = new Set(words.map(w => w.toLowerCase()));

        advancedWordList.forEach(word => {
            if (wordSet.has(word)) {
                foundAdvanced.push(word);
            }
        });

        // Also detect longer words (8+ chars) as potentially advanced
        words.forEach(word => {
            if (word.length >= 8 && !foundAdvanced.includes(word.toLowerCase())) {
                foundAdvanced.push(word.toLowerCase());
            }
        });

        return [...new Set(foundAdvanced)].slice(0, 20);
    }

    analyzeGrammarIndicators(text) {
        const indicators = {
            hasComplexSentences: false,
            hasConditionals: false,
            hasPerfectTenses: false,
            hasPassiveVoice: false,
            score: 50
        };

        // Complex sentence markers
        const complexMarkers = ['although', 'whereas', 'while', 'despite', 'unless', 'provided that'];
        indicators.hasComplexSentences = complexMarkers.some(m => text.toLowerCase().includes(m));

        // Conditionals
        const conditionalMarkers = ['if', 'would', 'could', 'might', 'should'];
        const conditionalCount = conditionalMarkers.filter(m => text.toLowerCase().includes(m)).length;
        indicators.hasConditionals = conditionalCount >= 2;

        // Perfect tenses
        const perfectMarkers = ['have been', 'has been', 'had been', 'have had', 'has had'];
        indicators.hasPerfectTenses = perfectMarkers.some(m => text.toLowerCase().includes(m));

        // Passive voice
        const passiveMarkers = ['is done', 'was done', 'been done', 'be done', 'is made', 'was made'];
        indicators.hasPassiveVoice = passiveMarkers.some(m => text.toLowerCase().includes(m));

        // Calculate grammar score based on variety
        let score = 50;
        if (indicators.hasComplexSentences) score += 15;
        if (indicators.hasConditionals) score += 10;
        if (indicators.hasPerfectTenses) score += 10;
        if (indicators.hasPassiveVoice) score += 5;
        indicators.score = Math.min(100, score);

        return indicators;
    }

    analyzeCoherenceIndicators(text) {
        const indicators = {
            hasIntroduction: false,
            hasConclusion: false,
            hasTransitionWords: false,
            transitionWordsUsed: [],
            score: 50
        };

        const lowerText = text.toLowerCase();

        // Introduction markers
        const introMarkers = ['i would like to', 'i want to talk about', 'let me', 'first of all', 
                             'to begin with', 'i think', 'in my opinion'];
        indicators.hasIntroduction = introMarkers.some(m => lowerText.includes(m));

        // Conclusion markers
        const conclusionMarkers = ['in conclusion', 'to sum up', 'finally', 'overall', 
                                   'to conclude', 'in summary', 'all in all'];
        indicators.hasConclusion = conclusionMarkers.some(m => lowerText.includes(m));

        // Transition words
        const transitionWords = ['firstly', 'secondly', 'thirdly', 'however', 'therefore',
                                'moreover', 'furthermore', 'additionally', 'nevertheless',
                                'on the other hand', 'for example', 'for instance',
                                'as a result', 'consequently', 'in addition'];
        
        transitionWords.forEach(tw => {
            if (lowerText.includes(tw)) {
                indicators.transitionWordsUsed.push(tw);
            }
        });
        indicators.hasTransitionWords = indicators.transitionWordsUsed.length > 0;

        // Calculate coherence score
        let score = 50;
        if (indicators.hasIntroduction) score += 15;
        if (indicators.hasConclusion) score += 15;
        if (indicators.hasTransitionWords) score += indicators.transitionWordsUsed.length * 5;
        indicators.score = Math.min(100, score);

        return indicators;
    }

    getEmptyAnalysis() {
        return {
            wordCount: 0,
            uniqueWordCount: 0,
            vocabularyRichness: '0',
            sentenceCount: 0,
            avgWordsPerSentence: '0',
            avgWordLength: '0',
            fillerWordCount: 0,
            fillerWords: {},
            fillerRatio: '0',
            advancedWords: [],
            advancedWordCount: 0,
            grammarIndicators: { score: 50 },
            coherenceIndicators: { score: 50 },
            rawText: ''
        };
    }

    // ==================== VOCABULARY LEVEL DETECTION ====================

    detectVocabularyLevel(analysis) {
        if (!analysis || analysis.wordCount === 0) {
            return { level: 'Unknown', score: 0 };
        }

        let score = 0;

        // Word count factor
        if (analysis.wordCount >= 150) score += 20;
        else if (analysis.wordCount >= 100) score += 15;
        else if (analysis.wordCount >= 50) score += 10;
        else score += 5;

        // Vocabulary richness
        const richness = parseFloat(analysis.vocabularyRichness);
        if (richness >= 70) score += 25;
        else if (richness >= 50) score += 18;
        else if (richness >= 35) score += 12;
        else score += 5;

        // Advanced words
        if (analysis.advancedWordCount >= 5) score += 20;
        else if (analysis.advancedWordCount >= 3) score += 15;
        else if (analysis.advancedWordCount >= 1) score += 8;

        // Sentence complexity
        const avgWords = parseFloat(analysis.avgWordsPerSentence);
        if (avgWords >= 15) score += 15;
        else if (avgWords >= 10) score += 10;
        else if (avgWords >= 7) score += 5;

        // Filler words penalty
        const fillerRatio = parseFloat(analysis.fillerRatio);
        if (fillerRatio > 10) score -= 15;
        else if (fillerRatio > 5) score -= 8;
        else if (fillerRatio > 2) score -= 3;

        score = Math.max(0, Math.min(100, score));

        let level;
        if (score >= 80) level = 'C1-C2';
        else if (score >= 65) level = 'B2';
        else if (score >= 50) level = 'B1';
        else if (score >= 35) level = 'A2';
        else level = 'A1';

        return { level, score };
    }
}
