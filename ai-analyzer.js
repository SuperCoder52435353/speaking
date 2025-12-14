// ai-analyzer.js - Enhanced AI-Powered Speaking Analysis Engine
// Version 4.0 - With Transcription Analysis
// Powered by Abduraxmon

class AIAnalyzer {
    constructor() {
        this.levelThresholds = {
            'A1': { min: 0, max: 28, description: 'Beginner - Basic words and phrases' },
            'A2': { min: 28, max: 42, description: 'Elementary - Simple everyday expressions' },
            'B1': { min: 42, max: 58, description: 'Intermediate - Familiar topics with effort' },
            'B2': { min: 58, max: 73, description: 'Upper Intermediate - Fluent interaction' },
            'C1': { min: 73, max: 87, description: 'Advanced - Complex topics with ease' },
            'C2': { min: 87, max: 100, description: 'Mastery - Near-native proficiency' }
        };

        this.weights = {
            pronunciation: 0.22,
            fluency: 0.22,
            vocabulary: 0.18,
            grammar: 0.15,
            coherence: 0.13,
            time: 0.10
        };
    }

    // ==================== MAIN ANALYSIS ====================

    async analyzeFullSpeaking(audioFeatures, topic, transcriptionAnalysis = null) {
        try {
            console.log('Starting comprehensive AI analysis with transcription...');
            
            // Individual skill analysis with transcription data
            const pronunciation = this.analyzePronunciation(audioFeatures, transcriptionAnalysis);
            const fluency = this.analyzeFluency(audioFeatures, transcriptionAnalysis);
            const vocabulary = this.analyzeVocabulary(audioFeatures, topic, transcriptionAnalysis);
            const grammar = this.analyzeGrammar(audioFeatures, transcriptionAnalysis);
            const coherence = this.analyzeCoherence(audioFeatures, transcriptionAnalysis);
            const timeManagement = this.analyzeTimeManagement(audioFeatures);

            // Calculate weighted overall score
            const overallScore = this.calculateOverallScore({
                pronunciation: pronunciation.score,
                fluency: fluency.score,
                vocabulary: vocabulary.score,
                grammar: grammar.score,
                coherence: coherence.score,
                time: timeManagement.score
            });

            const level = this.determineLevel(overallScore);
            const levelInfo = this.levelThresholds[level];

            // Generate feedback
            const errors = this.identifyErrors({
                pronunciation, fluency, vocabulary, grammar, coherence
            });

            const recommendations = this.generateRecommendations({
                pronunciation, fluency, vocabulary, grammar, coherence,
                level, overallScore, transcriptionAnalysis
            });

            const detailedFeedback = this.generateDetailedFeedback({
                pronunciation, fluency, vocabulary, grammar, 
                coherence, timeManagement, level, overallScore,
                audioFeatures, transcriptionAnalysis
            });

            const analysis = this.identifyStrengthsWeaknesses({
                pronunciation, fluency, vocabulary, grammar, coherence
            });

            return {
                level,
                levelDescription: levelInfo.description,
                overallScore,
                scores: {
                    pronunciation: pronunciation.score,
                    vocabulary: vocabulary.score,
                    fluency: fluency.score,
                    grammar: grammar.score,
                    time: timeManagement.score,
                    coherence: coherence.score
                },
                detailedFeedback,
                errors,
                recommendations,
                strengths: analysis.strengths,
                weaknesses: analysis.weaknesses,
                topic,
                duration: audioFeatures.duration,
                transcription: transcriptionAnalysis,
                timestamp: new Date().toISOString(),
                analysisVersion: '4.0'
            };
        } catch (error) {
            console.error('Analysis error:', error);
            throw new Error('Failed to analyze speaking: ' + error.message);
        }
    }

    // ==================== PRONUNCIATION ANALYSIS ====================

