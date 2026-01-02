import nextConfig from 'eslint-config-next'

export default [
  // Keep build artifacts and deps out of lint scope
  {
    ignores: ['.next/**', 'node_modules/**', 'app/api/auth/reset-password/route.js']
  },
  // Apply the base Next.js config first
  ...nextConfig,
  // Then override noisy rules project-wide
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
      'import/no-anonymous-default-export': 'off'
    }
  }
]
