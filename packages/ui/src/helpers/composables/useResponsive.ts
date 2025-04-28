import { ref, onMounted, onUnmounted } from 'vue';

// Default breakpoint for mobile devices (in pixels)
const MOBILE_BREAKPOINT = 700;

/**
 * Composable that provides responsive design utilities
 * @param breakpoint Optional custom breakpoint in pixels (defaults to 700px)
 * @returns Object containing responsive state variables and utility functions
 */
export function useResponsive(breakpoint = MOBILE_BREAKPOINT) {
  const isMobile = ref(false);

  // Update mobile state based on window width
  const updateResponsiveState = () => {
    isMobile.value = window.innerWidth < breakpoint;
  };

  // Initialize on mount
  onMounted(() => {
    updateResponsiveState();
    window.addEventListener('resize', updateResponsiveState);
  });

  // Clean up on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', updateResponsiveState);
  });

  return {
    isMobile,
    updateResponsiveState,
  };
}
