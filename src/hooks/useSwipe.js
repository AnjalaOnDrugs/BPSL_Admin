import { useState, useEffect } from 'react';

const useSwipe = ({ onSwipeLeft, onSwipeRight, minSwipeDistance = 50 }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // the required distance between touchStart and touchEnd to be detected as a swipe
    const minSwipeDistancePx = minSwipeDistance;

    const onTouchStart = (e) => {
        setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistancePx;
        const isRightSwipe = distance < -minSwipeDistancePx;

        if (isLeftSwipe) {
            onSwipeLeft && onSwipeLeft();
        }

        if (isRightSwipe) {
            onSwipeRight && onSwipeRight();
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};

export default useSwipe;
