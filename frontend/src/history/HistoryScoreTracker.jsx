import React from "react";

export function HistoryScoreTracker({ history = [] }) {
  // Helper function to get date ranges
  const getDateRanges = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    return { today, weekStart };
  };

  // Calculate scores for different time periods and types
  const calculateScores = () => {
    const { today, weekStart } = getDateRanges();
    
    // Interview scores (correct/total questions)
    let interviewTodayCorrect = 0, interviewTodayTotal = 0;
    let interviewWeekCorrect = 0, interviewWeekTotal = 0;
    let interviewOverallCorrect = 0, interviewOverallTotal = 0;
    
    // Scenario scores (average score >= 70%)
    let scenarioTodayCorrect = 0, scenarioTodayTotal = 0;
    let scenarioWeekCorrect = 0, scenarioWeekTotal = 0;
    let scenarioOverallCorrect = 0, scenarioOverallTotal = 0;

    history.forEach(challenge => {
      const challengeDate = new Date(challenge.date_created);
      const challengeDateOnly = new Date(challengeDate.getFullYear(), challengeDate.getMonth(), challengeDate.getDate());
      
      if (challenge.type === "interview" && challenge.user_answer) {
        // Interview challenge scoring (binary correct/incorrect)
        interviewOverallTotal++;
        if (challenge.user_answer.is_correct) interviewOverallCorrect++;
        
        if (challengeDateOnly >= weekStart) {
          interviewWeekTotal++;
          if (challenge.user_answer.is_correct) interviewWeekCorrect++;
        }
        
        if (challengeDateOnly.getTime() === today.getTime()) {
          interviewTodayTotal++;
          if (challenge.user_answer.is_correct) interviewTodayCorrect++;
        }
      } else if (challenge.type === "scenario" && challenge.user_answers && challenge.user_answers.length > 0) {
        // Scenario challenge scoring (average score across questions)
        const totalQuestions = challenge.user_answers.length;
        const totalScore = challenge.user_answers.reduce((sum, answer) => sum + (answer.llm_score || 0), 0);
        const avgScore = totalScore / totalQuestions;
        const isCorrect = avgScore >= 70; // Consider 70+ as "correct"
        
        scenarioOverallTotal++;
        if (isCorrect) scenarioOverallCorrect++;
        
        if (challengeDateOnly >= weekStart) {
          scenarioWeekTotal++;
          if (isCorrect) scenarioWeekCorrect++;
        }
        
        if (challengeDateOnly.getTime() === today.getTime()) {
          scenarioTodayTotal++;
          if (isCorrect) scenarioTodayCorrect++;
        }
      }
    });

    return {
      interview: {
        today: { correct: interviewTodayCorrect, total: interviewTodayTotal },
        week: { correct: interviewWeekCorrect, total: interviewWeekTotal },
        overall: { correct: interviewOverallCorrect, total: interviewOverallTotal }
      },
      scenario: {
        today: { correct: scenarioTodayCorrect, total: scenarioTodayTotal },
        week: { correct: scenarioWeekCorrect, total: scenarioWeekTotal },
        overall: { correct: scenarioOverallCorrect, total: scenarioOverallTotal }
      }
    };
  };

  const scores = calculateScores();

  // Helper function to get percentage and color
  const getScoreDisplay = (correct, total) => {
    if (total === 0) return { percentage: 0, color: "gray", text: "No data" };
    
    const percentage = Math.round((correct / total) * 100);
    let color = "red";
    if (percentage >= 80) color = "green";
    else if (percentage >= 60) color = "orange";
    
    return { percentage, color, text: `${correct}/${total}` };
  };

  const interviewTodayDisplay = getScoreDisplay(scores.interview.today.correct, scores.interview.today.total);
  const interviewWeekDisplay = getScoreDisplay(scores.interview.week.correct, scores.interview.week.total);
  const interviewOverallDisplay = getScoreDisplay(scores.interview.overall.correct, scores.interview.overall.total);
  
  const scenarioTodayDisplay = getScoreDisplay(scores.scenario.today.correct, scores.scenario.today.total);
  const scenarioWeekDisplay = getScoreDisplay(scores.scenario.week.correct, scores.scenario.week.total);
  const scenarioOverallDisplay = getScoreDisplay(scores.scenario.overall.correct, scores.scenario.overall.total);

  // Overall combined stats
  const overallTodayTotal = scores.interview.today.total + scores.scenario.today.total;
  const overallTodayCorrect = scores.interview.today.correct + scores.scenario.today.correct;
  const overallTodayDisplay = getScoreDisplay(overallTodayCorrect, overallTodayTotal);

  return (
    <div className="score-tracker-panel">
      <div className="score-tracker-header">
        <h3>Performance Overview</h3>
        <p>Track your accuracy across different challenge types and time periods</p>
      </div>
      
      {/* Combined Today's Performance */}
      <div className="score-stats-grid single-row">
        <div className="score-stat-card today combined">
          <div className="score-stat-header">
            <div className="score-stat-icon">📅</div>
            <div className="score-stat-period">Today's Overall</div>
          </div>
          <div className="score-stat-content">
            <div className={`score-stat-number ${overallTodayDisplay.color}`}>
              {overallTodayDisplay.text}
            </div>
            <div className="score-stat-label">Correct Answers</div>
            {overallTodayTotal > 0 && (
              <div className="score-progress-bar">
                <div 
                  className={`score-progress-fill ${overallTodayDisplay.color}`}
                  style={{ width: `${overallTodayDisplay.percentage}%` }}
                ></div>
              </div>
            )}
            <div className={`score-percentage ${overallTodayDisplay.color}`}>
              {overallTodayTotal > 0 ? `${overallTodayDisplay.percentage}%` : "0%"}
            </div>
          </div>
        </div>
      </div>
      
      {/* Separate Performance by Type */}
      <div className="performance-breakdown">
        <div className="breakdown-header">
          <h4>Performance by Challenge Type</h4>
        </div>
        
        <div className="score-type-sections">
          {/* Interview Performance */}
          <div className="score-type-section">
            <div className="score-type-header">
              <span className="type-icon">🎯</span>
              <h5>Interview Challenges</h5>
              <span className="type-description">Multiple Choice Questions</span>
            </div>
            
            <div className="score-stats-grid three-columns">
              <div className="score-stat-card interview today">
                <div className="score-stat-period">Today</div>
                <div className={`score-stat-number ${interviewTodayDisplay.color}`}>
                  {interviewTodayDisplay.text}
                </div>
                {scores.interview.today.total > 0 && (
                  <div className="score-progress-bar">
                    <div 
                      className={`score-progress-fill ${interviewTodayDisplay.color}`}
                      style={{ width: `${interviewTodayDisplay.percentage}%` }}
                    ></div>
                  </div>
                )}
                <div className={`score-percentage ${interviewTodayDisplay.color}`}>
                  {scores.interview.today.total > 0 ? `${interviewTodayDisplay.percentage}%` : "0%"}
                </div>
              </div>
              
              <div className="score-stat-card interview week">
                <div className="score-stat-period">This Week</div>
                <div className={`score-stat-number ${interviewWeekDisplay.color}`}>
                  {interviewWeekDisplay.text}
                </div>
                {scores.interview.week.total > 0 && (
                  <div className="score-progress-bar">
                    <div 
                      className={`score-progress-fill ${interviewWeekDisplay.color}`}
                      style={{ width: `${interviewWeekDisplay.percentage}%` }}
                    ></div>
                  </div>
                )}
                <div className={`score-percentage ${interviewWeekDisplay.color}`}>
                  {scores.interview.week.total > 0 ? `${interviewWeekDisplay.percentage}%` : "0%"}
                </div>
              </div>
              
              <div className="score-stat-card interview overall">
                <div className="score-stat-period">All Time</div>
                <div className={`score-stat-number ${interviewOverallDisplay.color}`}>
                  {interviewOverallDisplay.text}
                </div>
                {scores.interview.overall.total > 0 && (
                  <div className="score-progress-bar">
                    <div 
                      className={`score-progress-fill ${interviewOverallDisplay.color}`}
                      style={{ width: `${interviewOverallDisplay.percentage}%` }}
                    ></div>
                  </div>
                )}
                <div className={`score-percentage ${interviewOverallDisplay.color}`}>
                  {scores.interview.overall.total > 0 ? `${interviewOverallDisplay.percentage}%` : "0%"}
                </div>
              </div>
            </div>
          </div>
          
          {/* Scenario Performance */}
          <div className="score-type-section">
            <div className="score-type-header">
              <span className="type-icon">🧠</span>
              <h5>Scenario Challenges</h5>
              <span className="type-description">Open-ended Questions (70%+ = Success)</span>
            </div>
            
            <div className="score-stats-grid three-columns">
              <div className="score-stat-card scenario today">
                <div className="score-stat-period">Today</div>
                <div className={`score-stat-number ${scenarioTodayDisplay.color}`}>
                  {scenarioTodayDisplay.text}
                </div>
                {scores.scenario.today.total > 0 && (
                  <div className="score-progress-bar">
                    <div 
                      className={`score-progress-fill ${scenarioTodayDisplay.color}`}
                      style={{ width: `${scenarioTodayDisplay.percentage}%` }}
                    ></div>
                  </div>
                )}
                <div className={`score-percentage ${scenarioTodayDisplay.color}`}>
                  {scores.scenario.today.total > 0 ? `${scenarioTodayDisplay.percentage}%` : "0%"}
                </div>
              </div>
              
              <div className="score-stat-card scenario week">
                <div className="score-stat-period">This Week</div>
                <div className={`score-stat-number ${scenarioWeekDisplay.color}`}>
                  {scenarioWeekDisplay.text}
                </div>
                {scores.scenario.week.total > 0 && (
                  <div className="score-progress-bar">
                    <div 
                      className={`score-progress-fill ${scenarioWeekDisplay.color}`}
                      style={{ width: `${scenarioWeekDisplay.percentage}%` }}
                    ></div>
                  </div>
                )}
                <div className={`score-percentage ${scenarioWeekDisplay.color}`}>
                  {scores.scenario.week.total > 0 ? `${scenarioWeekDisplay.percentage}%` : "0%"}
                </div>
              </div>
              
              <div className="score-stat-card scenario overall">
                <div className="score-stat-period">All Time</div>
                <div className={`score-stat-number ${scenarioOverallDisplay.color}`}>
                  {scenarioOverallDisplay.text}
                </div>
                {scores.scenario.overall.total > 0 && (
                  <div className="score-progress-bar">
                    <div 
                      className={`score-progress-fill ${scenarioOverallDisplay.color}`}
                      style={{ width: `${scenarioOverallDisplay.percentage}%` }}
                    ></div>
                  </div>
                )}
                <div className={`score-percentage ${scenarioOverallDisplay.color}`}>
                  {scores.scenario.overall.total > 0 ? `${scenarioOverallDisplay.percentage}%` : "0%"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance insights */}
      {(scores.interview.overall.total > 0 || scores.scenario.overall.total > 0) && (
        <div className="score-insights">
          <div className="score-insights-header">
            <h4>Quick Insights</h4>
          </div>
          <div className="score-insights-content">
            {overallTodayTotal > 0 ? (
              <div className="insight-item">
                <span className="insight-icon">⚡</span>
                <span>Today: {overallTodayDisplay.percentage}% overall accuracy ({interviewTodayDisplay.percentage}% MCQ, {scenarioTodayDisplay.percentage}% Scenario)</span>
              </div>
            ) : (
              <div className="insight-item">
                <span className="insight-icon">💡</span>
                <span>Start practicing today to track your progress!</span>
              </div>
            )}
            
            {scores.interview.overall.total >= 5 && (
              <div className="insight-item">
                <span className="insight-icon">🎯</span>
                <span>Interview practice: {scores.interview.overall.correct}/{scores.interview.overall.total} correct ({interviewOverallDisplay.percentage}%)</span>
              </div>
            )}
            
            {scores.scenario.overall.total >= 3 && (
              <div className="insight-item">
                <span className="insight-icon">🧠</span>
                <span>Scenario practice: {scores.scenario.overall.correct}/{scores.scenario.overall.total} successful ({scenarioOverallDisplay.percentage}%)</span>
              </div>
            )}
            
            {(interviewOverallDisplay.percentage >= 80 || scenarioOverallDisplay.percentage >= 80) && (
              <div className="insight-item">
                <span className="insight-icon">🌟</span>
                <span>Excellent performance in your strongest area!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 