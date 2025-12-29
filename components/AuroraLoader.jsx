'use client'
import styled, { keyframes } from 'styled-components'

const squareAnimation = keyframes`
  0% {
    left: 0;
    top: 0;
  }
  10.5% {
    left: 0;
    top: 0;
  }
  12.5% {
    left: 32px;
    top: 0;
  }
  23% {
    left: 32px;
    top: 0;
  }
  25% {
    left: 64px;
    top: 0;
  }
  35.5% {
    left: 64px;
    top: 0;
  }
  37.5% {
    left: 64px;
    top: 32px;
  }
  48% {
    left: 64px;
    top: 32px;
  }
  50% {
    left: 32px;
    top: 32px;
  }
  60.5% {
    left: 32px;
    top: 32px;
  }
  62.5% {
    left: 32px;
    top: 64px;
  }
  73% {
    left: 32px;
    top: 64px;
  }
  75% {
    left: 0;
    top: 64px;
  }
  85.5% {
    left: 0;
    top: 64px;
  }
  87.5% {
    left: 0;
    top: 32px;
  }
  98% {
    left: 0;
    top: 32px;
  }
  100% {
    left: 0;
    top: 0;
  }
`

const LoaderContainer = styled.div`
  --square: 26px;
  --offset: 30px;
  --duration: 2.4s;
  --delay: 0.2s;
  --timing-function: ease-in-out;
  --in-duration: 0.4s;
  --in-delay: 0.1s;
  --in-timing-function: ease-out;
  width: calc(3 * var(--offset) + var(--square));
  height: calc(2 * var(--offset) + var(--square));
  padding: 0px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 10px;
  margin-bottom: 30px;
  position: relative;
`

const Square = styled.div`
  display: inline-block;
  background: ${props => props.color};
  border: none;
  border-radius: 2px;
  width: var(--square);
  height: var(--square);
  position: absolute;
  padding: 0px;
  margin: 0px;
  font-size: 6pt;
  color: black;

  &.square-1 {
    left: calc(0 * var(--offset));
    top: calc(0 * var(--offset));
    animation: ${squareAnimation} var(--duration) var(--timing-function) 0s infinite,
      fadein var(--in-duration) var(--in-timing-function) 0s 1;
  }

  &.square-2 {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
    animation: ${squareAnimation} var(--duration) var(--timing-function) calc(1 * var(--delay)) infinite,
      fadein var(--in-duration) var(--in-timing-function) calc(1 * var(--in-delay)) 1;
  }

  &.square-3 {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
    animation: ${squareAnimation} var(--duration) var(--timing-function) calc(2 * var(--delay)) infinite,
      fadein var(--in-duration) var(--in-timing-function) calc(2 * var(--in-delay)) 1;
  }

  &.square-4 {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
    animation: ${squareAnimation} var(--duration) var(--timing-function) calc(3 * var(--delay)) infinite,
      fadein var(--in-duration) var(--in-timing-function) calc(3 * var(--in-delay)) 1;
  }

  &.square-5 {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
    animation: ${squareAnimation} var(--duration) var(--timing-function) calc(4 * var(--delay)) infinite,
      fadein var(--in-duration) var(--in-timing-function) calc(4 * var(--in-delay)) 1;
  }

  @keyframes fadein {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`

export default function AuroraLoader() {
  return (
    <LoaderContainer>
      <Square className="square-1" color="#10b981" />
      <Square className="square-2" color="#06b6d4" />
      <Square className="square-3" color="#8b5cf6" />
      <Square className="square-4" color="#ec4899" />
      <Square className="square-5" color="#f59e0b" />
    </LoaderContainer>
  )
}
