const hasUppercase = (v = '') => /[A-Z]/.test(v)
const hasLowercase = (v = '') => /[a-z]/.test(v)
const hasNumber = (v = '') => /\d/.test(v)
const hasSymbol = (v = '') => /[^A-Za-z0-9]/.test(v)

export function passwordIssues(password = '') {
    const issues = []
    if (!password || password.length < 8) issues.push('At least 8 characters')
    if (!hasUppercase(password)) issues.push('One uppercase letter')
    if (!hasLowercase(password)) issues.push('One lowercase letter')
    if (!hasNumber(password)) issues.push('One number')
    if (!hasSymbol(password)) issues.push('One special character')
    return issues
}

export function passwordStrength(password = '') {
    const checks = [
        password.length >= 8,
        hasUppercase(password),
        hasLowercase(password),
        hasNumber(password),
        hasSymbol(password),
    ]

    const passed = checks.filter(Boolean).length
    const labels = ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong']
    const label = labels[Math.max(0, Math.min(labels.length - 1, passed - 1))]
    const percent = Math.min(100, Math.round((passed / 5) * 100))

    return { score: passed, label, percent }
}

export default { passwordIssues, passwordStrength }
