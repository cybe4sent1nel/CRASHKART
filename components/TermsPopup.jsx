'use client'
import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import styled from 'styled-components'

const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`

const PopupContainer = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .popup-header {
    padding: 24px;
    border-bottom: 2px solid rgb(241, 241, 130);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: rgb(0, 2, 65);
    }

    button {
      background: none;
      border: none;
      cursor: pointer;
      color: rgb(0, 2, 65);
      transition: all 300ms ease;

      &:hover {
        transform: scale(1.1);
        color: rgb(239, 68, 68);
      }
    }
  }

  .popup-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    font-size: 14px;
    line-height: 1.8;
    color: rgba(0, 2, 65, 0.8);

    h3 {
      color: rgb(0, 2, 65);
      font-weight: 700;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 16px;
    }

    p {
      margin: 0 0 12px 0;
    }

    ul, ol {
      margin: 12px 0 12px 20px;
      padding: 0;

      li {
        margin-bottom: 8px;
      }
    }
  }

  .popup-footer {
    padding: 20px 24px;
    border-top: 2px solid rgb(241, 241, 130);
    display: flex;
    gap: 12px;

    button {
      flex: 1;
      padding: 14px 16px;
      border-radius: 10px;
      border: 2px solid rgb(0, 2, 65);
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 300ms ease;
      font-family: inherit;

      &.close-btn {
        background: rgba(0, 2, 65, 0.1);
        color: rgb(0, 2, 65);

        &:hover {
          background: rgba(0, 2, 65, 0.2);
        }
      }

      &.agree-btn {
        background: rgb(241, 241, 130);
        color: rgb(0, 2, 65);
        box-shadow: 2px 2px rgb(0, 2, 65);

        &:hover:not(:disabled) {
          background: rgb(235, 255, 59);
          box-shadow: 3px 3px rgb(0, 2, 65);
          transform: translate(-1px, -1px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: 2px 2px rgb(0, 2, 65);
        }
      }
    }
  }

  .scroll-hint {
    color: rgb(239, 68, 68);
    font-weight: 600;
    text-align: center;
    margin-bottom: 8px;
    font-size: 13px;
  }
`

export default function TermsPopup({ isOpen, onClose, onAgree }) {
  const [canAgree, setCanAgree] = useState(false)
  const contentRef = useRef(null)

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50
      setCanAgree(isNearBottom)
    }
  }

  const handleAgree = () => {
    if (canAgree) {
      onAgree()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <PopupOverlay onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Terms of Service</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="popup-content" ref={contentRef} onScroll={handleScroll}>
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing and using CrashKart, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h3>2. Use of Service</h3>
          <p>
            You agree to use this site only for lawful purposes, and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the site. Prohibited behavior includes:
          </p>
          <ul>
            <li>Harassing or causing distress or inconvenience to any person</li>
            <li>Obscene or abusive language or imagery</li>
            <li>Disrupting the normal flow of dialogue within our site</li>
            <li>Attempting to gain unauthorized access to our systems</li>
          </ul>

          <h3>3. Intellectual Property Rights</h3>
          <p>
            Unless otherwise stated, CrashKart and/or its licensors own the intellectual property rights for all material on this site. All intellectual property rights are reserved. You may view and print pages from the site for personal use, subject to restrictions set in these terms and conditions.
          </p>

          <h3>4. User Content</h3>
          <p>
            You retain all rights to any content you submit, post or display on or through the site. By submitting, posting or displaying content on or through the site, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, and distribute it in any media.
          </p>

          <h3>5. Product Information</h3>
          <p>
            We strive to provide accurate product descriptions and pricing. However, CrashKart does not warrant that product descriptions, pricing, or other content on the site is accurate, complete, reliable, current, or error-free.
          </p>

          <h3>6. Pricing and Availability</h3>
          <p>
            All prices are subject to change without notice. We reserve the right to limit quantities and to discontinue any product. Products are subject to availability, and we reserve the right to discontinue any product at any time.
          </p>

          <h3>7. Payment and Billing</h3>
          <p>
            By placing an order, you warrant that you are at least 18 years of age or have parental permission and are legally capable of entering into binding contracts. You agree to pay all charges that you incur.
          </p>

          <h3>8. Shipping and Delivery</h3>
          <p>
            We will make every effort to fulfill orders as quickly as possible. However, CrashKart is not responsible for delays or failures in delivery that result from causes beyond our control.
          </p>

          <h3>9. Returns and Refunds</h3>
          <p>
            Please refer to our Returns Policy for information about returning items and requesting refunds. All returns must be initiated within 30 days of purchase.
          </p>

          <h3>10. Limitation of Liability</h3>
          <p>
            In no event shall CrashKart, nor its owners, employees, or agents, be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>

          <h3>11. Complaints and Grievances</h3>
          <p>
            If you have any complaints or grievances regarding our services, products, or conduct, please contact us at complaints@crashkart.com or submit a complaint through our Help Center. We aim to resolve all complaints within 7 business days.
          </p>
          <p>
            You may also file a complaint with the relevant regulatory authority in your jurisdiction if you believe we have violated consumer protection laws.
          </p>

          <h3>12. Governing Law</h3>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which CrashKart operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>

          <h3>13. Changes to Terms</h3>
          <p>
            CrashKart reserves the right to change these terms and conditions at any time. Your continued use of the site following the posting of revised terms means that you accept and agree to the changes.
          </p>

          <h3>14. Contact Information</h3>
          <p>
            If you have any questions about these terms and conditions, please contact us at crashkart.help@gmail.com.
          </p>
        </div>

        <div className="popup-footer">
          {!canAgree && <div className="scroll-hint">Scroll down to enable agree button</div>}
          <button className="close-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="agree-btn"
            disabled={!canAgree}
            onClick={handleAgree}
          >
            I Agree
          </button>
        </div>
      </PopupContainer>
    </PopupOverlay>
  )
}
