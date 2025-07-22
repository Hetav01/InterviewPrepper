import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './OnboardingModal.css';
import { TargetIcon, LightbulbIcon, ChartIcon, QuestionIcon, StarIcon } from '../ExtraComponents/icons';

export default function OnboardingModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  
  const steps = [
    {
      title: "Welcome to IntrVu!",
      description: "Let's get you started with your ML interview preparation journey.",
      icon: <TargetIcon size={53} color="currentColor" />,
      content: "This quick tour will show you how to create personalized challenges and track your progress."
    },
    {
      title: "Choose Your Challenge Type",
      description: "Select between Interview (MCQ) or Scenario challenges.",
      icon: <QuestionIcon size={53} color="currentColor" />,
      content: "• Interview: Multiple choice questions with instant feedback\n• Scenario: Open-ended problems with detailed explanations"
    },
    {
      title: "Set Your Preferences",
      description: "Configure difficulty, topic, and number of questions.",
      icon: <QuestionIcon size={53} color="currentColor" />,
      content: "• Difficulty: Easy, Medium, or Hard\n• Topic: Enter any ML concept (e.g., Neural Networks, SVM)\n• Questions: 1-7 for Interview, 1-3 for Scenario"
    },
    {
      title: "Generate & Practice",
      description: "Create your personalized challenge and start practicing.",
      icon: <ChartIcon size={53} color="currentColor" />,
      content: "• Click 'Generate Challenge' to create questions\n• Answer each question and get instant feedback\n• Review detailed explanations to learn from mistakes"
    },
    {
      title: "Track Your Progress",
      description: "Monitor your performance and review your history.",
      icon: <ChartIcon size={53} color="currentColor" />,
      content: "• View your challenge history in the History tab\n• Track performance across different topics\n• Daily quotas reset every 24 hours"
    },
    {
      title: "You're All Set!",
      description: "Ready to ace your ML interviews? Let's get started!",
      icon: <StarIcon size={53} color="currentColor" />,
      content: "Start by selecting your challenge type and entering a topic. Good luck with your interview preparation!"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="onboarding-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <span className="progress-text">{currentStep + 1} of {steps.length}</span>
          </div>
          <button className="onboarding-close" onClick={skipTour}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="onboarding-content">
          <div className="step-icon">
            {currentStepData.icon}
          </div>
          
          <h2 className="step-title">{currentStepData.title}</h2>
          <p className="step-description">{currentStepData.description}</p>
          
          <div className="step-content">
            <pre>{currentStepData.content}</pre>
          </div>
        </div>

        <div className="onboarding-footer">
          <button 
            className="onboarding-btn onboarding-btn-secondary" 
            onClick={skipTour}
          >
            Skip Tour
          </button>
          
          <div className="onboarding-nav">
            {currentStep > 0 && (
              <button 
                className="onboarding-btn onboarding-btn-secondary" 
                onClick={prevStep}
              >
                Previous
              </button>
            )}
            
            <button 
              className="onboarding-btn onboarding-btn-primary" 
              onClick={nextStep}
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 