    analyzePronunciation(features, transcription) {
        let score = 50;
        let feedback = [];
        let issues = [];
        let details = [];

        // Audio clarity
        const clarity = features.clarity || 50;
        if (clarity >= 80) {
            score += 25;
            feedback.push('Excellent speech clarity');
            details.push('Your articulation is clear and easy to understand');
        } else if (clarity >= 60) {
            score += 15;
            feedback.push('Good clarity overall');
        } else if (clarity >= 40) {
            score += 5;
            issues.push('Work on clearer articulation');
        } else {
            score -= 10;
            issues.push('Pronunciation needs significant improvement');
        }

        // Pitch variation (intonation)
        const pitchVar = parseFloat(features.pitchVariation) || 0;
        if (pitchVar >= 0.25 && pitchVar <= 0.55) {
            score += 15;
            feedback.push('Natural intonation');
        } else if (pitchVar < 0.15) {
            score -= 12;
            issues.push('Speech sounds monotone - add expression');
        } else if (pitchVar > 0.7) {
            score -= 5;
            issues.push('Intonation too varied');
        } else {
            score += 8;
        }

        // Volume consistency
        if (features.volumeConsistency >= 0.6) {
            score += 10;
            feedback.push('Consistent volume');
        } else if (features.volumeConsistency < 0.3) {
            score -= 5;
            issues.push('Volume varies too much');
        }

        // Transcription bonus - if words detected clearly
        if (transcription && transcription.wordCount > 0) {
            const avgWordLength = parseFloat(transcription.avgWordLength) || 0;
            if (avgWordLength >= 4.5) {
                score += 5;
                details.push('Clear pronunciation of longer words detected');
            }
        }

        score = Math.min(100, Math.max(0, score));

        return {
            score: Math.round(score),
            feedback,
            issues,
            details,
            honestAssessment: this.getPronunciationAssessment(score)
        };
    }

    getPronunciationAssessment(score) {
        if (score >= 80) return 'Your pronunciation is excellent. Native speakers understand you easily.';
        if (score >= 65) return 'Good pronunciation with minor issues. Keep practicing difficult sounds.';
        if (score >= 50) return 'Pronunciation is developing. Practice with native audio regularly.';
        return 'Focus on basic pronunciation. Record yourself and compare with natives.';
    }

    // ==================== FLUENCY ANALYSIS ====================

    analyzeFluency(features, transcription) {
        let score = 50;
        let feedback = [];
        let issues = [];
        let details = [];

        const duration = features.duration || 0;
        const pauseCount = features.totalPauses || 0;
        const pauseDuration = parseFloat(features.pauseDuration) || 0;
        const speechRate = features.speechRate || 100;

        // Pause ratio analysis
        const pauseRatio = duration > 0 ? pauseDuration / duration : 0;
        
        if (pauseRatio < 0.15 && pauseCount >= 3 && pauseCount <= 12) {
            score += 28;
            feedback.push('Excellent fluency with natural pauses');
        } else if (pauseRatio < 0.25 && pauseCount <= 18) {
            score += 18;
            feedback.push('Good fluency overall');
        } else if (pauseRatio < 0.35) {
            score += 8;
            issues.push('Reduce hesitations between thoughts');
        } else {
            score -= 10;
            issues.push('Too many pauses - practice speaking more smoothly');
        }

        // Speech rate
        if (speechRate >= 110 && speechRate <= 150) {
            score += 18;
            feedback.push('Natural speaking pace');
        } else if (speechRate >= 90 && speechRate < 110) {
            score += 10;
            issues.push('Try speaking a bit faster');
        } else if (speechRate > 150 && speechRate <= 170) {
            score += 10;
            issues.push('Slow down slightly');
        } else if (speechRate < 90) {
            score -= 5;
            issues.push('Speaking too slowly');
        } else {
            score -= 10;
            issues.push('Speaking too fast - listeners may struggle');
        }

        // Filler words from transcription
        if (transcription) {
            const fillerRatio = parseFloat(transcription.fillerRatio) || 0;
            
            if (fillerRatio > 8) {
                score -= 15;
                issues.push(`Too many filler words (${transcription.fillerWordCount} detected)`);
                details.push('Common fillers: ' + Object.keys(transcription.fillerWords || {}).join(', '));
            } else if (fillerRatio > 4) {
                score -= 8;
                issues.push('Reduce filler words like "um", "uh", "like"');
            } else if (fillerRatio <= 2) {
                score += 5;
                feedback.push('Minimal filler words - great fluency!');
            }
        }

        score = Math.min(100, Math.max(0, score));

        return {
            score: Math.round(score),
            feedback,
            issues,
            details,
            honestAssessment: this.getFluencyAssessment(score),
            stats: {
                pauseRatio: (pauseRatio * 100).toFixed(1) + '%',
                speechRate: speechRate + ' wpm',
                pauseCount,
                fillerWords: transcription?.fillerWordCount || 0
            }
        };
    }

