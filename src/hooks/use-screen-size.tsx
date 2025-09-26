import * as React from "react"

const DESKTOP_BREAKPOINT_WIDTH = 1920
const DESKTOP_BREAKPOINT_HEIGHT = 1080

export function useScreenSize() {
  const [isSmallScreen, setIsSmallScreen] = React.useState<boolean | undefined>(undefined)
  const [screenWidth, setScreenWidth] = React.useState<number | undefined>(undefined)
  const [screenHeight, setScreenHeight] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isSmall = width < DESKTOP_BREAKPOINT_WIDTH || height < DESKTOP_BREAKPOINT_HEIGHT
      
      setIsSmallScreen(isSmall)
      setScreenWidth(width)
      setScreenHeight(height)
    }

    // Check initial screen size
    checkScreenSize()

    // Add event listener for resize
    window.addEventListener("resize", checkScreenSize)
    
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return {
    isSmallScreen: !!isSmallScreen,
    screenWidth: screenWidth || 0,
    screenHeight: screenHeight || 0,
    isMobile: screenWidth ? screenWidth < 768 : false,
    isTablet: screenWidth ? screenWidth >= 768 && screenWidth < 1024 : false,
    isDesktop: screenWidth ? screenWidth >= 1024 : false,
    isLargeDesktop: screenWidth ? screenWidth >= 1920 : false
  }
}

// Hook simplificado para compatibilidad hacia atrás
export function useIsSmallScreen() {
  const { isSmallScreen } = useScreenSize()
  return isSmallScreen
}

