'use client'
import styled, { keyframes } from 'styled-components'

const rotate = keyframes`
  100% {
    transform: rotate(1turn);
  }
`

const PatternContainer = styled.div`
  overflow: hidden;
  background-color: ${props => props.theme === 'dark' ? '#0a0a0a' : '#f0f9ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  inset: 0;
  z-index: -1;
`

const Conic = styled.div`
  position: absolute;
  inset: 0;
  background-image: ${props => props.theme === 'dark'
    ? 'conic-gradient(from 230.29deg at 51.63% 52.16%, rgb(36, 0, 255) 0deg, rgb(0, 135, 255) 67.5deg, rgb(108, 39, 157) 198.75deg, rgb(24, 38, 163) 251.25deg, rgb(54, 103, 196) 301.88deg, rgb(105, 30, 255) 360deg)'
    : 'conic-gradient(from 230.29deg at 51.63% 52.16%, rgb(99, 102, 241) 0deg, rgb(34, 211, 238) 67.5deg, rgb(147, 51, 234) 198.75deg, rgb(59, 130, 246) 251.25deg, rgb(99, 102, 241) 301.88deg, rgb(168, 85, 247) 360deg)'
  };
  opacity: ${props => props.theme === 'dark' ? '0.4' : '0.3'};
  filter: blur(150px);
  border-radius: 50%;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  animation: ${rotate} 20s linear infinite;
`

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${props => props.theme === 'dark'
    ? 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)'
    : 'radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.9) 100%)'
  };
`

export default function AuroraPattern({ theme = 'dark' }) {
  return (
    <PatternContainer theme={theme}>
      <Conic theme={theme} />
      <Overlay theme={theme} />
    </PatternContainer>
  )
}
