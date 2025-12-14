// storage.js - Enhanced LocalStorage Manager with Voice Recording Support

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'speakpro_v3_assessments';
        this.AUDIO_KEY = 'speakpro_v3_audio_';
        this.STATS_KEY = 'speakpro_v3_stats';
        this.USER_KEY = 'speakpro_v3_user';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.STATS_KEY)) {
            localStorage.setItem(this.STATS_KEY, JSON.stringify({
                totalAssessments: 0,
                totalSpeakingTime: 0,
                averageScore: 0,
                bestScore: 0,
                levelProgress: [],
                firstAssessment: null,
                lastAssessment: null
            }));
        }
    }

    // ==================== AUDIO STORAGE ====================
    
    // Audio faylni base64 formatida saqlash (playback uchun)
    async saveAudioFile(audioBlob, assessmentId) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const audioData = {
                        data: e.target.result,
                        type: audioBlob.type || 'audio/webm',
                        size: audioBlob.size,
                        timestamp: Date.now(),
                        assessmentId: assessmentId
                    };
                    
                    // LocalStorage limit check (5MB per audio)
                    if (audioData.data.length > 5 * 1024 * 1024) {
                        console.warn('Audio file too large for storage, skipping save');
                        resolve(null);
                        return;
                    }
                    
                    localStorage.setItem(this.AUDIO_KEY + assessmentId, JSON.stringify(audioData));
                    console.log('Audio saved successfully:', assessmentId);
                    resolve(audioData);
                } catch (error) {
                    console.error('Error saving audio:', error);
                    // Storage quota exceeded - clean old audios
                    if (error.name === 'QuotaExceededError') {
                        this.cleanOldAudios();
                        reject(new Error('Storage full. Old recordings cleaned.'));
                    } else {
                        reject(error);
                    }
                }
            };
            
            reader.onerror = () => {
                console.error('FileReader error:', reader.error);
                reject(reader.error);
            };
            
            reader.readAsDataURL(audioBlob);
        });
    }

    // Audio faylni olish
    getAudioFile(assessmentId) {
        try {
            const audioStr = localStorage.getItem(this.AUDIO_KEY + assessmentId);
            return audioStr ? JSON.parse(audioStr) : null;
        } catch (error) {
            console.error('Error getting audio:', error);
            return null;
        }
    }

    // Audio playback URL yaratish
    getAudioPlaybackUrl(assessmentId) {
        const audioData = this.getAudioFile(assessmentId);
        if (audioData && audioData.data) {
            return audioData.data; // base64 data URL
        }
        return null;
    }

    // Eski audio fayllarni tozalash
    cleanOldAudios() {
        const assessments = this.getAllAssessments();
        const oldAssessments = assessments.slice(20); // Keep only last 20
        
        oldAssessments.forEach(a => {
            this.deleteAudioFile(a.id);
        });
        
        console.log('Cleaned', oldAssessments.length, 'old audio files');
    }

    // ==================== ASSESSMENT STORAGE ====================

    // Assessment saqlash
    saveAssessment(assessment) {
        try {
            const assessments = this.getAllAssessments();
            
            assessment.id = 'assess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            assessment.savedAt = new Date().toISOString();
            assessment.version = 3; // Version tracking
            
            assessments.unshift(assessment);
            
            // Maksimum 100 ta assessment saqlash
            if (assessments.length > 100) {
                const removed = assessments.pop();
                this.deleteAudioFile(removed.id);
            }
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assessments));
            
            // Update statistics
            this.updateStatistics(assessment);
            
            return assessment.id;
        } catch (error) {
            console.error('Error saving assessment:', error);
            return null;
        }
    }

    // Barcha assessmentlarni olish
    getAllAssessments() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading assessments:', error);
            return [];
        }
    }

    // Bitta assessmentni olish
    getAssessment(id) {
        const assessments = this.getAllAssessments();
        return assessments.find(a => a.id === id);
    }

    // Assessment o'chirish
    deleteAssessment(id) {
        try {
            const assessments = this.getAllAssessments();
            const filtered = assessments.filter(a => a.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            this.deleteAudioFile(id);
            return true;
        } catch (error) {
            console.error('Error deleting assessment:', error);
            return false;
        }
    }

    // Audio faylni o'chirish
    deleteAudioFile(assessmentId) {
        try {
            localStorage.removeItem(this.AUDIO_KEY + assessmentId);
        } catch (error) {
            console.error('Error deleting audio file:', error);
        }
    }

    // ==================== STATISTICS ====================

    // Statistikani yangilash
    updateStatistics(assessment) {
        try {
            const stats = this.getStatistics();
            const assessments = this.getAllAssessments();
            
            stats.totalAssessments = assessments.length;
            stats.totalSpeakingTime += assessment.duration || 0;
            stats.lastAssessment = new Date().toISOString();
            
            if (!stats.firstAssessment) {
                stats.firstAssessment = new Date().toISOString();
            }
            
            // Calculate average score
            const totalScore = assessments.reduce((sum, a) => sum + (a.overallScore || 0), 0);
            stats.averageScore = Math.round(totalScore / assessments.length);
            
            // Best score
            if (assessment.overallScore > stats.bestScore) {
                stats.bestScore = assessment.overallScore;
            }
            
            // Level progress tracking
            stats.levelProgress.push({
                date: new Date().toISOString(),
                level: assessment.level,
                score: assessment.overallScore
            });
            
            // Keep only last 50 progress entries
            if (stats.levelProgress.length > 50) {
                stats.levelProgress = stats.levelProgress.slice(-50);
            }
            
            localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    // Statistikani olish
    getStatistics() {
        try {
            const data = localStorage.getItem(this.STATS_KEY);
            return data ? JSON.parse(data) : {
                totalAssessments: 0,
                totalSpeakingTime: 0,
                averageScore: 0,
                bestScore: 0,
                levelProgress: [],
                firstAssessment: null,
                lastAssessment: null
            };
        } catch (error) {
            console.error('Error loading statistics:', error);
            return null;
        }
    }

    // Progress tahlili
    getProgressAnalysis() {
        const assessments = this.getAllAssessments();
        
        if (assessments.length < 2) {
            return {
                hasProgress: false,
                message: 'Complete at least 2 assessments to see your progress'
            };
        }
        
        const recent = assessments.slice(0, 5);
        const older = assessments.slice(-5);
        
        const recentAvg = recent.reduce((sum, a) => sum + (a.overallScore || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, a) => sum + (a.overallScore || 0), 0) / older.length;
        
        const improvement = recentAvg - olderAvg;
        
        // Skill-by-skill progress
        const skillProgress = {
            pronunciation: this.calculateSkillProgress(assessments, 'pronunciation'),
            vocabulary: this.calculateSkillProgress(assessments, 'vocabulary'),
            fluency: this.calculateSkillProgress(assessments, 'fluency'),
            grammar: this.calculateSkillProgress(assessments, 'grammar'),
            coherence: this.calculateSkillProgress(assessments, 'coherence')
        };
        
        return {
            hasProgress: true,
            improvement: Math.round(improvement),
            isImproving: improvement > 0,
            recentAverage: Math.round(recentAvg),
            skillProgress: skillProgress,
            totalAssessments: assessments.length,
            message: improvement > 5 
                ? `Great progress! You've improved by ${Math.round(improvement)}% recently!`
                : improvement > 0 
                    ? `You're making progress! Keep practicing.`
                    : improvement < -5
                        ? `Your recent scores are lower. Focus on weak areas.`
                        : `Steady performance. Challenge yourself with harder topics!`
        };
    }

    // Skill progress hisoblash
    calculateSkillProgress(assessments, skill) {
        if (assessments.length < 2) return 0;
        
        const recent = assessments.slice(0, 3);
        const older = assessments.slice(-3);
        
        const recentAvg = recent.reduce((sum, a) => sum + (a.scores?.[skill] || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, a) => sum + (a.scores?.[skill] || 0), 0) / older.length;
        
        return Math.round(recentAvg - olderAvg);
    }

    // ==================== UTILITY ====================

    // Barcha ma'lumotlarni tozalash
    clearAllData() {
        if (confirm('Are you sure you want to delete all data including recordings? This cannot be undone.')) {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('speakpro_v3_')) {
                        localStorage.removeItem(key);
                    }
                });
                this.init();
                return true;
            } catch (error) {
                console.error('Error clearing data:', error);
                return false;
            }
        }
        return false;
    }

    // Storage hajmini tekshirish
    getStorageInfo() {
        let total = 0;
        let audioSize = 0;
        let assessmentSize = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = localStorage[key].length + key.length;
                total += size;
                
                if (key.includes('audio')) {
                    audioSize += size;
                } else if (key.includes('assessment')) {
                    assessmentSize += size;
                }
            }
        }
        
        return {
            totalMB: (total / 1024 / 1024).toFixed(2),
            audioMB: (audioSize / 1024 / 1024).toFixed(2),
            assessmentMB: (assessmentSize / 1024 / 1024).toFixed(2),
            usedPercent: ((total / (5 * 1024 * 1024)) * 100).toFixed(1) // 5MB estimate
        };
    }

    // Export data
    exportData() {
        const data = {
            assessments: this.getAllAssessments(),
            statistics: this.getStatistics(),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `speakpro_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}
