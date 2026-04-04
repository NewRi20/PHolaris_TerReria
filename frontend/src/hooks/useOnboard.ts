import {  OnboardingContext } from '../setup/app-context-manager/OnBoardingContext';
import { useContext } from 'react';

export const useOnboard = () => {
    const context = useContext(OnboardingContext);
    
    if (!context) {
        throw new Error('useOnboard must be used within an OnboardingProvider');
    }

    return context;
}