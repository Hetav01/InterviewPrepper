import { useAuth } from "@clerk/clerk-react";

export const useApi = () => {
    const { getToken } = useAuth();
    const makeRequest = async (endpoint, options = {}) => {
        const token = await getToken();
        const defaultOptions = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        }

        const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
            ...defaultOptions,
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (response.status === 429) {
                throw new Error("Daily request limit exceeded. Please try again later.");
            }
            throw new Error(errorData?.detail || "An error occurred.")
        }

        return response.json();
    }

    // ------------------------------
    // Challenge Generation
    // ------------------------------

    const generateInterviewChallenge = async(difficulty, topic, numQuestions) => {
        return await makeRequest("challenges/interview", {
            method: "POST",
            body: JSON.stringify({
                difficulty: difficulty,
                topic: topic,
                num_questions: numQuestions
            })
        });
    };

    const generateScenarioChallenge = async(difficulty, topic, numQuestions) => {
        return await makeRequest("challenges/scenario", {
            method: "POST",
            body: JSON.stringify({
                difficulty: difficulty,
                topic: topic,
                num_questions: numQuestions
            })
        });
    };

    // ------------------------------
    // Quota Management
    // ------------------------------

    const initializeQuotas = async() => {
        return await makeRequest("quotas/initialize", {
            method: "POST"
        });
    };

    const getAllQuotas = async() => {
        return await makeRequest("quotas");
    };

    const getSpecificQuota = async(quotaType) => {
        return await makeRequest(`quotas/${quotaType}`);
    };

    // ------------------------------
    // Challenge History
    // ------------------------------

    const getChallengeHistory = async() => {
        return await makeRequest("challenges/history");
    }



    // ------------------------------
    // Scenario Answer Submission
    // ------------------------------
    const submitScenarioAnswer = async(scenarioId, questionIndex, userAnswer) => {
        return await makeRequest("scenario-answers", {
            method: "POST",
            body: JSON.stringify({
                scenario_id: scenarioId,
                question_index: questionIndex,
                user_answer: userAnswer
            })
        });
    };

    // ------------------------------
    // Interview Answer Submission
    // ------------------------------
    const submitInterviewAnswer = async(challengeId, userAnswerId, timeTakenSeconds = null) => {
        return await makeRequest("interview-answers", {
            method: "POST",
            body: JSON.stringify({
                challenge_id: challengeId,
                user_answer_id: userAnswerId,
                time_taken_seconds: timeTakenSeconds
            })
        });
    };

    // ------------------------------
    // Convenience Functions
    // ------------------------------
    const generateChallenge = async (challengeType, difficulty, topic, numQuestions) => {
        if (challengeType === "interview" || challengeType === "mcq") {
            return await generateInterviewChallenge(difficulty, topic, numQuestions);
        } else if (challengeType === "scenario") {
            return await generateScenarioChallenge(difficulty, topic, numQuestions);
        } else {
            throw new Error("Invalid challenge type");
        }
    };
    
    const ensureQuotasInitialized = async() => {
        try {
            const quotaData = await getAllQuotas();
            if (quotaData.missing_quotas && quotaData.missing_quotas.length > 0) {
                return await initializeQuotas();    // Initialize quotas if missing or empty.
            }
            return quotaData;
        }
        catch (error) {
            if (error.message.includes("not found")) {
                return await initializeQuotas();
            }
            throw error;
        }
    }

    const getUserStats = async() => {
        const history = await getChallengeHistory();
        const stats = {
            totalChallenges: history.total_count, 
            interviewChallenges: history.interview_count,
            scenarioChallenges: history.scenario_count,
            recentChallenges: history.challenges.slice(0, 5),
            topicBreakdown: {},
            difficultyBreakdown: { Easy: 0, Medium: 0, Hard: 0 }
        };

        history.challenges.forEach((challenge) => {
            // Topic breakdown
            if (stats.topicBreakdown[challenge.topic]) {
                stats.topicBreakdown[challenge.topic]++;
            } else {
                stats.topicBreakdown[challenge.topic] = 1;
            }

            // Difficulty breakdown
            if (stats.difficultyBreakdown[challenge.difficulty]) {
                stats.difficultyBreakdown[challenge.difficulty]++;
            }
        });

        return stats;
    }

    return {
      // Core request function
      makeRequest,

      // Challenge generation
      generateInterviewChallenge,
      generateScenarioChallenge,
      generateChallenge,

      // Quota management
      initializeQuotas,
      getAllQuotas,
      getSpecificQuota,
      ensureQuotasInitialized,

      // History and stats
      getChallengeHistory,
      getUserStats,



      // Answer submission
      submitScenarioAnswer,
      submitInterviewAnswer,
    };
}