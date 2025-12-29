'use client'
import { useState, useRef } from 'react'
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

export default function PrivacyPopup({ isOpen, onClose, onAgree }) {
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
          <h2>Privacy Policy</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="popup-content" ref={contentRef} onScroll={handleScroll}>
          <h3>1. Introduction</h3>
          <p>
            CrashKart ("we", "our", or "us") operates the CrashKart website and app. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
          </p>

          <h3>2. Information Collection and Use</h3>
          <p>We collect several different types of information for various purposes to provide and improve our service to you:</p>
          <ul>
            <li><strong>Personal Data:</strong> While using our service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:
              <ul style={{ marginTop: '8px' }}>
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Cookies and Usage Data</li>
              </ul>
            </li>
            <li><strong>Usage Data:</strong> We may also collect information on how the service is accessed and used ("Usage Data"). This may include information such as your computer's Internet Protocol address, browser type, browser version, pages you visit, the time and date of your visit, and the time spent on those pages.</li>
          </ul>

          <h3>3. Use of Data</h3>
          <p>CrashKart uses the collected data for various purposes:</p>
          <ul>
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To allow you to participate in interactive features of our service when you choose to do so</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our service</li>
            <li>To monitor the usage of our service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>

          <h3>4. Security of Data</h3>
          <p>
            The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
          </p>

          <h3>5. Third-Party Services</h3>
          <p>
            Our service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
          </p>
          <p>
            We have no control over and assume no responsibility for the content, privacy policies or practices of any third-party sites or services.
          </p>

          <h3>6. Children's Privacy</h3>
          <p>
            Our service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from children under 18. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us.
          </p>

          <h3>7. Cookies</h3>
          <p>
            We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
          </p>

          <h3>8. Changes to This Privacy Policy</h3>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
          </p>

          <h3>9. Complaints and Data Rights</h3>
          <p>
            If you have any complaints regarding our privacy practices or wish to exercise your data rights (such as access, correction, or deletion of your personal data), please contact us at privacy@crashkart.com.
          </p>
          <p>
            You have the right to request access to, correction of, or deletion of your personal data, subject to applicable laws. You may also lodge a complaint with your local data protection authority if you believe we have violated your privacy rights.
          </p>

          <h3>10. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@crashkart.com</li>
            <li>Email: crashkart.help@gmail.com</li>
          </ul>
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