    getFluencyAssessment(score) {
        if (score >= 80) return 'Excellent fluency! You speak naturally and smoothly.';
        if (score >= 65) return 'Good fluency with some hesitations. Practice speaking without pausing.';
        if (score >= 50) return 'Fluency needs work. Try shadowing exercises.';
        return 'Significant fluency issues. Focus on reducing pauses and filler words.';
    }

    // ==================== VOCABULARY ANALYSIS ====================

    analyzeVocabulary(features, topic, transcription) {
        let score = 45;
        let feedback = [];
        let issues = [];
        let details = [];

        // If we have transcription data, use it for accurate assessment
        if (transcription && transcription.wordCount > 0) {
            // Word count
            const wordCount = transcription.wordCount;
            if (wordCount >= 150) {
                score += 20;
                feedback.push(`Good vocabulary demonstration (${wordCount} words)`);
            } else if (wordCount >= 80) {
                score += 12;
                feedback.push(`Adequate word count (${wordCount} words)`);
            } else {
                score += 5;
                issues.push('Speak more to demonstrate vocabulary range');
            }

            // Vocabulary richness (unique words ratio)
            const richness = parseFloat(transcription.vocabularyRichness) || 0;
            if (richness >= 65) {
                score += 18;
                feedback.push('Excellent word variety');
                details.push(`${transcription.uniqueWordCount} unique words used`);
            } else if (richness >= 45) {
                score += 12;
                feedback.push('Good word variety');
            } else {
                score += 5;
                issues.push('Use more varied vocabulary - avoid repetition');
            }

            // Advanced vocabulary
            if (transcription.advancedWordCount >= 5) {
                score += 15;
                feedback.push('Strong use of advanced vocabulary');
                details.push('Advanced words: ' + transcription.advancedWords.slice(0, 5).join(', '));
            } else if (transcription.advancedWordCount >= 2) {
                score += 8;
                feedback.push('Some advanced vocabulary used');
            } else {
                issues.push('Try using more sophisticated vocabulary');
            }

        } else {
            // Fallback to audio-based estimation
            const duration = features.duration || 0;
            const speechRate = features.speechRate || 100;
            const estimatedWords = Math.round((duration - parseFloat(features.pauseDuration || 0)) * (speechRate / 60));

            if (estimatedWords >= 150) {
                score += 25;
                feedback.push('Good vocabulary range demonstrated');
            } else if (estimatedWords >= 80) {
                score += 15;
            } else {
                issues.push('Speak longer to show vocabulary');
            }
        }

        // Topic bonus
        if (topic && topic !== 'custom') {
            score += 5;
            details.push(`Topic vocabulary expected: ${this.getTopicVocabulary(topic)}`);
        }

        score = Math.min(100, Math.max(0, score));

        return {
            score: Math.round(score),
            feedback,
            issues,
            details,
            honestAssessment: this.getVocabularyAssessment(score),
            wordCount: transcription?.wordCount || null,
            uniqueWords: transcription?.uniqueWordCount || null
        };
    }

