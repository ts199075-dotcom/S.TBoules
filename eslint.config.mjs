import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'dev-dist/**/*', 'node_modules/**/*', 'server/**/*', 'src/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
