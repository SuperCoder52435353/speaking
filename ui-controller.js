// ui-controller.js - Enhanced UI Controller
// Version 4.0 - With Transcription Display & Brain Insights
// Powered by Abduraxmon

class UIController {
    constructor() {
        this.elements = {
            uploadMethod: document.getElementById('uploadMethod'),
            recordMethod: document.getElementById('recordMethod'),
            audioFile: document.getElementById('audioFile'),
            recordingControls: document.getElementById('recordingControls'),
            recordBtn: document.getElementById('recordBtn'),
            recordingTime: document.getElementById('recordingTime'),
            recordingStatus: document.getElementById('recordingStatus'),
            liveTranscription: document.getElementById('liveTranscription'),
            topicSelect: document.getElementById('topicSelect'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            resultsSection: document.getElementById('resultsSection'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            historyList: document.getElementById('historyList'),
            newTestBtn: document.getElementById('newTestBtn'),
            feedbackContent: document.getElementById('feedbackContent'),
            statsSection: document.getElementById('statsSection'),
            brainSection: document.getElementById('brainSection')
        };
        
        this.currentFile = null;
        this.currentMode = null;
        this.currentTranscription = '';
        this.currentAudioPlayer = null;
        
        this.initDragDrop();
    }

    // ==================== DRAG & DROP ====================

    initDragDrop() {
        const uploadMethod = this.elements.uploadMethod;
        if (!uploadMethod) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadMethod.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadMethod.addEventListener(eventName, () => {
                uploadMethod.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadMethod.addEventListener(eventName, () => {
                uploadMethod.classList.remove('dragover');
            });
        });

        uploadMethod.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (window.app) {
                    const validation = window.app.audioProcessor.validateAudioFile(file);
                    if (validation.valid) {
                        this.handleFileUpload(file);
                    } else {
                        this.showError(validation.error);
                    }
                }
            }
        });
    }

    // ==================== UPLOAD METHODS ====================

    selectUploadMethod() {
        this.currentMode = 'upload';
        this.elements.uploadMethod.classList.add('active');
        this.elements.recordMethod.classList.remove('active');
        this.elements.recordingControls.classList.remove('active');
        this.hideLiveTranscription();
        this.elements.audioFile.click();
    }

    selectRecordMethod() {
        this.currentMode = 'record';
        this.elements.recordMethod.classList.add('active');
        this.elements.uploadMethod.classList.remove('active');
        this.elements.recordingControls.classList.add('active');
        this.currentFile = null;
        this.currentTranscription = '';
        this.elements.analyzeBtn.disabled = true;
        this.resetUploadMethod();
    }

    resetUploadMethod() {
        this.elements.uploadMethod.innerHTML = `
            <div class="method-icon">📁</div>
            <div class="method-title">Upload Audio File</div>
            <div class="method-subtitle">Drag & drop or click</div>
        `;
    }

    handleFileUpload(file) {
        if (!file) return;
        
        this.currentFile = file;
        this.currentMode = 'upload';
        this.currentTranscription = '';
        
        this.elements.uploadMethod.innerHTML = `
            <div class="method-icon">✅</div>
            <div class="method-title">${this.truncateText(file.name, 22)}</div>
            <div class="method-subtitle">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
        `;
        
        this.elements.uploadMethod.classList.add('active');
        this.elements.recordMethod.classList.remove('active');
        this.elements.recordingControls.classList.remove('active');
        this.elements.analyzeBtn.disabled = false;
    }

    handleRecordingComplete(audioBlob, transcription = '') {
        this.currentFile = audioBlob;
        this.currentTranscription = transcription;
        this.elements.analyzeBtn.disabled = false;
        
        this.elements.recordMethod.innerHTML = `
            <div class="method-icon">✅</div>
            <div class="method-title">Recording Ready</div>
            <div class="method-subtitle">${(audioBlob.size / 1024 / 1024).toFixed(2)} MB${transcription ? ' • Transcribed' : ''}</div>
        `;
        
        this.hideLiveTranscription();
    }

    // ==================== LIVE TRANSCRIPTION ====================

    showLiveTranscription() {
        const container = this.elements.liveTranscription;
        if (!container) return;
        
        container.style.display = 'block';
        container.innerHTML = `
            <div class="live-transcription-header">
                <span class="live-dot"></span>
                <span>Live Transcription</span>
            </div>
            <div class="live-transcription-text" id="liveTranscriptionText">
                Speak now... Your words will appear here.
            </div>
        `;
    }

    updateLiveTranscription(text) {
        const textEl = document.getElementById('liveTranscriptionText');
        if (textEl) {
            textEl.textContent = text || 'Speak now...';
            textEl.scrollTop = textEl.scrollHeight;
        }
    }

    hideLiveTranscription() {
        const container = this.elements.liveTranscription;
        if (container) {
            container.style.display = 'none';
        }
    }

    // ==================== LOADING ====================

    showLoading() {
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    }

    // ==================== RESULTS DISPLAY ====================

    displayResults(results) {
        this.elements.resultsSection.style.display = 'block';
        
        document.getElementById('levelText').textContent = results.level;
        document.getElementById('levelDescription').textContent = results.levelDescription;
        
        const overallEl = document.getElementById('overallScoreValue');
        if (overallEl) overallEl.textContent = results.overallScore + '%';
        
        setTimeout(() => {
            this.animateScore('pronunciation', results.scores.pronunciation);
            this.animateScore('vocabulary', results.scores.vocabulary);
            this.animateScore('fluency', results.scores.fluency);
            this.animateScore('grammar', results.scores.grammar);
            this.animateScore('time', results.scores.time);
            this.animateScore('coherence', results.scores.coherence);
        }, 300);
        
        this.elements.feedbackContent.innerHTML = results.detailedFeedback || '';
        
        this.displayErrors(results.errors);
        this.displayRecommendations(results.recommendations);
        this.displayStrengthsWeaknesses(results.strengths, results.weaknesses);
        
        setTimeout(() => {
            this.elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }

    animateScore(type, targetScore) {
        const fillEl = document.getElementById(type + 'Score');
        const valueEl = document.getElementById(type + 'Value');
        
        if (!fillEl || !valueEl) return;
        
        let current = 0;
        const increment = targetScore / 35;
        
        const interval = setInterval(() => {
            current += increment;
            if (current >= targetScore) {
                current = targetScore;
                clearInterval(interval);
            }
            
            fillEl.style.width = current + '%';
            valueEl.textContent = Math.round(current) + '%';
            
            // Colors based on score
            if (current >= 73) {
                fillEl.className = 'score-fill score-excellent';
            } else if (current >= 55) {
                fillEl.className = 'score-fill score-good';
            } else if (current >= 40) {
                fillEl.className = 'score-fill score-average';
            } else {
                fillEl.className = 'score-fill score-low';
            }
        }, 25);
    }

    displayErrors(errors) {
        const container = document.getElementById('errorsList');
        if (!container) return;
        
        if (!errors || errors.length === 0) {
            container.innerHTML = '<p class="empty-state">No major issues detected! 🎉</p>';
            return;
        }
        
        container.innerHTML = errors.map(error => `
            <div class="error-item severity-${error.severity}">
                <h4>${error.icon || '⚠️'} ${error.type}</h4>
                <p>${error.description}</p>
                ${error.examples?.length > 0 ? `
                    <ul>${error.examples.map(ex => `<li>${ex}</li>`).join('')}</ul>
                ` : ''}
            </div>
        `).join('');
    }

    displayRecommendations(recommendations) {
        const container = document.getElementById('recommendationsList');
        if (!container) return;
        
        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = '<p class="empty-state">Keep practicing! 🌟</p>';
            return;
        }
        
        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item priority-${rec.priority}">
                <h4>${rec.title}</h4>
                <p class="rec-meta">
                    <span class="rec-badge">${rec.category}</span>
                    <span class="priority-badge ${rec.priority}">${rec.priority.toUpperCase()}</span>
                </p>
                <p>${rec.description}</p>
                <ul>${rec.actions.map(a => `<li>${a}</li>`).join('')}</ul>
            </div>
        `).join('');
    }

    displayStrengthsWeaknesses(strengths, weaknesses) {
        const container = document.getElementById('strengthsWeaknesses');
        if (!container) return;
        
        container.innerHTML = `
            <div class="sw-grid">
                <div class="sw-box strengths">
                    <h4>💪 Strengths</h4>
                    ${strengths?.length > 0 ? 
                        `<ul>${strengths.map(s => `<li><strong>${s.name}</strong>: ${s.score}%</li>`).join('')}</ul>` :
                        '<p>Complete more tests to identify strengths</p>'}
                </div>
                <div class="sw-box weaknesses">
                    <h4>🎯 Focus Areas</h4>
                    ${weaknesses?.length > 0 ? 
                        `<ul>${weaknesses.map(w => `<li><strong>${w.name}</strong>: ${w.score}%</li>`).join('')}</ul>` :
                        '<p>Great job! No significant weaknesses</p>'}
                </div>
            </div>
        `;
    }

    // ==================== BRAIN INSIGHTS ====================

    displayBrainInsights(insights) {
        const container = this.elements.brainSection;
        if (!container) return;
        
        if (!insights || insights.totalSessions === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        let html = `<h2 class="section-title">🧠 AI Learning Insights</h2>`;
        
        // Quick stats
        html += `
            <div class="brain-stats">
                <div class="brain-stat">
                    <span class="brain-stat-value">${insights.totalSessions}</span>
                    <span class="brain-stat-label">Sessions</span>
                </div>
                <div class="brain-stat">
                    <span class="brain-stat-value">${insights.totalWordsSpoken.toLocaleString()}</span>
                    <span class="brain-stat-label">Words Spoken</span>
                </div>
                <div class="brain-stat">
                    <span class="brain-stat-value">${insights.uniqueWordCount}</span>
                    <span class="brain-stat-label">Unique Words</span>
                </div>
                <div class="brain-stat">
                    <span class="brain-stat-value">${insights.daysSinceFirst}</span>
                    <span class="brain-stat-label">Days Learning</span>
                </div>
            </div>
        `;
        
        // Overall trend
        if (insights.overallTrend && insights.overallTrend.trend !== 'insufficient_data') {
            const trendClass = insights.overallTrend.trend;
            const trendIcon = trendClass === 'improving' ? '📈' : trendClass === 'declining' ? '📉' : '➡️';
            
            html += `
                <div class="brain-trend ${trendClass}">
                    <span class="trend-icon">${trendIcon}</span>
                    <span class="trend-message">${insights.overallTrend.message}</span>
                </div>
            `;
        }
        
        // Personalized tips
        if (insights.tips && insights.tips.length > 0) {
            html += `
                <div class="brain-tips">
                    <h4>💡 Personalized Tips</h4>
                    <ul>
                        ${insights.tips.slice(0, 3).map(tip => `
                            <li class="tip-item tip-${tip.priority}">
                                <strong>${tip.skill}:</strong> ${tip.tip}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Favorite topic
        if (insights.favoriteTopic) {
            html += `
                <div class="brain-favorite">
                    <span>📌 Most practiced topic:</span>
                    <strong>${insights.favoriteTopic.topic}</strong>
                    <span>(${insights.favoriteTopic.count} times)</span>
                </div>
            `;
        }
        
        // Recent milestones
        if (insights.recentMilestones && insights.recentMilestones.length > 0) {
            html += `
                <div class="brain-milestones">
                    <h4>🏆 Recent Achievements</h4>
                    <div class="milestone-list">
                        ${insights.recentMilestones.slice(-3).reverse().map(m => `
                            <div class="milestone-item">
                                <span class="milestone-title">${m.title}</span>
                                <span class="milestone-desc">${m.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    showMilestone(milestone) {
        const popup = document.createElement('div');
        popup.className = 'milestone-popup';
        popup.innerHTML = `
            <div class="milestone-popup-content">
                <div class="milestone-icon">🎉</div>
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-desc">${milestone.description}</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 4000);
    }

    // ==================== STATISTICS ====================

    displayStatistics(stats, progress) {
        const container = this.elements.statsSection;
        if (!container) return;
        
        if (!stats || stats.totalAssessments === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        const totalMinutes = Math.round(stats.totalSpeakingTime / 60);
        
        let html = `
            <h2 class="section-title">📊 Your Progress</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-icon">📋</span>
                    <span class="stat-value">${stats.totalAssessments}</span>
                    <span class="stat-label">Tests</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-value">${totalMinutes}m</span>
                    <span class="stat-label">Speaking</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">📈</span>
                    <span class="stat-value">${stats.averageScore}%</span>
                    <span class="stat-label">Average</span>
                </div>
                <div class="stat-card highlight">
                    <span class="stat-icon">🏆</span>
                    <span class="stat-value">${stats.bestScore}%</span>
                    <span class="stat-label">Best</span>
                </div>
            </div>
        `;
        
        if (progress && progress.hasProgress) {
            const trendIcon = progress.isImproving ? '📈' : progress.improvement < 0 ? '📉' : '➡️';
            const trendClass = progress.isImproving ? 'positive' : progress.improvement < 0 ? 'negative' : 'neutral';
            
            html += `
                <div class="progress-trend ${trendClass}">
                    <span>${trendIcon}</span>
                    <span>${progress.message}</span>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    // ==================== HISTORY ====================

    displayHistory(assessments) {
        const container = this.elements.historyList;
        if (!container) return;
        
        if (!assessments || assessments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎤</span>
                    <p>No assessments yet. Start your first test!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = assessments.map(a => {
            const date = new Date(a.savedAt);
            const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            
            const hasAudio = window.app?.storage?.getAudioFile(a.id);
            const hasTranscription = a.transcription?.rawText;
            
            return `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-date">${dateStr}</span>
                        <span class="history-level level-${a.level}">${a.level}</span>
                    </div>
                    <div class="history-topic">📌 ${this.getTopicName(a.topic)}</div>
                    <div class="history-score">
                        <span class="overall-score">Score: ${a.overallScore}%</span>
                        ${hasTranscription ? '<span class="transcribed-badge">📝</span>' : ''}
                    </div>
                    <div class="history-actions">
                        ${hasAudio ? `<button class="btn-small btn-play" onclick="event.stopPropagation(); window.app.playAudio('${a.id}')">🔊 Play</button>` : ''}
                        <button class="btn-small btn-view" onclick="event.stopPropagation(); window.app.loadAssessment('${a.id}')">📋 View</button>
                        <button class="btn-small btn-delete" onclick="event.stopPropagation(); window.app.deleteAssessment('${a.id}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== AUDIO PLAYER ====================

    playAudio(audioUrl) {
        this.stopAudio();
        this.currentAudioPlayer = new Audio(audioUrl);
        this.currentAudioPlayer.play();
        this.showSuccess('Playing recording...');
    }

    stopAudio() {
        if (this.currentAudioPlayer) {
            this.currentAudioPlayer.pause();
            this.currentAudioPlayer = null;
        }
    }

    // ==================== UI RESET ====================

    resetUI() {
        this.currentFile = null;
        this.currentMode = null;
        this.currentTranscription = '';
        this.stopAudio();
        
        if (this.elements.audioFile) this.elements.audioFile.value = '';
        if (this.elements.topicSelect) this.elements.topicSelect.value = '';
        if (this.elements.analyzeBtn) this.elements.analyzeBtn.disabled = true;
        
        this.resetUploadMethod();
        
        this.elements.recordMethod.innerHTML = `
            <div class="method-icon">🎤</div>
            <div class="method-title">Live Recording</div>
            <div class="method-subtitle">With speech-to-text</div>
        `;
        
        this.elements.uploadMethod.classList.remove('active');
        this.elements.recordMethod.classList.remove('active');
        this.elements.recordingControls.classList.remove('active');
        
        this.elements.recordingTime.textContent = '00:00';
        this.elements.recordingStatus.textContent = 'Click to start recording';
        this.elements.recordBtn.classList.remove('recording');
        this.elements.recordBtn.textContent = '🎙️';
        
        this.hideLiveTranscription();
        this.elements.resultsSection.style.display = 'none';
        
        // Reset score bars
        ['pronunciation', 'vocabulary', 'fluency', 'grammar', 'time', 'coherence'].forEach(type => {
            const fill = document.getElementById(type + 'Score');
            const value = document.getElementById(type + 'Value');
            if (fill) { fill.style.width = '0%'; fill.className = 'score-fill'; }
            if (value) value.textContent = '0%';
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==================== NOTIFICATIONS ====================

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // ==================== HELPERS ====================

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - 3) + '...';
    }

    getTopicName(topic) {
        const topics = {
            'introduction': 'Self Introduction',
            'education': 'Education & Learning',
            'work': 'Work & Career',
            'technology': 'Technology',
            'environment': 'Environment',
            'health': 'Health & Lifestyle',
            'travel': 'Travel & Culture',
            'sports': 'Sports & Hobbies',
            'food': 'Food & Cooking',
            'custom': 'Custom Topic'
        };
        return topics[topic] || topic || 'General';
    }
}