    getVocabularyAssessment(score) {
        if (score >= 80) return 'Excellent vocabulary range! You use varied and sophisticated words.';
        if (score >= 65) return 'Good vocabulary. Continue learning new words daily.';
        if (score >= 50) return 'Vocabulary is developing. Read more to expand your word bank.';
        return 'Limited vocabulary. Focus on learning common words and phrases first.';
    }

    // ==================== GRAMMAR ANALYSIS ====================

    analyzeGrammar(features, transcription) {
        let score = 50;
        let feedback = [];
        let issues = [];
        let details = [];

        // Audio-based confidence indicators
        if (features.volumeConsistency >= 0.6 && features.speechRate >= 100) {
            score += 15;
            feedback.push('Confident speech suggests good grammar control');
        } else if (features.volumeConsistency >= 0.4) {
            score += 8;
        } else {
            issues.push('Hesitation may indicate grammar uncertainty');
        }

        // Transcription-based grammar analysis
        if (transcription && transcription.grammarIndicators) {
            const gi = transcription.grammarIndicators;
            
            if (gi.hasComplexSentences) {
                score += 12;
                feedback.push('Uses complex sentence structures');
            }
            
            if (gi.hasConditionals) {
                score += 8;
                feedback.push('Good use of conditionals');
            }
            
            if (gi.hasPerfectTenses) {
                score += 8;
                feedback.push('Uses perfect tenses correctly');
            }
            
            if (gi.hasPassiveVoice) {
                score += 5;
                details.push('Passive voice structures detected');
            }

            // Sentence complexity from word count
            const avgWords = parseFloat(transcription.avgWordsPerSentence) || 0;
            if (avgWords >= 12) {
                score += 8;
                feedback.push('Good sentence complexity');
            } else if (avgWords < 6) {
                issues.push('Try using longer, more complex sentences');
            }
        }

        if (features.clarity >= 70) {
            score += 8;
            feedback.push('Clear speech structure');
        }

        score = Math.min(100, Math.max(0, score));

        // Honest disclaimer
        details.push('Note: Full grammar accuracy requires human review');

        return {
            score: Math.round(score),
            feedback,
            issues,
            details,
            honestAssessment: this.getGrammarAssessment(score),
            limitation: 'Automated analysis may miss some grammar errors'
        };
    }

    getGrammarAssessment(score) {
        if (score >= 80) return 'Grammar appears strong with complex structures used correctly.';
        if (score >= 65) return 'Good grammar control. Focus on advanced structures.';
        if (score >= 50) return 'Grammar is adequate. Review common error patterns.';
        return 'Grammar needs attention. Start with basic sentence structures.';
    }

    // ==================== COHERENCE ANALYSIS ====================

    analyzeCoherence(features, transcription) {
        let score = 45;
        let feedback = [];
        let issues = [];
        let details = [];

        // Audio-based coherence
        const pauseScore = features.pauseScore || 50;
        if (pauseScore >= 85) {
            score += 20;
            feedback.push('Well-organized speech structure');
        } else if (pauseScore >= 70) {
            score += 15;
            feedback.push('Good organization');
        } else {
            score += 5;
            issues.push('Organize ideas more clearly');
        }

        // Pitch variation for emphasis
        const pitchVar = parseFloat(features.pitchVariation) || 0;
        if (pitchVar >= 0.2 && pitchVar <= 0.5) {
            score += 12;
            feedback.push('Good use of emphasis');
        }

        // Transcription-based coherence
        if (transcription && transcription.coherenceIndicators) {
            const ci = transcription.coherenceIndicators;
            
            if (ci.hasIntroduction) {
                score += 10;
                feedback.push('Clear introduction detected');
            } else {
                issues.push('Start with a clear introduction');
            }
            
            if (ci.hasConclusion) {
                score += 10;
                feedback.push('Good conclusion');
            } else {
                issues.push('End with a clear conclusion');
            }
            
            if (ci.hasTransitionWords && ci.transitionWordsUsed.length > 0) {
                score += ci.transitionWordsUsed.length * 3;
                feedback.push(`Uses transition words: ${ci.transitionWordsUsed.slice(0, 3).join(', ')}`);
            } else {
                issues.push('Use linking words: however, therefore, moreover');
            }
        }

        // Duration appropriateness
        const duration = features.duration || 0;
        if (duration >= 60 && duration <= 180) {
            score += 5;
        } else if (duration < 30) {
            score -= 10;
            issues.push('Response too short for coherent development');
        }

        score = Math.min(100, Math.max(0, score));

        return {
            score: Math.round(score),
            feedback,
            issues,
            details,
            honestAssessment: this.getCoherenceAssessment(score)
        };
    }

