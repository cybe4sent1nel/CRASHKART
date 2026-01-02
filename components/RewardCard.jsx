import React from 'react'
import styled from 'styled-components'
import { Copy, Trash2, Clock, Gift, Check, Tag, Sparkles, Heart, Star, Smile } from 'lucide-react'

function hashStringToHue(str) {
    let hash = 0
    for (let i = 0; i < (str || '').length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash) % 360
}

export default function RewardCard({ item, onCopy, onUse, onDelete, isExpired, getTimeRemaining }) {
    const seed = item.code || String(item.id) || JSON.stringify(item)
    const hue = hashStringToHue(seed)
    const accentGradient = `linear-gradient(135deg, hsl(${hue} 85% 78%), hsl(${(hue + 30) % 360} 82% 68%))`
    const accentShadow = `0 10px 22px hsla(${hue} 70% 55% / 0.25)`
    const accentIcons = [Sparkles, Heart, Star, Smile, Gift]
    const AccentIcon = accentIcons[Math.abs(Math.floor(hue)) % accentIcons.length]

    // GPay-like background confetti patterns (lightweight CSS-only)
    const patterns = [
        {
            backgroundImage:
                `radial-gradient(circle at 20% 20%, rgba(15,23,42,0.08) 6px, transparent 8px),
                 radial-gradient(circle at 80% 30%, rgba(15,23,42,0.06) 5px, transparent 7px),
                 radial-gradient(circle at 35% 70%, rgba(15,23,42,0.08) 7px, transparent 9px),
                 radial-gradient(circle at 75% 75%, rgba(15,23,42,0.05) 10px, transparent 12px)`,
            size: '120px 120px'
        },
        {
            backgroundImage:
                `radial-gradient(circle at 30% 30%, rgba(15,23,42,0.07) 4px, transparent 7px),
                 radial-gradient(circle at 70% 25%, rgba(15,23,42,0.08) 9px, transparent 12px),
                 radial-gradient(circle at 60% 70%, rgba(15,23,42,0.05) 6px, transparent 9px),
                 radial-gradient(circle at 20% 80%, rgba(15,23,42,0.07) 8px, transparent 11px)`,
            size: '140px 140px'
        },
        {
            backgroundImage:
                `radial-gradient(circle at 50% 20%, rgba(15,23,42,0.08) 7px, transparent 10px),
                 radial-gradient(circle at 25% 60%, rgba(15,23,42,0.06) 5px, transparent 8px),
                 radial-gradient(circle at 75% 55%, rgba(15,23,42,0.05) 12px, transparent 15px),
                 radial-gradient(circle at 40% 85%, rgba(15,23,42,0.06) 7px, transparent 10px)`,
            size: '160px 160px'
        }
    ]

    const pattern = patterns[Math.abs(Math.floor(hue)) % patterns.length]

    return (
        <StyledWrapper className={isExpired ? 'expired' : ''}>
            <div className="card" style={{ boxShadow: accentShadow }}>
                <div className="accent" style={{ background: accentGradient }}>
                    <div className="accent-icon">
                        <AccentIcon size={16} />
                    </div>
                </div>
                <div className="pattern" style={{ backgroundImage: pattern.backgroundImage, backgroundSize: pattern.size }} />
                <div className="bg-blob" style={{ background: accentGradient }}>
                    <AccentIcon
                        size={42}
                        className="blob-icon"
                        style={{ color: `hsl(${hue} 60% 42%)`, opacity: 0.5 }}
                    />
                </div>
                <div className="pricing-block-content">
                    <p className="pricing-plan">{item.rewardType === 'discount' ? 'Coupon' : 'CrashCash'}</p>

                    <div className="price-value" data-currency="$ USD" data-currency-simple="USD">
                        {item.rewardType === 'discount' ? (
                            <p className="price-number">{item.discount}%</p>
                        ) : (
                            <p className="price-number">₹<span className="price-integer">{item.amount || 0}</span></p>
                        )}
                        <div id="priceDiscountCent">{item.rewardType === 'discount' ? 'coupon' : '/use'}</div>
                    </div>

                    <div className="pricing-note">{getTimeRemaining?.(item.expiryDate || item.expiresAt) || 'No expiry'}</div>

                    <ul className="check-list" role="list">
                        <li className="check-list-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                            Ready to use
                        </li>
                        <li className="check-list-item">
                            <div className="coupon-box">
                                <Tag size={14} />
                                <span className="coupon-code">{item.code || 'No code'}</span>
                            </div>
                        </li>
                        <li className="check-list-item">Earned: {(item.earnedAt || item.scratchedAt)
                            ? new Date(item.earnedAt || item.scratchedAt).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', hour12: true
                              })
                            : 'N/A'
                        }</li>
                    </ul>

                    <div className="actions">
                        <button onClick={onCopy} className="action-btn" title="Copy">
                            <Copy size={16} />
                        </button>
                        {!isExpired && (
                            <button onClick={onUse} className="action-cta">Use</button>
                        )}
                        <button onClick={onDelete} className="action-delete" title="Delete">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </StyledWrapper>
    )
}

