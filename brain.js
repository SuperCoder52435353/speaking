// brain.js - AI Brain Learning System
// Learns from user's speaking patterns, mistakes, and progress
// Powered by Abduraxmon

class BrainSystem {
    constructor() {
        this.BRAIN_KEY = 'speakpro_brain_v1';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.BRAIN_KEY)) {
            localStorage.setItem(this.BRAIN_KEY, JSON.stringify(this.getDefaultBrain()));
        }
    }

    getDefaultBrain() {
        return {
            // User profile
            userProfile: {
                totalSessions: 0,
                firstSession: null,
                lastSession: null,
                preferredTopics: [],
                nativeLanguage: null,
                targetLevel: null
            },
            
            // Learning patterns
            learningPatterns: {
                strongSkills: [],
                weakSkills: [],
                improvingSkills: [],
                decliningSkills: []
            },
            
            // Common mistakes tracking
            commonMistakes: {
                pronunciation: [],
                grammar: [],
                vocabulary: [],
                fluency: []
            },
            
            // Topic mastery
            topicMastery: {},
            
            // Word bank (learned from transcriptions)
            wordBank: {
                frequentWords: {},
                uniqueWords: new Set(),
                fillerWords: {},
                totalWords: 0
            },
            
            // Progress milestones
            milestones: [],
            
            // Personalized tips
            personalizedTips: [],
            
            // Session history for learning
            sessionHistory: []
        };
    }

    // ==================== BRAIN OPERATIONS ====================

    getBrain() {
        try {
            const data = localStorage.getItem(this.BRAIN_KEY);
            return data ? JSON.parse(data) : this.getDefaultBrain();
        } catch (error) {
            console.error('Error loading brain:', error);
            return this.getDefaultBrain();
        }
    }

    saveBrain(brain) {
        try {
            // Convert Set to Array for JSON
            if (brain.wordBank && brain.wordBank.uniqueWords instanceof Set) {
                brain.wordBank.uniqueWords = Array.from(brain.wordBank.uniqueWords);
            }
            localStorage.setItem(this.BRAIN_KEY, JSON.stringify(brain));
        } catch (error) {
            console.error('Error saving brain:', error);
        }
    }

    // ==================== LEARNING FROM SESSION ====================

    learnFromSession(assessment, transcription = null) {
        const brain = this.getBrain();
        
        // Update user profile
        brain.userProfile.totalSessions++;
        brain.userProfile.lastSession = new Date().toISOString();
        if (!brain.userProfile.firstSession) {
            brain.userProfile.firstSession = new Date().toISOString();
        }
        
        // Track topic preference
        if (assessment.topic) {
            this.updateTopicPreference(brain, assessment.topic);
            this.updateTopicMastery(brain, assessment.topic, assessment.overallScore);
        }
        
        // Analyze skills
        this.analyzeSkillPatterns(brain, assessment.scores);
        
        // Learn from mistakes
        if (assessment.errors) {
            this.learnFromMistakes(brain, assessment.errors);
        }
        
        // Learn from transcription
        if (transcription) {
            this.learnFromTranscription(brain, transcription);
        }
        
        // Check for milestones
        this.checkMilestones(brain, assessment);
        
        // Generate personalized tips
        this.generatePersonalizedTips(brain);
        
        // Add to session history
        brain.sessionHistory.push({
            date: new Date().toISOString(),
            topic: assessment.topic,
            level: assessment.level,
            overallScore: assessment.overallScore,
            scores: assessment.scores
        });
        
        // Keep only last 100 sessions
        if (brain.sessionHistory.length > 100) {
            brain.sessionHistory = brain.sessionHistory.slice(-100);
        }
        
        this.saveBrain(brain);
        
        return brain;
    }

    // ==================== TOPIC LEARNING ====================

    updateTopicPreference(brain, topic) {
        const existing = brain.userProfile.preferredTopics.find(t => t.topic === topic);
        
        if (existing) {
            existing.count++;
            existing.lastUsed = new Date().toISOString();
        } else {
            brain.userProfile.preferredTopics.push({
                topic: topic,
                count: 1,
                firstUsed: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            });
        }
        
        // Sort by frequency
        brain.userProfile.preferredTopics.sort((a, b) => b.count - a.count);
        
        // Keep top 10
        brain.userProfile.preferredTopics = brain.userProfile.preferredTopics.slice(0, 10);
    }

    updateTopicMastery(brain, topic, score) {
        if (!brain.topicMastery[topic]) {
            brain.topicMastery[topic] = {
                attempts: 0,
                totalScore: 0,
                averageScore: 0,
                bestScore: 0,
                lastScore: 0,
                trend: 'stable',
                scores: []
            };
        }
        
        const mastery = brain.topicMastery[topic];
        mastery.attempts++;
        mastery.totalScore += score;
        mastery.averageScore = Math.round(mastery.totalScore / mastery.attempts);
        mastery.lastScore = score;
        
        if (score > mastery.bestScore) {
            mastery.bestScore = score;
        }
        
        mastery.scores.push(score);
        if (mastery.scores.length > 10) {
            mastery.scores = mastery.scores.slice(-10);
        }
        
        // Calculate trend
        if (mastery.scores.length >= 3) {
            const recent = mastery.scores.slice(-3);
            const older = mastery.scores.slice(-6, -3);
            
            if (older.length > 0) {
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
                
                if (recentAvg - olderAvg > 5) {
                    mastery.trend = 'improving';
                } else if (olderAvg - recentAvg > 5) {
                    mastery.trend = 'declining';
                } else {
                    mastery.trend = 'stable';
                }
            }
        }
    }

    // ==================== SKILL PATTERN ANALYSIS ====================

    analyzeSkillPatterns(brain, scores) {
        const skills = Object.keys(scores);
        
        // Categorize skills
        brain.learningPatterns.strongSkills = [];
        brain.learningPatterns.weakSkills = [];
        
        skills.forEach(skill => {
            const score = scores[skill];
            
            if (score >= 75) {
                brain.learningPatterns.strongSkills.push({ skill, score });
            } else if (score < 55) {
                brain.learningPatterns.weakSkills.push({ skill, score });
            }
        });
        
        // Sort by score
        brain.learningPatterns.strongSkills.sort((a, b) => b.score - a.score);
        brain.learningPatterns.weakSkills.sort((a, b) => a.score - b.score);
        
        // Analyze trends from session history
        if (brain.sessionHistory.length >= 5) {
            const recentSessions = brain.sessionHistory.slice(-5);
            const olderSessions = brain.sessionHistory.slice(-10, -5);
            
            if (olderSessions.length > 0) {
                skills.forEach(skill => {
                    const recentAvg = recentSessions.reduce((sum, s) => sum + (s.scores?.[skill] || 0), 0) / recentSessions.length;
                    const olderAvg = olderSessions.reduce((sum, s) => sum + (s.scores?.[skill] || 0), 0) / olderSessions.length;
                    
                    const diff = recentAvg - olderAvg;
                    
                    if (diff > 5) {
                        if (!brain.learningPatterns.improvingSkills.find(s => s.skill === skill)) {
                            brain.learningPatterns.improvingSkills.push({ skill, improvement: Math.round(diff) });
                        }
                    } else if (diff < -5) {
                        if (!brain.learningPatterns.decliningSkills.find(s => s.skill === skill)) {
                            brain.learningPatterns.decliningSkills.push({ skill, decline: Math.round(Math.abs(diff)) });
                        }
                    }
                });
            }
        }
    }

    // ==================== MISTAKE LEARNING ====================

    learnFromMistakes(brain, errors) {
        errors.forEach(error => {
            const category = error.type.toLowerCase();
            
            if (brain.commonMistakes[category]) {
                const existing = brain.commonMistakes[category].find(m => m.description === error.description);
                
                if (existing) {
                    existing.count++;
                    existing.lastOccurrence = new Date().toISOString();
                } else {
                    brain.commonMistakes[category].push({
                        description: error.description,
                        severity: error.severity,
                        count: 1,
                        firstOccurrence: new Date().toISOString(),
                        lastOccurrence: new Date().toISOString()
                    });
                }
                
                // Sort by frequency
                brain.commonMistakes[category].sort((a, b) => b.count - a.count);
                
                // Keep top 10 per category
                brain.commonMistakes[category] = brain.commonMistakes[category].slice(0, 10);
            }
        });
    }

    // ==================== TRANSCRIPTION LEARNING ====================

    learnFromTranscription(brain, transcription) {
        if (!transcription || typeof transcription !== 'string') return;
        
        // Clean and split words
        const words = transcription.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);
        
        brain.wordBank.totalWords += words.length;
        
        // Filler words detection
        const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well', 'i mean'];
        
        words.forEach(word => {
            // Track frequent words
            brain.wordBank.frequentWords[word] = (brain.wordBank.frequentWords[word] || 0) + 1;
            
            // Track unique words
            if (Array.isArray(brain.wordBank.uniqueWords)) {
                if (!brain.wordBank.uniqueWords.includes(word)) {
                    brain.wordBank.uniqueWords.push(word);
                }
            }
            
            // Track filler words
            if (fillerWords.includes(word)) {
                brain.wordBank.fillerWords[word] = (brain.wordBank.fillerWords[word] || 0) + 1;
            }
        });
        
        // Keep only top 500 frequent words
        const sortedFrequent = Object.entries(brain.wordBank.frequentWords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 500);
        brain.wordBank.frequentWords = Object.fromEntries(sortedFrequent);
        
        // Keep only 1000 unique words
        if (brain.wordBank.uniqueWords.length > 1000) {
            brain.wordBank.uniqueWords = brain.wordBank.uniqueWords.slice(-1000);
        }
    }

    // ==================== MILESTONES ====================

    checkMilestones(brain, assessment) {
        const milestones = [];
        
        // First session
        if (brain.userProfile.totalSessions === 1) {
            milestones.push({
                type: 'first_session',
                title: '🎉 First Steps!',
                description: 'You completed your first speaking assessment!',
                date: new Date().toISOString()
            });
        }
        
        // Session count milestones
        const sessionMilestones = [5, 10, 25, 50, 100];
        if (sessionMilestones.includes(brain.userProfile.totalSessions)) {
            milestones.push({
                type: 'session_count',
                title: `🏆 ${brain.userProfile.totalSessions} Sessions!`,
                description: `You've completed ${brain.userProfile.totalSessions} speaking assessments!`,
                date: new Date().toISOString()
            });
        }
        
        // Level achievements
        const levelAchievements = {
            'B1': { title: '📈 Intermediate Level!', desc: 'You reached B1 level!' },
            'B2': { title: '🌟 Upper Intermediate!', desc: 'You reached B2 level!' },
            'C1': { title: '🔥 Advanced Speaker!', desc: 'You reached C1 level!' },
            'C2': { title: '👑 Master Level!', desc: 'You achieved C2 - near-native fluency!' }
        };
        
        if (levelAchievements[assessment.level]) {
            const existingLevel = brain.milestones.find(m => m.type === 'level_' + assessment.level);
            if (!existingLevel) {
                milestones.push({
                    type: 'level_' + assessment.level,
                    title: levelAchievements[assessment.level].title,
                    description: levelAchievements[assessment.level].desc,
                    date: new Date().toISOString()
                });
            }
        }
        
        // High score
        if (assessment.overallScore >= 90) {
            const existing90 = brain.milestones.find(m => m.type === 'score_90');
            if (!existing90) {
                milestones.push({
                    type: 'score_90',
                    title: '💯 Excellent Score!',
                    description: 'You scored 90% or higher!',
                    date: new Date().toISOString()
                });
            }
        }
        
        // Add new milestones
        brain.milestones.push(...milestones);
        
        return milestones;
    }

    // ==================== PERSONALIZED TIPS ====================

    generatePersonalizedTips(brain) {
        const tips = [];
        
        // Based on weak skills
        if (brain.learningPatterns.weakSkills.length > 0) {
            const weakest = brain.learningPatterns.weakSkills[0];
            tips.push({
                priority: 'high',
                skill: weakest.skill,
                tip: this.getTipForSkill(weakest.skill),
                reason: `Your ${weakest.skill} score is ${weakest.score}%`
            });
        }
        
        // Based on declining skills
        brain.learningPatterns.decliningSkills.forEach(skill => {
            tips.push({
                priority: 'medium',
                skill: skill.skill,
                tip: `Focus on ${skill.skill} - it has declined by ${skill.decline}% recently`,
                reason: 'Declining trend detected'
            });
        });
        
        // Based on filler words
        const fillerCount = Object.values(brain.wordBank.fillerWords).reduce((a, b) => a + b, 0);
        if (fillerCount > 10) {
            tips.push({
                priority: 'medium',
                skill: 'fluency',
                tip: 'Try to reduce filler words like "um", "uh", "like". Pause silently instead.',
                reason: `You've used filler words ${fillerCount} times`
            });
        }
        
        // Based on topic mastery
        const weakTopics = Object.entries(brain.topicMastery)
            .filter(([_, data]) => data.averageScore < 60)
            .map(([topic, data]) => ({ topic, score: data.averageScore }));
        
        if (weakTopics.length > 0) {
            tips.push({
                priority: 'low',
                skill: 'vocabulary',
                tip: `Practice more on ${weakTopics[0].topic} topic - your average is ${weakTopics[0].score}%`,
                reason: 'Topic-specific weakness'
            });
        }
        
        brain.personalizedTips = tips.slice(0, 5);
    }

    getTipForSkill(skill) {
        const tips = {
            pronunciation: 'Practice with tongue twisters and record yourself comparing to native speakers',
            fluency: 'Try the shadowing technique - repeat after native speakers immediately',
            vocabulary: 'Learn 5 new words daily and use them in sentences',
            grammar: 'Focus on one grammar rule per week and practice it extensively',
            coherence: 'Use transition words: firstly, however, therefore, in conclusion',
            time: 'Practice with a timer to manage your response length'
        };
        return tips[skill] || 'Keep practicing regularly';
    }

    // ==================== INSIGHTS ====================

    getInsights() {
        const brain = this.getBrain();
        
        return {
            // User stats
            totalSessions: brain.userProfile.totalSessions,
            daysSinceFirst: this.daysSince(brain.userProfile.firstSession),
            
            // Strong and weak areas
            strongestSkill: brain.learningPatterns.strongSkills[0] || null,
            weakestSkill: brain.learningPatterns.weakSkills[0] || null,
            
            // Improving skills
            improvingSkills: brain.learningPatterns.improvingSkills,
            
            // Favorite topic
            favoriteTopic: brain.userProfile.preferredTopics[0] || null,
            
            // Topic mastery
            topicMastery: brain.topicMastery,
            
            // Common mistakes
            topMistakes: this.getTopMistakes(brain),
            
            // Word stats
            totalWordsSpoken: brain.wordBank.totalWords,
            uniqueWordCount: Array.isArray(brain.wordBank.uniqueWords) ? brain.wordBank.uniqueWords.length : 0,
            fillerWordCount: Object.values(brain.wordBank.fillerWords).reduce((a, b) => a + b, 0),
            
            // Personalized tips
            tips: brain.personalizedTips,
            
            // Milestones
            recentMilestones: brain.milestones.slice(-5),
            
            // Overall trend
            overallTrend: this.calculateOverallTrend(brain)
        };
    }

    getTopMistakes(brain) {
        const allMistakes = [];
        
        Object.entries(brain.commonMistakes).forEach(([category, mistakes]) => {
            mistakes.forEach(m => {
                allMistakes.push({ ...m, category });
            });
        });
        
        return allMistakes.sort((a, b) => b.count - a.count).slice(0, 5);
    }

    calculateOverallTrend(brain) {
        if (brain.sessionHistory.length < 5) {
            return { trend: 'insufficient_data', message: 'Complete more sessions to see trends' };
        }
        
        const recent = brain.sessionHistory.slice(-5);
        const older = brain.sessionHistory.slice(-10, -5);
        
        if (older.length === 0) {
            return { trend: 'insufficient_data', message: 'Complete more sessions to see trends' };
        }
        
        const recentAvg = recent.reduce((sum, s) => sum + s.overallScore, 0) / recent.length;
        const olderAvg = older.reduce((sum, s) => sum + s.overallScore, 0) / older.length;
        
        const diff = recentAvg - olderAvg;
        
        if (diff > 5) {
            return { trend: 'improving', change: Math.round(diff), message: `Great progress! +${Math.round(diff)}% improvement` };
        } else if (diff < -5) {
            return { trend: 'declining', change: Math.round(diff), message: `Scores declining by ${Math.round(Math.abs(diff))}%. Focus on weak areas.` };
        } else {
            return { trend: 'stable', change: Math.round(diff), message: 'Steady performance. Challenge yourself!' };
        }
    }

    daysSince(dateStr) {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        const now = new Date();
        return Math.floor((now - date) / (1000 * 60 * 60 * 24));
    }

    // ==================== RESET ====================

    resetBrain() {
        if (confirm('Reset all learning data? This will clear your progress history and learned patterns.')) {
            localStorage.setItem(this.BRAIN_KEY, JSON.stringify(this.getDefaultBrain()));
            return true;
        }
        return false;
    }
}