    getCoherenceAssessment(score) {
        if (score >= 80) return 'Excellent organization! Ideas flow logically.';
        if (score >= 65) return 'Good coherence. Use more transition words.';
        if (score >= 50) return 'Organization needs work. Plan before speaking.';
        return 'Focus on clear structure: introduction, body, conclusion.';
    }

    // ==================== TIME MANAGEMENT ====================

    analyzeTimeManagement(features) {
        const duration = features.duration || 0;
        const minutes = duration / 60;
        
        let score, feedback;
        let issues = [];

        if (minutes < 0.5) {
            score = 30;
            feedback = 'Too short! Aim for 1-2 minutes minimum';
            issues.push('Expand your response with more details');
        } else if (minutes >= 0.5 && minutes < 1) {
            score = 55;
            feedback = 'A bit short. Add more content';
            issues.push('Include examples and explanations');
        } else if (minutes >= 1 && minutes <= 2.5) {
            score = 95;
            feedback = 'Perfect timing! Well-balanced response';
        } else if (minutes > 2.5 && minutes <= 3.5) {
            score = 82;
            feedback = 'Good length, slightly long';
            issues.push('Be more concise');
        } else {
            score = 65;
            feedback = 'Too long. Focus on key points';
            issues.push('Practice summarizing');
        }

        return {
            score: Math.round(score),
            feedback,
            issues,
            duration,
            minutes: minutes.toFixed(1)
        };
    }

    // ==================== SCORING ====================

    calculateOverallScore(scores) {
        let totalScore = 0;
        for (let key in scores) {
            totalScore += (scores[key] || 0) * (this.weights[key] || 0.1);
        }
        return Math.round(Math.min(100, Math.max(0, totalScore)));
    }

    determineLevel(overallScore) {
        for (let level in this.levelThresholds) {
            const range = this.levelThresholds[level];
            if (overallScore >= range.min && overallScore < range.max) {
                return level;
            }
        }
        return 'C2';
    }

    // ==================== FEEDBACK GENERATION ====================