const StyledWrapper = styled.div`
    display:inline-block;

    .card {
        position: relative;
        width: 260px;
        background: #ffffff;
        padding: 1.1rem 1.15rem 1.2rem;
        border-radius: 16px;
        border: 1px solid rgba(5,6,15,0.06);
        box-shadow: 0 12px 24px rgba(2,6,23,0.12), 0 6px 12px rgba(2,6,23,0.06);
        overflow: hidden;
        color: #05060f;
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        margin: 8px;
        isolation: isolate;
    }

    .card:hover { transform: translateY(-6px); box-shadow: 0 20px 36px rgba(2,6,23,0.16), 0 10px 18px rgba(2,6,23,0.08); border-color: rgba(5,6,15,0.12); }

    .accent {
        position: absolute;
        inset: 0;
        height: 34%;
        border-radius: 16px 16px 40px 40px;
        opacity: 0.18;
        z-index: 0;
    }

    .pattern {
        position: absolute;
        inset: 0;
        opacity: 0.16;
        z-index: 0;
        pointer-events: none;
    }

    .bg-blob {
        position: absolute;
        width: 140px;
        height: 140px;
        border-radius: 40px;
        opacity: 0.22;
        bottom: -10px;
        right: -6px;
        filter: blur(0.15px);
        z-index: 0;
        display: grid;
        place-items: center;
    }

    .blob-icon { color: rgba(15,23,42,0.55); opacity: 0.5; }

    .accent-icon {
        position: absolute;
        right: 14px;
        top: 12px;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: rgba(255,255,255,0.65);
        display: grid;
        place-items: center;
        color: #111827;
        box-shadow: 0 6px 12px rgba(0,0,0,0.08);
        z-index: 1;
    }

  .pricing-block-content { display:flex; flex-direction:column; gap:0.5rem }
    .pricing-plan { color:#0f172a; font-size:1.05rem; font-weight:700 }
    .price-value { display:flex; align-items:baseline; gap:6px; font-weight:800; font-size:1rem }
    .pricing-note { opacity:0.85; font-size:0.85rem }
    .check-list { margin-top:0.35rem; display:flex; flex-direction:column; gap:0.25rem; z-index: 1; position: relative; }
    .check-list-item { display:flex; align-items:center; gap:8px; font-size:0.9rem }

    .coupon-box {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border: 1.5px dashed rgba(15,23,42,0.35);
        border-radius: 12px;
        background: rgba(255,255,255,0.85);
        position: relative;
    }

    .coupon-box::before,
    .coupon-box::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        border: 1px solid rgba(15,23,42,0.08);
        transform: translateY(-50%);
    }

    .coupon-box::before { left: -6px; box-shadow: 2px 0 4px rgba(0,0,0,0.04); }
    .coupon-box::after { right: -6px; box-shadow: -2px 0 4px rgba(0,0,0,0.04); }

    .coupon-code { font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; letter-spacing: 0.6px; font-weight: 700; color: #0f172a; }

  .actions { display:flex; gap:8px; align-items:center; margin-top:6px }
  .action-btn { background:rgba(255,255,255,0.8); border-radius:6px; padding:6px; display:inline-flex; align-items:center; justify-content:center }
    .action-cta { padding:8px 12px; background:#05060f; color:white; border-radius:10px; font-weight:700; box-shadow: 0 6px 12px rgba(5,6,15,0.12) }
  .action-delete { background:transparent; color:rgba(0,0,0,0.6); padding:6px }

  &.expired .card { opacity:0.6 }
`
