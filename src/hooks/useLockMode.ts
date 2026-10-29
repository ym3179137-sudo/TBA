import { useEffect, useRef, useState } from 'react';

export function useLockMode(isLocked: boolean, onViolation: (type: string) => void) {
    const [violationCount, setViolationCount] = useState(0);
    const isLockedRef = useRef(isLocked);

    useEffect(() => {
        isLockedRef.current = isLocked;
    }, [isLocked]);

    useEffect(() => {
        if (!isLocked) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolationCount(prev => {
                    const newCount = prev + 1;
                    onViolation(`Tab switched (Violation ${newCount})`);
                    return newCount;
                });
            }
        };

        const handleBlur = () => {
            onViolation('Window focus lost');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isLocked, onViolation]);

    return { violationCount };
}