    identifyErrors(analyses) {
        const errors = [];
        const threshold = 58;

        const skillMap = {
            pronunciation: { name: 'Pronunciation', icon: '🗣️' },
            fluency: { name: 'Fluency', icon: '⚡' },
            vocabulary: { name: 'Vocabulary', icon: '📝' },
            grammar: { name: 'Grammar', icon: '🎯' },
            coherence: { name: 'Coherence', icon: '💡' }
        };

        Object.entries(analyses).forEach(([skill, data]) => {
            if (data.score < threshold && skillMap[skill]) {
                errors.push({
                    type: skillMap[skill].name,
                    icon: skillMap[skill].icon,
                    severity: data.score < 40 ? 'high' : data.score < 50 ? 'medium' : 'low',
                    description: data.honestAssessment,
                    examples: data.issues || []
                });
            }
        });

        return errors.sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.severity] - order[b.severity];
        });
    }

    identifyStrengthsWeaknesses(analyses) {
        const skills = Object.entries(analyses).map(([name, data]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            score: data.score
        }));

        skills.sort((a, b) => b.score - a.score);

        return {
            strengths: skills.filter(s => s.score >= 65).slice(0, 3),
            weaknesses: skills.filter(s => s.score < 58).slice(-3).reverse()
        };
    }

    generateRecommendations(data) {
        const recommendations = [];
        const { pronunciation, fluency, vocabulary, grammar, coherence, level, transcriptionAnalysis } = data;

        // Priority recommendations based on weakest skills
        const skills = [
            { name: 'pronunciation', score: pronunciation.score, data: pronunciation },
            { name: 'fluency', score: fluency.score, data: fluency },
            { name: 'vocabulary', score: vocabulary.score, data: vocabulary },
            { name: 'grammar', score: grammar.score, data: grammar },
            { name: 'coherence', score: coherence.score, data: coherence }
        ].sort((a, b) => a.score - b.score);

        const weakest = skills[0];

        if (weakest.score < 65) {
            recommendations.push(this.getSkillRecommendation(weakest.name, weakest.data));
        }

        // Second weakest if significantly low
        if (skills[1].score < 60) {
            recommendations.push(this.getSkillRecommendation(skills[1].name, skills[1].data));
        }

        // Filler words recommendation
        if (transcriptionAnalysis && transcriptionAnalysis.fillerWordCount > 5) {
            recommendations.push({
                priority: 'high',
                category: 'Fluency',
                title: '🚫 Reduce Filler Words',
                description: `You used ${transcriptionAnalysis.fillerWordCount} filler words`,
                actions: [
                    'Practice pausing silently instead of saying "um"',
                    'Record yourself and count filler words',
                    'Slow down and think before speaking',
                    'Use transition words instead of fillers'
                ]
            });
        }

        // Level-specific
        if (level === 'A1' || level === 'A2') {
            recommendations.push({
                priority: 'high',
                category: 'Foundation',
                title: '🏗️ Build Strong Foundation',
                description: 'Focus on basic skills first',
                actions: [
                    'Learn the 1000 most common English words',
                    'Practice basic sentence patterns daily',
                    'Watch English videos with subtitles',
                    'Speak English for 10 minutes every day'
                ]
            });
        }

        return recommendations.slice(0, 4);
    }

    getSkillRecommendation(skill, data) {
        const recs = {
            pronunciation: {
                title: '🗣️ Improve Pronunciation',
                description: 'Focus on clear articulation',
                actions: [
                    'Use pronunciation apps (ELSA, Speechling)',
                    'Record yourself and compare with natives',
                    'Practice difficult sounds daily',
                    'Learn word stress patterns'
                ]
            },
            fluency: {
                title: '⚡ Improve Fluency',
                description: 'Speak more smoothly',
                actions: [
                    'Practice shadowing technique',
                    'Read aloud for 10 minutes daily',
                    'Reduce thinking time before speaking',
                    'Learn common phrases and expressions'
                ]
            },
            vocabulary: {
                title: '📚 Expand Vocabulary',
                description: 'Learn and use more words',
                actions: [
                    'Learn 5-10 new words daily',
                    'Use spaced repetition apps',
                    'Read extensively on various topics',
                    'Use new words in sentences immediately'
                ]
            },
            grammar: {
                title: '📝 Strengthen Grammar',
                description: 'Master sentence structures',
                actions: [
                    'Focus on one grammar rule per week',
                    'Practice with grammar exercises',
                    'Write sentences using new structures',
                    'Get feedback from teachers or apps'
                ]
            },
            coherence: {
                title: '💡 Improve Organization',
                description: 'Structure your ideas clearly',
                actions: [
                    'Use introduction-body-conclusion structure',
                    'Learn transition words',
                    'Plan your response before speaking',
                    'Practice IELTS/TOEFL speaking tasks'
                ]
            }
        };

        return {
            priority: data.score < 50 ? 'high' : 'medium',
            category: skill.charAt(0).toUpperCase() + skill.slice(1),
            ...recs[skill]
        };
    }

    generateDetailedFeedback(data) {
        const parts = [];
        const { pronunciation, fluency, vocabulary, grammar, coherence, timeManagement, 
                level, overallScore, audioFeatures, transcriptionAnalysis } = data;

        // Overall assessment
        parts.push(`
            <div class="feedback-item">
                <h4>📊 Overall Assessment</h4>
                <p>Level: <strong>${level}</strong> (${this.levelThresholds[level].description})</p>
                <p>Score: <strong>${overallScore}/100</strong></p>
                <p>Duration: ${Math.floor(audioFeatures.duration / 60)}m ${Math.floor(audioFeatures.duration % 60)}s</p>
                ${transcriptionAnalysis ? `<p>Words spoken: ~${transcriptionAnalysis.wordCount}</p>` : ''}
            </div>
        `);

        // Transcription display
        if (transcriptionAnalysis && transcriptionAnalysis.rawText) {
            parts.push(`
                <div class="feedback-item transcription-box">
                    <h4>📝 Your Speech (Transcription)</h4>
                    <div class="transcription-text">${transcriptionAnalysis.rawText}</div>
                    <div class="transcription-stats">
                        <span>Words: ${transcriptionAnalysis.wordCount}</span>
                        <span>Unique: ${transcriptionAnalysis.uniqueWordCount}</span>
                        <span>Sentences: ${transcriptionAnalysis.sentenceCount}</span>
                        ${transcriptionAnalysis.fillerWordCount > 0 ? 
                            `<span class="filler-warning">Fillers: ${transcriptionAnalysis.fillerWordCount}</span>` : ''}
                    </div>
                </div>
            `);
        }

        // Skills feedback
        const skills = [
            { name: 'Pronunciation', icon: '🗣️', data: pronunciation },
            { name: 'Fluency', icon: '⚡', data: fluency },
            { name: 'Vocabulary', icon: '📝', data: vocabulary },
            { name: 'Grammar', icon: '🎯', data: grammar },
            { name: 'Coherence', icon: '💡', data: coherence },
            { name: 'Time', icon: '⏱️', data: timeManagement }
        ];

        skills.forEach(skill => {
            const d = skill.data;
            // Handle feedback - can be array or string
            const feedbackText = Array.isArray(d.feedback) ? d.feedback.join('. ') : (d.feedback || '');
            const issuesText = Array.isArray(d.issues) && d.issues.length > 0 ? d.issues.join('. ') : '';
            const detailsText = Array.isArray(d.details) && d.details.length > 0 ? d.details.join('. ') : '';
            
            parts.push(`
                <div class="feedback-item">
                    <h4>${skill.icon} ${skill.name} (${d.score}%)</h4>
                    <p>${feedbackText}${feedbackText && !feedbackText.endsWith('.') ? '.' : ''}</p>
                    ${d.honestAssessment ? `<p><em>${d.honestAssessment}</em></p>` : ''}
                    ${d.stats ? `<p class="stats-line">📈 ${Object.entries(d.stats).map(([k,v]) => `${k}: ${v}`).join(' | ')}</p>` : ''}
                    ${issuesText ? `<p class="issue">⚠️ ${issuesText}</p>` : ''}
                    ${detailsText ? `<p class="details">ℹ️ ${detailsText}</p>` : ''}
                </div>
            `);
        });

        return parts.join('');
    }

    getTopicVocabulary(topic) {
        const vocabMap = {
            'introduction': 'personal, background, experience, interests, hobbies',
            'education': 'academic, learning, skills, courses, degree, university',
            'work': 'career, professional, responsibilities, achievements, colleagues',
            'technology': 'digital, innovation, devices, software, artificial intelligence',
            'environment': 'nature, sustainability, climate, ecosystem, pollution',
            'health': 'wellness, fitness, nutrition, mental health, lifestyle',
            'travel': 'culture, destinations, experiences, adventure, tourism',
            'sports': 'competition, training, teamwork, fitness, championship',
            'food': 'cuisine, cooking, ingredients, nutrition, restaurant'
        };
        return vocabMap[topic] || 'general vocabulary';
    }
}
